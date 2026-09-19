import type { Database } from "bun:sqlite";
import type { DashboardStats } from "../types/index.ts";
import type { IDashboardRepository } from "./interfaces.ts";

export class SqliteDashboardRepository implements IDashboardRepository {
  constructor(private db: Database) {}

  getStats(): DashboardStats {
    const productCount = (this.db.query("SELECT COUNT(*) as count FROM products").get() as { count: number }).count;

    const categoryCount = (this.db.query("SELECT COUNT(*) as count FROM categories").get() as { count: number }).count;

    const orderCount = (this.db.query("SELECT COUNT(*) as count FROM orders").get() as { count: number }).count;

    const pendingOrders = (
      this.db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as {
        count: number;
      }
    ).count;

    const totalRevenue = (
      this.db.query("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != 'cancelled'").get() as {
        revenue: number;
      }
    ).revenue;

    const monthRevenue = (
      this.db
        .query(
          `SELECT COALESCE(SUM(total), 0) as revenue FROM orders
           WHERE status != 'cancelled' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
        )
        .get() as { revenue: number }
    ).revenue;

    const avgOrder = (
      this.db.query("SELECT COALESCE(AVG(total), 0) as avg FROM orders WHERE status != 'cancelled'").get() as {
        avg: number;
      }
    ).avg;

    return { productCount, categoryCount, orderCount, pendingOrders, totalRevenue, monthRevenue, avgOrder };
  }
}
