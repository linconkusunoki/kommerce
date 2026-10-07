import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getDb } from "./db/schema.ts";
import { createContainer } from "./lib/container.ts";
import { ORDER_STATUSES } from "./types/index.ts";
import { validateEnv } from "./lib/env.ts";

validateEnv();
const services = createContainer(getDb());

const server = new McpServer({
  name: "kommerce",
  version: "1.0.0",
});

// ─── Products ──────────────────────────────────────────────────────────────

server.tool(
  "search_products",
  "Search products by name or description",
  { query: z.string().describe("Search term") },
  async ({ query }) => {
    const results = await services.productService.search(query);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  },
);

server.tool("list_products", "List all products with stock information", {}, async () => {
  const products = await services.productService.getAll();
  return {
    content: [{ type: "text", text: JSON.stringify(products, null, 2) }],
  };
});

server.tool(
  "get_product",
  "Get a single product by ID or slug",
  {
    id: z.union([z.number(), z.string()]).optional().describe("Product ID"),
    slug: z.string().optional().describe("Product slug"),
  },
  async ({ id, slug }) => {
    if (!id && !slug) {
      return { content: [{ type: "text", text: "Provide either id or slug" }], isError: true };
    }
    const product = slug ? await services.productService.getBySlug(slug) : await services.productService.getById(id!);
    if (!product) {
      return { content: [{ type: "text", text: "Product not found" }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
    };
  },
);

server.tool(
  "get_product_variants",
  "Get all variants (size/color/stock) for a product by ID or slug",
  {
    product_id: z.union([z.number(), z.string()]).optional().describe("Product ID"),
    slug: z.string().optional().describe("Product slug"),
  },
  async ({ product_id, slug }) => {
    if (!product_id && !slug) {
      return { content: [{ type: "text", text: "Provide either product_id or slug" }], isError: true };
    }
    const product = slug ? await services.productService.getBySlug(slug) : null;
    if (slug && !product) {
      return { content: [{ type: "text", text: "Product not found" }], isError: true };
    }
    const variants = await services.productService.getVariants(product?.id ?? product_id!);
    return {
      content: [{ type: "text", text: JSON.stringify(variants, null, 2) }],
    };
  },
);

server.tool("get_featured_products", "Get featured/highlighted products", {}, async () => {
  const products = await services.productService.getFeatured();
  return {
    content: [{ type: "text", text: JSON.stringify(products, null, 2) }],
  };
});

// ─── Categories ────────────────────────────────────────────────────────────

server.tool("list_categories", "List all product categories with product counts", {}, async () => {
  const categories = await services.categoryService.getAllWithCount();
  return {
    content: [{ type: "text", text: JSON.stringify(categories, null, 2) }],
  };
});

server.tool(
  "get_products_by_category",
  "Get all products in a specific category",
  { category_id: z.number().describe("Category ID") },
  async ({ category_id }) => {
    const products = await services.productService.getByCategory(category_id);
    return {
      content: [{ type: "text", text: JSON.stringify(products, null, 2) }],
    };
  },
);

// ─── Orders ────────────────────────────────────────────────────────────────

server.tool(
  "list_orders",
  "List all orders, optionally filtered by status",
  {
    status: z.enum(ORDER_STATUSES).optional().describe("Filter by order status"),
  },
  async ({ status }) => {
    const result = await services.orderService.listOrders(status);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "get_order",
  "Get a single order with its items by order number or ID",
  {
    order_number: z.string().optional().describe("Order number (e.g. ORD-123456)"),
    id: z.union([z.number(), z.string()]).optional().describe("Order ID"),
  },
  async ({ order_number, id }) => {
    if (!order_number && !id) {
      return { content: [{ type: "text", text: "Provide either order_number or id" }], isError: true };
    }
    const result = order_number
      ? await services.orderService.getOrderByNumber(order_number)
      : await services.orderService.getOrderById(id!);
    if (!result) {
      return { content: [{ type: "text", text: "Order not found" }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "update_order_status",
  "Update the status of an order",
  {
    id: z.union([z.number(), z.string()]).describe("Order ID"),
    status: z.enum(ORDER_STATUSES).describe("New status"),
  },
  async ({ id, status }) => {
    await services.orderService.updateStatus(id, status);
    return {
      content: [{ type: "text", text: `Order ${id} updated to "${status}"` }],
    };
  },
);

// ─── Dashboard ─────────────────────────────────────────────────────────────

server.tool("get_dashboard_stats", "Get store statistics: revenue, order counts, product counts", {}, async () => {
  const stats = await services.dashboardService.getStats();
  return {
    content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
  };
});

// ─── Start ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
