import { Hono } from "hono";
import { getDb } from "../../db/schema.ts";
import { AdminLayout } from "../../components/AdminLayout.tsx";

type Order = {
  id: number;
  order_number: string;
  status: string;
  email: string;
  name: string;
  total: number;
  created_at: string;
  item_count: number;
};

type OrderDetail = {
  id: number;
  order_number: string;
  status: string;
  email: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  notes: string;
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
};

type OrderItem = {
  id: number;
  product_name: string;
  product_slug: string;
  variant_size: string;
  variant_color: string;
  price: number;
  quantity: number;
  total: number;
};

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#16a34a",
  cancelled: "#dc2626",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return (
    <span
      class="status-badge"
      style={`background: ${color}15; color: ${color}; border: 1px solid ${color}30;`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const orders = new Hono();

orders.get("/", (c) => {
  const db = getDb();
  const statusFilter = c.req.query("status") || "";

  let query = `
    SELECT o.*, COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
  `;
  const params: string[] = [];

  if (statusFilter) {
    query += " WHERE o.status = ?";
    params.push(statusFilter);
  }

  query += " GROUP BY o.id ORDER BY o.created_at DESC";

  const allOrders = db.query(query).all(...params) as Order[];

  // Count by status
  const statusCounts = db
    .query("SELECT status, COUNT(*) as count FROM orders GROUP BY status")
    .all() as { status: string; count: number }[];

  const totalOrders = statusCounts.reduce((sum, s) => sum + s.count, 0);

  return c.html(
    <AdminLayout title="Orders">
      <div class="order-filters">
        <a href="/admin/orders" class={`btn btn-sm ${!statusFilter ? "btn-primary" : "btn-outline"}`}>
          All ({totalOrders})
        </a>
        {STATUS_OPTIONS.map((s) => {
          const count = statusCounts.find((sc) => sc.status === s)?.count || 0;
          if (count === 0 && s !== "pending") return null;
          return (
            <a
              href={`/admin/orders?status=${s}`}
              class={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </a>
          );
        })}
      </div>

      {allOrders.length === 0 ? (
        <p style="color: var(--color-text-muted); padding: 2rem 0;">No orders found.</p>
      ) : (
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Items</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allOrders.map((o) => (
              <tr>
                <td>
                  <strong>{o.order_number}</strong>
                </td>
                <td style="font-size: 0.85rem; color: var(--color-text-muted);">{formatDate(o.created_at)}</td>
                <td>
                  <div>{o.name}</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted);">{o.email}</div>
                </td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td>{o.item_count}</td>
                <td>
                  <strong>${o.total.toFixed(2)}</strong>
                </td>
                <td class="admin-actions">
                  <a href={`/admin/orders/${o.id}`} class="btn btn-sm">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>,
  );
});

orders.get("/:id", (c) => {
  const db = getDb();
  const id = c.req.param("id");

  const order = db.query("SELECT * FROM orders WHERE id = ?").get(id) as OrderDetail | null;
  if (!order) return c.notFound();

  const items = db.query("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as OrderItem[];

  return c.html(
    <AdminLayout title={`Order ${order.order_number}`}>
      <a href="/admin/orders" class="btn btn-sm btn-outline" style="margin-bottom: 1.5rem; display: inline-flex;">
        &larr; Back to Orders
      </a>

      <div class="order-admin-grid">
        <div class="order-admin-main">
          <div class="order-admin-card">
            <div class="order-admin-card-header">
              <h3>Order Items</h3>
            </div>
            <table class="admin-table" style="border: none;">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr>
                    <td>
                      <a href={`/products/${item.product_slug}`} style="color: var(--color-accent);">
                        {item.product_name}
                      </a>
                    </td>
                    <td>
                      {item.variant_size} / {item.variant_color}
                    </td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <strong>${item.total.toFixed(2)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div class="order-totals">
              <div class="order-totals-row">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div class="order-totals-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div class="order-totals-row order-totals-final">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-admin-sidebar">
          <div class="order-admin-card">
            <div class="order-admin-card-header">
              <h3>Status</h3>
            </div>
            <div class="order-admin-card-body">
              <form method="post" action={`/admin/orders/${order.id}/status`}>
                <div class="form-group" style="margin-bottom: 0.75rem;">
                  <select name="status" class="quantity-select" style="width: 100%;">
                    {STATUS_OPTIONS.map((s) => (
                      <option value={s} selected={order.status === s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" class="btn btn-primary btn-sm btn-block">
                  Update Status
                </button>
              </form>
            </div>
          </div>

          <div class="order-admin-card">
            <div class="order-admin-card-header">
              <h3>Customer</h3>
            </div>
            <div class="order-admin-card-body">
              <p>
                <strong>{order.name}</strong>
              </p>
              <p>
                <a href={`mailto:${order.email}`} style="color: var(--color-accent);">
                  {order.email}
                </a>
              </p>
              {order.phone && <p>{order.phone}</p>}
            </div>
          </div>

          <div class="order-admin-card">
            <div class="order-admin-card-header">
              <h3>Shipping Address</h3>
            </div>
            <div class="order-admin-card-body">
              <p>{order.address}</p>
              <p>
                {order.city}, {order.postal_code}
              </p>
              {order.country && <p>{order.country}</p>}
            </div>
          </div>

          {order.notes && (
            <div class="order-admin-card">
              <div class="order-admin-card-header">
                <h3>Notes</h3>
              </div>
              <div class="order-admin-card-body">
                <p style="color: var(--color-text-muted); font-size: 0.9rem;">{order.notes}</p>
              </div>
            </div>
          )}

          <div class="order-admin-card">
            <div class="order-admin-card-header">
              <h3>Timeline</h3>
            </div>
            <div class="order-admin-card-body">
              <p style="font-size: 0.85rem; color: var(--color-text-muted);">
                Created: {formatDate(order.created_at)}
              </p>
              <p style="font-size: 0.85rem; color: var(--color-text-muted);">
                Updated: {formatDate(order.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>,
  );
});

orders.post("/:id/status", async (c) => {
  const db = getDb();
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  const status = body.status as string;

  if (STATUS_OPTIONS.includes(status as (typeof STATUS_OPTIONS)[number])) {
    db.query("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  }

  return c.redirect(`/admin/orders/${id}`);
});

export default orders;
