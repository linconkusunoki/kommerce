import { beforeEach, describe, expect, test } from "bun:test";
import { PostgresProductRepository } from "../../repositories/ProductRepository.ts";
import { PostgresReviewRepository } from "../../repositories/ReviewRepository.ts";
import { createTestDb, postgresAvailable, seedCategory, seedProduct } from "./helpers.ts";
import type { SQL } from "bun";

const integrationDescribe = postgresAvailable ? describe : describe.skip;
let db: SQL;
let reviews: PostgresReviewRepository;
let productId: number;

beforeEach(async () => {
  db = await createTestDb();
  reviews = new PostgresReviewRepository(db);
  productId = await seedProduct(db, await seedCategory(db));
});

async function seedCustomer(id: number) {
  const [row] = await db`INSERT INTO customer_users (email, password_hash, display_name)
    VALUES (${`customer-${id}@example.com`}, 'hash', ${`Customer ${id}`}) RETURNING id`;
  return Number(row.id);
}

integrationDescribe("PostgresReviewRepository", () => {
  test("creates a customer review and returns it in public results", async () => {
    const customerId = await seedCustomer(1);
    const reviewId = await reviews.createCustomerReview({ productId, customerId, rating: 5, text: "Great" });
    const page = await reviews.findVisibleByProduct(productId, 1, 10);

    expect(reviewId).toBeGreaterThan(0);
    expect(page.reviews[0]).toMatchObject({
      id: reviewId,
      author_name: "Customer 1",
      rating: 5,
      text: "Great",
      visible: true,
    });
  });

  test("lists all reviews for a customer with product links", async () => {
    const customerId = await seedCustomer(1);
    await reviews.createCustomerReview({ productId, customerId, rating: 5, text: "Great" });

    expect((await reviews.findByCustomer(customerId))[0]).toMatchObject({
      product_id: productId,
      product_name: "Test Product",
      product_slug: "test-product",
      text: "Great",
    });
  });

  test("paginates and excludes hidden reviews from public data and aggregates", async () => {
    for (let i = 1; i <= 11; i++) {
      const customerId = await seedCustomer(i);
      const reviewId = await reviews.createCustomerReview({ productId, customerId, rating: (i % 5) + 1, text: null });
      if (i === 1) await db`UPDATE product_reviews SET visible = false WHERE id = ${reviewId}`;
    }

    const firstPage = await reviews.findVisibleByProduct(productId, 1, 10);
    const secondPage = await reviews.findVisibleByProduct(productId, 2, 10);
    const summary = await reviews.getRatingSummary(productId);

    expect(firstPage.reviews).toHaveLength(10);
    expect(secondPage.reviews).toHaveLength(10);
    expect(firstPage.totalCount).toBe(10);
    expect(summary.total).toBe(10);
    expect(summary.distribution[2]).toBe(2);
  });

  test("enforces one active review per customer and cascades on product deletion", async () => {
    const customerId = await seedCustomer(1);
    await reviews.createCustomerReview({ productId, customerId, rating: 3, text: null });

    expect(reviews.createCustomerReview({ productId, customerId, rating: 4, text: null })).rejects.toThrow();
    await new PostgresProductRepository(db).delete(productId);
    const [row] = await db`SELECT COUNT(*)::int AS count FROM product_reviews WHERE product_id = ${productId}`;
    expect(row.count).toBe(0);
  });
});
