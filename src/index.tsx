import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { serveStatic } from "hono/bun";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { migrate } from "./db/schema.ts";
import { seed } from "./db/seed.ts";
import { requireAuth } from "./middleware/auth.ts";
import { visitorSession } from "./middleware/visitor.ts";
import { getDb } from "./db/schema.ts";
import { AdminLayout } from "./components/AdminLayout.tsx";
import { createContainer } from "./lib/container.ts";
import { SqliteVisitorRepository } from "./repositories/VisitorRepository.ts";
import { createHome } from "./routes/home.tsx";
import { createProduct } from "./routes/product.tsx";
import { createCart } from "./routes/cart.tsx";
import { createCheckout } from "./routes/checkout.tsx";
import { createCategory } from "./routes/category.tsx";
import { createSearch } from "./routes/search.tsx";
import { createAdminAuth } from "./routes/admin/auth.tsx";
import { createAdminProducts } from "./routes/admin/products.tsx";
import { createAdminCategories } from "./routes/admin/categories.tsx";
import { createAdminOrders } from "./routes/admin/orders.tsx";
import { createChatRoute } from "./routes/chat.ts";
import { createChat } from "./chatbot.ts";
import type { AppEnv } from "./types/context.ts";

const app = new Hono<AppEnv>();
const db = getDb();
const services = createContainer(db);
const chat = createChat(services);

// CSRF protection for all state-mutating requests
app.use("*", csrf());

// Compression for all responses
app.use("*", compress());

// Static files with long-term caching
app.use("/styles/*", async (c, next) => {
  await next();
  c.header("Cache-Control", "public, max-age=31536000, immutable");
});
app.use("/styles/*", serveStatic({ root: "./src" }));
app.use("/public/*", serveStatic({ root: "./" }));

// DOCTYPE for all HTML responses
app.use("*", async (c, next) => {
  await next();
  if (c.res.headers.get("Content-Type")?.startsWith("text/html")) {
    const html = await c.res.text();
    if (!html.startsWith("<!DOCTYPE")) {
      c.res = new Response("<!DOCTYPE html>" + html, {
        status: c.res.status,
        headers: c.res.headers,
      });
    }
  }
});

// Visitor session for all public routes
app.use("*", visitorSession);

// 1-year cache for public GET pages
app.use("/", async (c, next) => {
  await next();
  c.header("Cache-Control", "public, max-age=31536000");
});
app.use("/products/*", async (c, next) => {
  await next();
  c.header("Cache-Control", "public, max-age=31536000");
});

// Add logger
app.use(logger());

// CSRF token endpoint for JS clients
app.get("/csrf-token", (c) => c.json({ ok: true }));

// Chat API
app.route("/", createChatRoute(chat));

// Public routes
app.route("/", createHome(services));
app.route("/", createProduct(services));
app.route("/", createCart(services));
app.route("/", createCheckout(services));
app.route("/", createCategory(services));
app.route("/", createSearch(services));

// Admin auth (no middleware)
app.route("/admin", createAdminAuth(services));

// Protected admin routes
const admin = new Hono<AppEnv>();
admin.use("*", requireAuth);

admin.get("/", (c) => {
  const stats = services.dashboardService.getStats();
  return c.html(
    <AdminLayout title="Dashboard">
      <div class="admin-stats">
        <div class="stat-card">
          <span class="stat-number">{stats.productCount}</span>
          <span class="stat-label">Products</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{stats.categoryCount}</span>
          <span class="stat-label">Categories</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{stats.orderCount}</span>
          <span class="stat-label">Orders</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{stats.pendingOrders}</span>
          <span class="stat-label">Pending Orders</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${stats.totalRevenue.toFixed(2)}</span>
          <span class="stat-label">Total Revenue</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${stats.monthRevenue.toFixed(2)}</span>
          <span class="stat-label">Revenue This Month</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${stats.avgOrder.toFixed(2)}</span>
          <span class="stat-label">Avg Order Value</span>
        </div>
      </div>
    </AdminLayout>,
  );
});

admin.route("/products", createAdminProducts(services));
admin.route("/categories", createAdminCategories(services));
admin.route("/orders", createAdminOrders(services));

app.route("/admin", admin);

// Init database and start
migrate();
await seed();

// Clean up expired visitor sessions on startup
new SqliteVisitorRepository(getDb()).deleteExpiredSessions();

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Server running at http://localhost:3000");
