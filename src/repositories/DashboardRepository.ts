import type { SQL } from "bun";
import type { DashboardStats } from "../types/index.ts";
import type { IDashboardRepository } from "./interfaces.ts";

export class PostgresDashboardRepository implements IDashboardRepository {
  constructor(private db: SQL) {}
  async getStats() {
    const [row] = await this.db`SELECT
      (SELECT COUNT(*)::int FROM products) AS "productCount", (SELECT COUNT(*)::int FROM categories) AS "categoryCount",
      (SELECT COUNT(*)::int FROM orders) AS "orderCount", (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS "pendingOrders",
      COALESCE((SELECT SUM(total) FROM orders WHERE status != 'cancelled'), 0) AS "totalRevenue",
      COALESCE((SELECT SUM(total) FROM orders WHERE status != 'cancelled' AND date_trunc('month', created_at::timestamp) = date_trunc('month', CURRENT_TIMESTAMP)), 0) AS "monthRevenue",
      COALESCE((SELECT AVG(total) FROM orders WHERE status != 'cancelled'), 0) AS "avgOrder"`;
    return {
      ...row,
      totalRevenue: Number(row.totalRevenue),
      monthRevenue: Number(row.monthRevenue),
      avgOrder: Number(row.avgOrder),
    } as DashboardStats;
  }
}
