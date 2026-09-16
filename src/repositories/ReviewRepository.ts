import type { Database } from "bun:sqlite";
import type {
  AdminReview,
  CustomerReview,
  CreateAdminReviewInput,
  CreateCustomerReviewInput,
  ProductReview,
  RatingSummary,
  ReviewPage,
} from "../types/index.ts";
import type { IReviewRepository } from "./interfaces.ts";

type RawReview = Omit<ProductReview, "visible" | "is_admin"> & { visible: number; is_admin: number };
type RawAdminReview = Omit<AdminReview, "visible" | "is_admin"> & { visible: number; is_admin: number };
type RawCustomerReview = Omit<CustomerReview, "visible" | "is_admin"> & { visible: number; is_admin: number };

function mapReview(row: RawReview): ProductReview {
  return { ...row, visible: !!row.visible, is_admin: !!row.is_admin };
}

function mapAdminReview(row: RawAdminReview): AdminReview {
  return { ...row, visible: !!row.visible, is_admin: !!row.is_admin };
}

const reviewSelect = `
  SELECT r.id, r.product_id, r.customer_id, r.admin_user_id,
         COALESCE(c.display_name, a.username) AS author_name,
         CASE WHEN r.admin_user_id IS NOT NULL THEN 1 ELSE 0 END AS is_admin,
         r.rating, r.text, r.visible, r.created_at, r.updated_at
  FROM product_reviews r
  LEFT JOIN customer_users c ON c.id = r.customer_id
  LEFT JOIN admin_users a ON a.id = r.admin_user_id`;

export class SqliteReviewRepository implements IReviewRepository {
  constructor(private db: Database) {}

  findByCustomer(customerId: number): CustomerReview[] {
    const rows = this.db
      .query(
        `SELECT r.id, r.product_id, r.customer_id, r.admin_user_id,
                c.display_name AS author_name,
                0 AS is_admin,
                r.rating, r.text, r.visible, r.created_at, r.updated_at,
                p.name AS product_name, p.slug AS product_slug
         FROM product_reviews r
         JOIN customer_users c ON c.id = r.customer_id
         JOIN products p ON p.id = r.product_id
         WHERE r.customer_id = ?
         ORDER BY r.updated_at DESC, r.id DESC`,
      )
      .all(customerId) as RawCustomerReview[];
    return rows.map((row) => ({ ...row, visible: !!row.visible, is_admin: !!row.is_admin }));
  }

  findAllForAdmin(visibility: "all" | "visible" | "hidden" = "all", productId?: number): AdminReview[] {
    const conditions = [];
    const params: (string | number)[] = [];
    if (visibility === "visible") conditions.push("r.visible = 1");
    if (visibility === "hidden") conditions.push("r.visible = 0");
    if (productId) {
      conditions.push("r.product_id = ?");
      params.push(productId);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = this.db
      .query(
        `SELECT r.id, r.product_id, r.customer_id, r.admin_user_id,
                COALESCE(c.display_name, a.username) AS author_name,
                CASE WHEN r.admin_user_id IS NOT NULL THEN 1 ELSE 0 END AS is_admin,
                r.rating, r.text, r.visible, r.created_at, r.updated_at,
                p.name AS product_name, p.slug AS product_slug
         FROM product_reviews r
         LEFT JOIN customer_users c ON c.id = r.customer_id
         LEFT JOIN admin_users a ON a.id = r.admin_user_id
         JOIN products p ON p.id = r.product_id
         ${where}
         ORDER BY r.updated_at DESC, r.id DESC`,
      )
      .all(...params) as RawAdminReview[];
    return rows.map(mapAdminReview);
  }

  findVisibleByProduct(productId: number, page: number, pageSize: number): ReviewPage {
    const count = this.db
      .query("SELECT COUNT(*) AS total FROM product_reviews WHERE product_id = ? AND visible = 1")
      .get(productId) as { total: number };
    const totalCount = Number(count.total);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const rows = this.db
      .query(`${reviewSelect} WHERE r.product_id = ? AND r.visible = 1 ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`)
      .all(productId, pageSize, (currentPage - 1) * pageSize) as RawReview[];
    return { reviews: rows.map(mapReview), page: currentPage, totalPages, totalCount };
  }

  getRatingSummary(productId: number): RatingSummary {
    const aggregate = this.db
      .query("SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS average FROM product_reviews WHERE product_id = ? AND visible = 1")
      .get(productId) as { total: number; average: number };
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    const rows = this.db
      .query("SELECT rating, COUNT(*) AS count FROM product_reviews WHERE product_id = ? AND visible = 1 GROUP BY rating")
      .all(productId) as { rating: 1 | 2 | 3 | 4 | 5; count: number }[];
    for (const row of rows) distribution[row.rating] = Number(row.count);
    return { average: Number(aggregate.average), total: Number(aggregate.total), distribution };
  }

  findCustomerReview(productId: number, customerId: number): ProductReview | null {
    const row = this.db
      .query(`${reviewSelect} WHERE r.product_id = ? AND r.customer_id = ?`)
      .get(productId, customerId) as RawReview | null;
    return row ? mapReview(row) : null;
  }

  createCustomerReview(input: CreateCustomerReviewInput): number {
    const result = this.db
      .prepare("INSERT INTO product_reviews (product_id, customer_id, rating, text) VALUES (?, ?, ?, ?)")
      .run(input.productId, input.customerId, input.rating, input.text);
    return Number(result.lastInsertRowid);
  }

  updateCustomerReview(id: number, customerId: number, rating: number, text: string | null): void {
    this.db
      .prepare("UPDATE product_reviews SET rating = ?, text = ?, updated_at = datetime('now') WHERE id = ? AND customer_id = ?")
      .run(rating, text, id, customerId);
  }

  deleteCustomerReview(id: number, customerId: number): void {
    this.db.prepare("DELETE FROM product_reviews WHERE id = ? AND customer_id = ?").run(id, customerId);
  }

  setVisibility(id: number, visible: boolean): void {
    this.db.prepare("UPDATE product_reviews SET visible = ?, updated_at = datetime('now') WHERE id = ?").run(visible ? 1 : 0, id);
  }

  deleteReview(id: number): void {
    this.db.prepare("DELETE FROM product_reviews WHERE id = ?").run(id);
  }

  createAdminReview(input: CreateAdminReviewInput): number {
    const result = this.db
      .prepare("INSERT INTO product_reviews (product_id, admin_user_id, rating, text) VALUES (?, ?, ?, ?)")
      .run(input.productId, input.adminUserId, input.rating, input.text);
    return Number(result.lastInsertRowid);
  }
}
