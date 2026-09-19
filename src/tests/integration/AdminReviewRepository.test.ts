import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { SqliteReviewRepository } from "../../repositories/ReviewRepository.ts";
import { createTestDb, seedCategory, seedProduct } from "./helpers.ts";

let db: Database;
let repo: SqliteReviewRepository;
let productId: number;

beforeEach(() => {
  db = createTestDb();
  repo = new SqliteReviewRepository(db);
  productId = seedProduct(db, seedCategory(db));
  db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run("admin", "hash");
  db.prepare("INSERT INTO customer_users (email, password_hash, display_name) VALUES (?, ?, ?)").run(
    "customer@example.com",
    "hash",
    "Customer",
  );
});

describe("SqliteReviewRepository admin review management", () => {
  test("lists customer and admin reviews with filters", () => {
    const customerId = Number((db.query("SELECT id FROM customer_users").get() as { id: number }).id);
    const adminId = Number((db.query("SELECT id FROM admin_users").get() as { id: number }).id);
    repo.createCustomerReview({ productId, customerId, rating: 4, text: "Customer text" });
    repo.createAdminReview({ productId, adminUserId: adminId, rating: 5, text: "Admin text" });

    expect(repo.findAllForAdmin()).toHaveLength(2);
    expect(repo.findAllForAdmin(undefined, productId).find((review) => review.is_admin)).toMatchObject({
      author_name: "admin",
      is_admin: true,
      product_name: "Test Product",
    });
    expect(repo.findAllForAdmin("visible")).toHaveLength(2);
    repo.setVisibility(1, false);
    expect(repo.findAllForAdmin("hidden")).toHaveLength(1);
    expect(repo.findAllForAdmin("visible")).toHaveLength(1);
  });

  test("hides and permanently deletes reviews", () => {
    const customerId = Number((db.query("SELECT id FROM customer_users").get() as { id: number }).id);
    const id = repo.createCustomerReview({ productId, customerId, rating: 3, text: null });

    repo.setVisibility(id, false);
    expect(repo.findAllForAdmin("hidden")[0]?.visible).toBe(false);
    repo.deleteReview(id);
    expect(repo.findAllForAdmin()).toEqual([]);
  });
});
