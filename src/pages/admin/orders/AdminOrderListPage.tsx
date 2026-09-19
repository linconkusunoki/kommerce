import { AdminLayout } from "../../../components/AdminLayout.tsx";
import { ORDER_STATUSES, type OrderSummary, type StatusCount } from "../../../types/index.ts";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#16a34a",
  cancelled: "#dc2626",
};

function formatDate(value: string): string {
  return new Date(`${value}Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return (
    <span class="status-badge" style={`background: ${color}15; color: ${color}; border: 1px solid ${color}30;`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function AdminOrderListPage({
  orders,
  statusCounts,
  statusFilter,
}: {
  orders: OrderSummary[];
  statusCounts: StatusCount[];
  statusFilter: string;
}) {
  const totalOrders = statusCounts.reduce((sum, status) => sum + status.count, 0);

  return (
    <AdminLayout title="Orders">
      <div class="order-filters">
        <a href="/admin/orders" class={`btn btn-sm ${!statusFilter ? "btn-primary" : "btn-outline"}`}>
          All ({totalOrders})
        </a>
        {ORDER_STATUSES.map((status) => {
          const count = statusCounts.find((item) => item.status === status)?.count || 0;
          if (count === 0 && status !== "pending") return null;
          return (
            <a
              href={`/admin/orders?status=${status}`}
              class={`btn btn-sm ${statusFilter === status ? "btn-primary" : "btn-outline"}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </a>
          );
        })}
      </div>

      {orders.length === 0 ? (
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
            {orders.map((order) => (
              <tr>
                <td>
                  <strong>{order.order_number}</strong>
                </td>
                <td style="font-size: 0.85rem; color: var(--color-text-muted);">{formatDate(order.created_at)}</td>
                <td>
                  <div>{order.name}</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted);">{order.email}</div>
                </td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
                <td>{order.item_count}</td>
                <td>
                  <strong>${order.total.toFixed(2)}</strong>
                </td>
                <td class="admin-actions">
                  <a href={`/admin/orders/${order.id}`} class="btn btn-sm">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  );
}
