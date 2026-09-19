import { AdminLayout } from "../../../components/AdminLayout.tsx";
import { ORDER_STATUSES, type Order, type OrderItem } from "../../../types/index.ts";

function formatDate(value: string): string {
  return new Date(`${value}Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminOrderDetailPage({ order, items }: { order: Order; items: OrderItem[] }) {
  return (
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
                    {ORDER_STATUSES.map((status) => (
                      <option value={status} selected={order.status === status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
              <p style="font-size: 0.85rem; color: var(--color-text-muted);">Created: {formatDate(order.created_at)}</p>
              <p style="font-size: 0.85rem; color: var(--color-text-muted);">Updated: {formatDate(order.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
