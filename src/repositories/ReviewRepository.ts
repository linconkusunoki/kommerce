import type { SQL } from "bun";
import type {
  AdminReview,
  CreateAdminReviewInput,
  CreateCustomerReviewInput,
  CustomerReview,
  ProductReview,
  RatingSummary,
  ReviewPage,
} from "../types/index.ts";
import type { IReviewAdminRepository, IReviewCustomerRepository, IReviewPublicRepository } from "./interfaces.ts";

type Raw<T> = Omit<T, "visible" | "is_admin"> & { visible: boolean | number; is_admin: boolean | number };
const map = <T>(row: Raw<T>): T => ({ ...row, visible: !!row.visible, is_admin: !!row.is_admin }) as T;
const reviewSelect = `SELECT r.id, r.product_id, r.customer_id, r.admin_user_id, COALESCE(c.display_name, a.username) AS author_name,
  (r.admin_user_id IS NOT NULL) AS is_admin, r.rating, r.text, r.visible, r.created_at, r.updated_at
  FROM product_reviews r LEFT JOIN customer_users c ON c.id = r.customer_id LEFT JOIN admin_users a ON a.id = r.admin_user_id`;

export class PostgresReviewRepository
  implements IReviewPublicRepository, IReviewCustomerRepository, IReviewAdminRepository
{
  constructor(private db: SQL) {}
  async findByCustomer(customerId: number) {
    return (
      await this
        .db`SELECT r.id, r.product_id, r.customer_id, r.admin_user_id, c.display_name AS author_name, false AS is_admin, r.rating, r.text, r.visible, r.created_at, r.updated_at, p.name AS product_name, p.slug AS product_slug FROM product_reviews r JOIN customer_users c ON c.id = r.customer_id JOIN products p ON p.id = r.product_id WHERE r.customer_id = ${customerId} ORDER BY r.updated_at DESC, r.id DESC`
    ).map((r: unknown) => map(r as Raw<CustomerReview>)) as CustomerReview[];
  }
  async findAllForAdmin(visibility: "all" | "visible" | "hidden" = "all", productId?: number) {
    const conditions =
      visibility === "visible" ? "WHERE r.visible = true" : visibility === "hidden" ? "WHERE r.visible = false" : "";
    const product = productId ? `${conditions ? " AND" : "WHERE"} r.product_id = $1` : "";
    const rows = await this.db.unsafe(
      `SELECT r.id, r.product_id, r.customer_id, r.admin_user_id, COALESCE(c.display_name, a.username) AS author_name, (r.admin_user_id IS NOT NULL) AS is_admin, r.rating, r.text, r.visible, r.created_at, r.updated_at, p.name AS product_name, p.slug AS product_slug FROM product_reviews r LEFT JOIN customer_users c ON c.id = r.customer_id LEFT JOIN admin_users a ON a.id = r.admin_user_id JOIN products p ON p.id = r.product_id ${conditions}${product} ORDER BY r.updated_at DESC, r.id DESC`,
      productId ? [productId] : [],
    );
    return rows.map((r: unknown) => map(r as Raw<AdminReview>)) as AdminReview[];
  }
  async findVisibleByProduct(productId: number, page: number, pageSize: number) {
    const [count] = await this
      .db`SELECT COUNT(*)::int AS total FROM product_reviews WHERE product_id = ${productId} AND visible = true`;
    const totalCount = Number(count.total);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const rows = await this.db.unsafe(
      `${reviewSelect} WHERE r.product_id = $1 AND r.visible = true ORDER BY r.created_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
      [productId, pageSize, (currentPage - 1) * pageSize],
    );
    return {
      reviews: rows.map((r: unknown) => map(r as Raw<ProductReview>)),
      page: currentPage,
      totalPages,
      totalCount,
    } as ReviewPage;
  }
  async getRatingSummary(productId: number) {
    const [aggregate] = await this
      .db`SELECT COUNT(*)::int AS total, COALESCE(AVG(rating), 0) AS average FROM product_reviews WHERE product_id = ${productId} AND visible = true`;
    const rows = await this
      .db`SELECT rating, COUNT(*)::int AS count FROM product_reviews WHERE product_id = ${productId} AND visible = true GROUP BY rating`;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    for (const row of rows) distribution[row.rating as 1 | 2 | 3 | 4 | 5] = Number(row.count);
    return { average: Number(aggregate.average), total: Number(aggregate.total), distribution } as RatingSummary;
  }
  async findCustomerReview(productId: number, customerId: number) {
    const row = (
      await this.db.unsafe(`${reviewSelect} WHERE r.product_id = $1 AND r.customer_id = $2`, [productId, customerId])
    )[0] as Raw<ProductReview> | undefined;
    return row ? map(row) : null;
  }
  async createCustomerReview(input: CreateCustomerReviewInput) {
    const [row] = await this
      .db`INSERT INTO product_reviews (product_id, customer_id, rating, text) VALUES (${input.productId}, ${input.customerId}, ${input.rating}, ${input.text}) RETURNING id`;
    return Number(row.id);
  }
  async updateCustomerReview(id: number, customerId: number, rating: number, text: string | null) {
    await this
      .db`UPDATE product_reviews SET rating = ${rating}, text = ${text}, updated_at = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') WHERE id = ${id} AND customer_id = ${customerId}`;
  }
  async deleteCustomerReview(id: number, customerId: number) {
    await this.db`DELETE FROM product_reviews WHERE id = ${id} AND customer_id = ${customerId}`;
  }
  async setVisibility(id: number, visible: boolean) {
    await this
      .db`UPDATE product_reviews SET visible = ${visible}, updated_at = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') WHERE id = ${id}`;
  }
  async deleteReview(id: number) {
    await this.db`DELETE FROM product_reviews WHERE id = ${id}`;
  }
  async createAdminReview(input: CreateAdminReviewInput) {
    const [row] = await this
      .db`INSERT INTO product_reviews (product_id, admin_user_id, rating, text) VALUES (${input.productId}, ${input.adminUserId}, ${input.rating}, ${input.text}) RETURNING id`;
    return Number(row.id);
  }
}
