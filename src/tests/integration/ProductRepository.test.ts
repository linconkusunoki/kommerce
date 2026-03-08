import { describe, test, expect, beforeEach } from "bun:test";
import { SqliteProductRepository } from "../../repositories/ProductRepository.ts";
import { createTestDb, seedCategory, seedProduct } from "./helpers.ts";
import type { Database } from "bun:sqlite";

let db: Database;
let repo: SqliteProductRepository;
let categoryId: number;

beforeEach(() => {
  db = createTestDb();
  repo = new SqliteProductRepository(db);
  categoryId = seedCategory(db);
});

describe("ProductRepository.findBySlug", () => {
  test("returns null for unknown slug", () => {
    expect(repo.findBySlug("unknown")).toBeNull();
  });

  test("returns product with category info", () => {
    seedProduct(db, categoryId, { slug: "shirt" });
    const p = repo.findBySlug("shirt");
    expect(p?.slug).toBe("shirt");
    expect(p?.category_name).toBe("Test Category");
  });
});

describe("ProductRepository.findFeatured", () => {
  test("returns only featured products", () => {
    seedProduct(db, categoryId, { slug: "regular" });
    seedProduct(db, categoryId, { slug: "featured", featured: 1 });
    const results = repo.findFeatured();
    expect(results).toHaveLength(1);
    expect(results[0]!.slug).toBe("featured");
  });
});

describe("ProductRepository.findByCategory", () => {
  test("returns products in given category", () => {
    const otherCategoryId = seedCategory(db, { slug: "other" });
    seedProduct(db, categoryId, { slug: "in-cat" });
    seedProduct(db, otherCategoryId, { slug: "other-cat" });
    const results = repo.findByCategory(categoryId);
    expect(results).toHaveLength(1);
    expect(results[0]!.slug).toBe("in-cat");
  });
});

describe("ProductRepository.search", () => {
  test("finds products by name", () => {
    seedProduct(db, categoryId, { name: "Blue Shirt", slug: "blue-shirt" });
    seedProduct(db, categoryId, { name: "Red Pants", slug: "red-pants" });
    const results = repo.search("blue");
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Blue Shirt");
  });

  test("returns empty array when no match", () => {
    expect(repo.search("xyz-nonexistent")).toEqual([]);
  });
});

describe("ProductRepository.create", () => {
  test("inserts product and returns id", () => {
    const id = repo.create({
      name: "New Shirt",
      slug: "new-shirt",
      description: "A shirt",
      price: 29.99,
      compare_at_price: null,
      category_id: categoryId,
      image_url: null,
      featured: 0,
    });
    expect(id).toBeGreaterThan(0);
    expect(repo.findById(id)?.name).toBe("New Shirt");
  });
});

describe("ProductRepository.update", () => {
  test("updates product fields", () => {
    const id = seedProduct(db, categoryId);
    repo.update(id, {
      name: "Updated",
      slug: "updated",
      description: "Updated desc",
      price: 49.99,
      compare_at_price: 59.99,
      category_id: categoryId,
      image_url: null,
      featured: 1,
    });
    const updated = repo.findById(id);
    expect(updated?.name).toBe("Updated");
    expect(updated?.price).toBe(49.99);
    expect(updated?.featured).toBe(1);
  });
});

describe("ProductRepository.delete", () => {
  test("removes the product", () => {
    const id = seedProduct(db, categoryId);
    repo.delete(id);
    expect(repo.findById(id)).toBeNull();
  });
});
