import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { migrate } from "./db/schema.ts";
import { seed } from "./db/seed.ts";
import { requireAuth } from "./middleware/auth.ts";
import { visitorSession } from "./middleware/visitor.ts";
import { getDb } from "./db/schema.ts";
import { AdminLayout } from "./components/AdminLayout.tsx";
import home from "./routes/home.tsx";
import product from "./routes/product.tsx";
import cart from "./routes/cart.tsx";
import checkout from "./routes/checkout.tsx";
import category from "./routes/category.tsx";
import search from "./routes/search.tsx";
import auth from "./routes/admin/auth.tsx";
import adminProducts from "./routes/admin/products.tsx";
import adminCategories from "./routes/admin/categories.tsx";
import adminOrders from "./routes/admin/orders.tsx";
import { logger } from "hono/logger";

const app = new Hono();

// Static files
app.use("/styles/*", serveStatic({ root: "./src" }));
app.use("/public/*", serveStatic({ root: "./" }));

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

// Public routes
app.route("/", home);
app.route("/", product);
app.route("/", cart);
app.route("/", checkout);
app.route("/", category);
app.route("/", search);

// Admin auth (no middleware)
app.route("/admin", auth);

// Protected admin routes
const admin = new Hono();
admin.use("*", requireAuth);

admin.get("/", (c) => {
  const db = getDb();
  const productCount = (db.query("SELECT COUNT(*) as count FROM products").get() as { count: number }).count;
  const categoryCount = (db.query("SELECT COUNT(*) as count FROM categories").get() as { count: number }).count;
  const orderCount = (db.query("SELECT COUNT(*) as count FROM orders").get() as { count: number }).count;
  const pendingOrders = (
    db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as { count: number }
  ).count;
  const totalRevenue = (
    db.query("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != 'cancelled'").get() as { revenue: number }
  ).revenue;
  const monthRevenue = (
    db.query(
      "SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != 'cancelled' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
    ).get() as { revenue: number }
  ).revenue;
  const avgOrder = (
    db.query("SELECT COALESCE(AVG(total), 0) as avg FROM orders WHERE status != 'cancelled'").get() as { avg: number }
  ).avg;

  return c.html(
    <AdminLayout title="Dashboard">
      <div class="admin-stats">
        <div class="stat-card">
          <span class="stat-number">{productCount}</span>
          <span class="stat-label">Products</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{categoryCount}</span>
          <span class="stat-label">Categories</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{orderCount}</span>
          <span class="stat-label">Orders</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{pendingOrders}</span>
          <span class="stat-label">Pending Orders</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${totalRevenue.toFixed(2)}</span>
          <span class="stat-label">Total Revenue</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${monthRevenue.toFixed(2)}</span>
          <span class="stat-label">Revenue This Month</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${avgOrder.toFixed(2)}</span>
          <span class="stat-label">Avg Order Value</span>
        </div>
      </div>
    </AdminLayout>,
  );
});

admin.route("/products", adminProducts);
admin.route("/categories", adminCategories);
admin.route("/orders", adminOrders);

app.route("/admin", admin);

// Init database and start
migrate();
await seed();

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Server running at http://localhost:3000");
