import { describe, test, expect, beforeEach } from "bun:test";
import { PostgresProductRepository } from "../../repositories/ProductRepository.ts";
import { createTestDb, postgresAvailable, seedCategory, seedProduct } from "./helpers.ts";
import type { SQL } from "bun";

const integrationDescribe = postgresAvailable ? describe : describe.skip;
let db: SQL;
let repo: PostgresProductRepository;
let categoryId: number;

beforeEach(async () => {
  db = await createTestDb();
  repo = new PostgresProductRepository(db);
  categoryId = await seedCategory(db);
});

integrationDescribe("ProductRepository.findBySlug", () => {
  test("returns null for unknown slug", async () => {
    expect(await repo.findBySlug("unknown")).toBeNull();
  });

  test("returns product with category info", async () => {
    await seedProduct(db, categoryId, { slug: "shirt" });
    const p = await repo.findBySlug("shirt");
    expect(p?.slug).toBe("shirt");
    expect(p?.category_name).toBe("Test Category");
  });
});

integrationDescribe("ProductRepository.findFeatured", () => {
  test("returns only featured products", async () => {
    await seedProduct(db, categoryId, { slug: "regular" });
    await seedProduct(db, categoryId, { slug: "featured", featured: true });
    const results = await repo.findFeatured();
    expect(results).toHaveLength(1);
    expect(results[0]!.slug).toBe("featured");
  });
});

integrationDescribe("ProductRepository.findByCategory", () => {
  test("returns products in given category", async () => {
    const otherCategoryId = await seedCategory(db, { slug: "other" });
    await seedProduct(db, categoryId, { slug: "in-cat" });
    await seedProduct(db, otherCategoryId, { slug: "other-cat" });
    const results = await repo.findByCategory(categoryId);
    expect(results).toHaveLength(1);
    expect(results[0]!.slug).toBe("in-cat");
  });
});

integrationDescribe("ProductRepository.search", () => {
  test("finds products by name", async () => {
    await seedProduct(db, categoryId, { name: "Blue Shirt", slug: "blue-shirt" });
    await seedProduct(db, categoryId, { name: "Red Pants", slug: "red-pants" });
    const results = await repo.search("blue");
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Blue Shirt");
  });

  test("returns empty array when no match", async () => {
    expect(await repo.search("xyz-nonexistent")).toEqual([]);
  });
});

integrationDescribe("ProductRepository.create", () => {
  test("inserts product and returns id", async () => {
    const id = await repo.create({
      name: "New Shirt",
      slug: "new-shirt",
      description: "A shirt",
      price: 29.99,
      compare_at_price: null,
      category_id: categoryId,
      image_url: null,
      featured: false,
    });
    expect(id).toBeGreaterThan(0);
    expect((await repo.findById(id))?.name).toBe("New Shirt");
  });
});

integrationDescribe("ProductRepository.update", () => {
  test("updates product fields", async () => {
    const id = await seedProduct(db, categoryId);
    await repo.update(id, {
      name: "Updated",
      slug: "updated",
      description: "Updated desc",
      price: 49.99,
      compare_at_price: 59.99,
      category_id: categoryId,
      image_url: null,
      featured: true,
    });
    const updated = await repo.findById(id);
    expect(updated?.name).toBe("Updated");
    expect(updated?.price).toBe(49.99);
    expect(updated?.featured).toBe(true);
  });
});

integrationDescribe("ProductRepository.delete", () => {
  test("removes the product", async () => {
    const id = await seedProduct(db, categoryId);
    await repo.delete(id);
    expect(await repo.findById(id)).toBeNull();
  });
});
