import { beforeEach, describe, expect, test } from "bun:test";
import { PostgresReviewRepository } from "../../repositories/ReviewRepository.ts";
import { createTestDb, postgresAvailable, seedCategory, seedProduct } from "./helpers.ts";
import type { SQL } from "bun";

const integrationDescribe = postgresAvailable ? describe : describe.skip;
let db: SQL;
let repo: PostgresReviewRepository;
let productId: number;

beforeEach(async () => {
  db = await createTestDb();
  repo = new PostgresReviewRepository(db);
  productId = await seedProduct(db, await seedCategory(db));
  await db`INSERT INTO admin_users (username, password_hash) VALUES ('admin', 'hash')`;
  await db`INSERT INTO customer_users (email, password_hash, display_name) VALUES ('customer@example.com', 'hash', 'Customer')`;
});

integrationDescribe("PostgresReviewRepository admin review management", () => {
  test("lists customer and admin reviews with filters", async () => {
    const [customer] = await db`SELECT id FROM customer_users`;
    const [admin] = await db`SELECT id FROM admin_users`;
    const customerId = Number(customer.id);
    const adminId = Number(admin.id);
    await repo.createCustomerReview({ productId, customerId, rating: 4, text: "Customer text" });
    await repo.createAdminReview({ productId, adminUserId: adminId, rating: 5, text: "Admin text" });

    expect(await repo.findAllForAdmin()).toHaveLength(2);
    expect((await repo.findAllForAdmin(undefined, productId)).find((review) => review.is_admin)).toMatchObject({
      author_name: "admin",
      is_admin: true,
      product_name: "Test Product",
    });
    expect(await repo.findAllForAdmin("visible")).toHaveLength(2);
    await repo.setVisibility(1, false);
    expect(await repo.findAllForAdmin("hidden")).toHaveLength(1);
    expect(await repo.findAllForAdmin("visible")).toHaveLength(1);
  });

  test("hides and permanently deletes reviews", async () => {
    const [customer] = await db`SELECT id FROM customer_users`;
    const id = await repo.createCustomerReview({ productId, customerId: Number(customer.id), rating: 3, text: null });

    await repo.setVisibility(id, false);
    expect((await repo.findAllForAdmin("hidden"))[0]?.visible).toBe(false);
    await repo.deleteReview(id);
    expect(await repo.findAllForAdmin()).toEqual([]);
  });
});
