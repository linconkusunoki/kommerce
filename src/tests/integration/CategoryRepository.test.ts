import { describe, test, expect, beforeEach } from "bun:test";
import { SqliteCategoryRepository } from "../../repositories/CategoryRepository.ts";
import { createTestDb, seedCategory } from "./helpers.ts";
import type { Database } from "bun:sqlite";

let db: Database;
let repo: SqliteCategoryRepository;

beforeEach(() => {
  db = createTestDb();
  repo = new SqliteCategoryRepository(db);
});

describe("CategoryRepository.findAll", () => {
  test("returns empty array when no categories", () => {
    expect(repo.findAll()).toEqual([]);
  });

  test("returns categories ordered by sort_order", () => {
    repo.create({ name: "B", slug: "b", description: null, image_url: null, sort_order: 2 });
    repo.create({ name: "A", slug: "a", description: null, image_url: null, sort_order: 1 });
    const all = repo.findAll();
    expect(all[0]!.name).toBe("A");
    expect(all[1]!.name).toBe("B");
  });
});

describe("CategoryRepository.findBySlug", () => {
  test("returns null for unknown slug", () => {
    expect(repo.findBySlug("unknown")).toBeNull();
  });

  test("returns category for known slug", () => {
    repo.create({ name: "Tops", slug: "tops", description: null, image_url: null, sort_order: 0 });
    const cat = repo.findBySlug("tops");
    expect(cat?.name).toBe("Tops");
  });
});

describe("CategoryRepository.findAllWithCount", () => {
  test("includes product_count", () => {
    const catId = seedCategory(db);
    // No products yet
    const all = repo.findAllWithCount();
    const cat = all.find((c) => c.id === catId);
    expect(cat?.product_count).toBe(0);
  });
});

describe("CategoryRepository.create", () => {
  test("inserts a new category", () => {
    repo.create({ name: "Pants", slug: "pants", description: "Bottoms", image_url: null, sort_order: 1 });
    const cat = repo.findBySlug("pants");
    expect(cat).not.toBeNull();
    expect(cat?.description).toBe("Bottoms");
  });

  test("throws on duplicate slug", () => {
    repo.create({ name: "Tops", slug: "tops", description: null, image_url: null, sort_order: 0 });
    expect(() =>
      repo.create({ name: "Tops2", slug: "tops", description: null, image_url: null, sort_order: 1 }),
    ).toThrow();
  });
});

describe("CategoryRepository.update", () => {
  test("updates category fields", () => {
    const id = seedCategory(db);
    repo.update(id, { name: "Updated", slug: "updated", description: "New desc", image_url: null, sort_order: 5 });
    const cat = repo.findById(id);
    expect(cat?.name).toBe("Updated");
    expect(cat?.sort_order).toBe(5);
  });
});

describe("CategoryRepository.delete", () => {
  test("removes the category", () => {
    const id = seedCategory(db);
    repo.delete(id);
    expect(repo.findById(id)).toBeNull();
  });
});
