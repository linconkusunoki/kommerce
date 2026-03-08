import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { getDb } from "./db/schema.ts";
import { SqliteProductRepository } from "./repositories/ProductRepository.ts";
import { SqliteVariantRepository } from "./repositories/VariantRepository.ts";
import { SqliteCategoryRepository } from "./repositories/CategoryRepository.ts";
import { ProductService } from "./services/ProductService.ts";
import { CategoryService } from "./services/CategoryService.ts";

const db = getDb();
const productService = new ProductService(new SqliteProductRepository(db), new SqliteVariantRepository(db));
const categoryService = new CategoryService(new SqliteCategoryRepository(db));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_products",
    description: "Search products by name or description",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "Search term" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_categories",
    description: "List all product categories with product counts",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "get_product",
    description: "Get a single product by slug",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        slug: { type: SchemaType.STRING, description: "Product slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_featured_products",
    description: "Get featured/highlighted products",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "get_products_by_category",
    description: "Get all products in a specific category by category ID",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category_id: { type: SchemaType.NUMBER, description: "Category ID" },
      },
      required: ["category_id"],
    },
  },
  {
    name: "get_product_variants",
    description: "Get all size, color and stock variants for a product",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        product_id: { type: SchemaType.NUMBER, description: "Product ID" },
      },
      required: ["product_id"],
    },
  },
];

const SYSTEM = `You are a friendly shopping assistant for Kommerce, a clothing store.
Help customers find products, check availability, sizes, colors, and answer questions.
Keep responses concise and helpful. When listing products, include name and price.
If asked about orders or anything outside your tools, politely ask them to contact support.`;

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "search_products":
      return productService.search(args.query as string);
    case "list_categories":
      return categoryService.getAllWithCount();
    case "get_product":
      return productService.getBySlug(args.slug as string);
    case "get_featured_products":
      return productService.getFeatured();
    case "get_products_by_category":
      return productService.getByCategory(args.category_id as number);
    case "get_product_variants":
      return productService.getVariants(args.product_id as number);
    default:
      return { error: "Unknown tool" };
  }
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function chat(messages: ChatMessage[]): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    systemInstruction: SYSTEM,
  });

  // Convert to Gemini history format (all but last message)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const session = model.startChat({ history });
  const lastMessage = messages.at(-1)!.content;

  let result = await session.sendMessage(lastMessage);

  // Agentic loop — handle tool calls
  while (result.response.functionCalls()?.length) {
    const calls = result.response.functionCalls()!;

    const responses = await Promise.all(
      calls.map(async (call) => ({
        functionResponse: {
          name: call.name,
          response: { result: await executeTool(call.name, call.args as Record<string, unknown>) },
        },
      })),
    );

    result = await session.sendMessage(responses);
  }

  return result.response.text();
}
