import { GoogleGenAI, Type, type FunctionDeclaration } from "@google/genai";
import type { Services } from "./lib/container.ts";

const DEFAULT_MODEL = "gemini-flash-lite-latest";
const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const RETRY_DELAYS_MS = [500, 1500];
const MAX_TOOL_ROUNDS = 5;
const GEMINI_REQUEST_TIMEOUT_MS = 15_000;

type GeminiError = { status?: number };

export function isRetryableGeminiError(error: unknown): boolean {
  const status = (error as GeminiError)?.status;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export function isUnavailableGeminiModelError(error: unknown): boolean {
  return (error as GeminiError)?.status === 404;
}

export async function withGeminiRetry<T>(operation: () => Promise<T>, delays = RETRY_DELAYS_MS): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const delay = delays[attempt];
      if (!isRetryableGeminiError(error) || delay === undefined) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function withGeminiTimeout<T>(operation: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject({ status: 504, message: "Gemini request timed out" }), GEMINI_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_products",
    description: "Search products by name or description",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Search term" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_categories",
    description: "List all product categories with product counts",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "get_product",
    description: "Get a single product by slug",
    parameters: {
      type: Type.OBJECT,
      properties: {
        slug: { type: Type.STRING, description: "Product slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_featured_products",
    description: "Get featured/highlighted products",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "get_products_by_category",
    description: "Get all products in a specific category by category ID",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category_id: { type: Type.NUMBER, description: "Category ID" },
      },
      required: ["category_id"],
    },
  },
  {
    name: "get_product_variants",
    description: "Get all size, color and stock variants for a product. Use slug when the product ID is not known.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        product_id: { type: Type.NUMBER, description: "Product ID, if known" },
        slug: { type: Type.STRING, description: "Product slug" },
      },
    },
  },
];

const SYSTEM = `You are a friendly shopping assistant for Kommerce, a clothing store.
Help customers find products, check availability, sizes, colors, and answer questions.
Keep responses concise and helpful. When listing products, include name and price.
When asked about a product's sizes, colors, or stock, always call get_product_variants. Use the product slug if you do not have its numeric ID.
If a follow-up uses words like "it" or "that product" and more than one product is in context, ask which product they mean.
If asked about orders or anything outside your tools, politely ask them to contact support.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Chat = (messages: ChatMessage[]) => Promise<string>;

export function createChat(services: Services, apiKey = process.env.GEMINI_API_KEY): Chat {
  const genAI = new GoogleGenAI({ apiKey: apiKey! });
  const models = [process.env.GEMINI_MODEL || DEFAULT_MODEL];
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  if (fallbackModel !== models[0]) models.push(fallbackModel);

  async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    async function addVariants<T extends { id: number }>(product: T): Promise<T & { variants: unknown }> {
      return { ...product, variants: await services.productService.getVariants(product.id) };
    }

    switch (name) {
      case "search_products":
        return Promise.all((await services.productService.search(args.query as string)).map(addVariants));
      case "list_categories":
        return services.categoryService.getAllWithCount();
      case "get_product": {
        const product = await services.productService.getBySlug(args.slug as string);
        return product ? addVariants(product) : null;
      }
      case "get_featured_products":
        return services.productService.getFeatured();
      case "get_products_by_category":
        return services.productService.getByCategory(args.category_id as number);
      case "get_product_variants":
        if (args.slug) {
          const product = await services.productService.getBySlug(args.slug as string);
          return product ? services.productService.getVariants(product.id) : { error: "Product not found" };
        }
        if (args.product_id !== undefined) return services.productService.getVariants(args.product_id as number);
        return { error: "Provide either product_id or slug" };
      default:
        return { error: "Unknown tool" };
    }
  }

  return async function chat(messages: ChatMessage[]): Promise<string> {
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages.at(-1)!.content;

    let lastError: unknown;
    for (const modelName of models) {
      try {
        return await withGeminiRetry(async () => {
          const session = genAI.chats.create({
            model: modelName,
            history,
            config: {
              tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
              systemInstruction: SYSTEM,
            },
          });
          let result = await withGeminiTimeout(() => session.sendMessage({ message: lastMessage }));

          let toolRound = 0;
          while (result.functionCalls?.length && toolRound < MAX_TOOL_ROUNDS) {
            toolRound++;
            const calls = result.functionCalls;
            const responses = await Promise.all(
              calls.map(async (call) => {
                if (!call.name) throw new Error("Gemini returned a function call without a name");
                return {
                  functionResponse: {
                    name: call.name,
                    response: {
                      result: await withGeminiTimeout(() =>
                        executeTool(call.name!, call.args as Record<string, unknown>),
                      ),
                    },
                  },
                };
              }),
            );
            result = await withGeminiTimeout(() => session.sendMessage({ message: responses }));
          }

          if (result.functionCalls?.length) {
            throw new Error(`Gemini exceeded the ${MAX_TOOL_ROUNDS}-round tool-call limit`);
          }

          return result.text ?? "I could not generate a response.";
        });
      } catch (error) {
        lastError = error;
        if (!isRetryableGeminiError(error) && !isUnavailableGeminiModelError(error)) throw error;
      }
    }

    throw lastError;
  };
}
