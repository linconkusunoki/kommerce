import { AdminLayout } from "../../../components/AdminLayout.tsx";
import type { DashboardStats } from "../../../types/index.ts";

export function AdminDashboardPage({ stats }: { stats: DashboardStats }) {
  return (
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
    </AdminLayout>
  );
}
