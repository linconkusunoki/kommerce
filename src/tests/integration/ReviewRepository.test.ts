import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { SqliteProductRepository } from "../../repositories/ProductRepository.ts";
import { SqliteReviewRepository } from "../../repositories/ReviewRepository.ts";
import { createTestDb, seedCategory, seedProduct } from "./helpers.ts";

let db: Database;
let reviews: SqliteReviewRepository;
let productId: number;

beforeEach(() => {
  db = createTestDb();
  reviews = new SqliteReviewRepository(db);
  productId = seedProduct(db, seedCategory(db));
});

function seedCustomer(id: number): number {
  const result = db
    .prepare("INSERT INTO customer_users (email, password_hash, display_name) VALUES (?, ?, ?)")
    .run(`customer-${id}@example.com`, "hash", `Customer ${id}`);
  return Number(result.lastInsertRowid);
}

describe("SqliteReviewRepository", () => {
  test("creates a customer review and returns it in public results", () => {
    const customerId = seedCustomer(1);
    const reviewId = reviews.createCustomerReview({ productId, customerId, rating: 5, text: "Great" });
    const page = reviews.findVisibleByProduct(productId, 1, 10);

    expect(reviewId).toBeGreaterThan(0);
    expect(page.reviews[0]).toMatchObject({ id: reviewId, author_name: "Customer 1", rating: 5, text: "Great", visible: true });
  });

  test("lists all reviews for a customer with product links", () => {
    const customerId = seedCustomer(1);
    reviews.createCustomerReview({ productId, customerId, rating: 5, text: "Great" });

    expect(reviews.findByCustomer(customerId)[0]).toMatchObject({
      product_id: productId,
      product_name: "Test Product",
      product_slug: "test-product",
      text: "Great",
    });
  });

  test("paginates and excludes hidden reviews from public data and aggregates", () => {
    for (let i = 1; i <= 11; i++) {
      const customerId = seedCustomer(i);
      const reviewId = reviews.createCustomerReview({ productId, customerId, rating: i % 5 + 1, text: null });
      if (i === 1) db.prepare("UPDATE product_reviews SET visible = 0 WHERE id = ?").run(reviewId);
    }

    const firstPage = reviews.findVisibleByProduct(productId, 1, 10);
    const secondPage = reviews.findVisibleByProduct(productId, 2, 10);
    const summary = reviews.getRatingSummary(productId);

    expect(firstPage.reviews).toHaveLength(10);
    expect(secondPage.reviews).toHaveLength(1);
    expect(firstPage.totalCount).toBe(10);
    expect(summary.total).toBe(10);
    expect(summary.distribution[2]).toBe(2);
  });

  test("enforces one active review per customer and cascades on product deletion", () => {
    const customerId = seedCustomer(1);
    reviews.createCustomerReview({ productId, customerId, rating: 3, text: null });

    expect(() => reviews.createCustomerReview({ productId, customerId, rating: 4, text: null })).toThrow();
    new SqliteProductRepository(db).delete(productId);
    expect(db.query("SELECT COUNT(*) AS count FROM product_reviews WHERE product_id = ?").get(productId)).toEqual({ count: 0 });
  });
});
