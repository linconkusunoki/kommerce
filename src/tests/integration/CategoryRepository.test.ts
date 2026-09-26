import { describe, test, expect, beforeEach } from "bun:test";
import { PostgresCategoryRepository } from "../../repositories/CategoryRepository.ts";
import { createTestDb, postgresAvailable, seedCategory } from "./helpers.ts";
import type { SQL } from "bun";

const integrationDescribe = postgresAvailable ? describe : describe.skip;
let db: SQL;
let repo: PostgresCategoryRepository;

beforeEach(async () => {
  db = await createTestDb();
  repo = new PostgresCategoryRepository(db);
});

integrationDescribe("CategoryRepository.findAll", () => {
  test("returns empty array when no categories", async () => {
    expect(await repo.findAll()).toEqual([]);
  });

  test("returns categories ordered by sort_order", async () => {
    await repo.create({ name: "B", slug: "b", description: null, image_url: null, sort_order: 2 });
    await repo.create({ name: "A", slug: "a", description: null, image_url: null, sort_order: 1 });
    const all = await repo.findAll();
    expect(all[0]!.name).toBe("A");
    expect(all[1]!.name).toBe("B");
  });
});

integrationDescribe("CategoryRepository.findBySlug", () => {
  test("returns null for unknown slug", async () => {
    expect(await repo.findBySlug("unknown")).toBeNull();
  });

  test("returns category for known slug", async () => {
    await repo.create({ name: "Tops", slug: "tops", description: null, image_url: null, sort_order: 0 });
    const cat = await repo.findBySlug("tops");
    expect(cat?.name).toBe("Tops");
  });
});

integrationDescribe("CategoryRepository.findAllWithCount", () => {
  test("includes product_count", async () => {
    const catId = await seedCategory(db);
    const all = await repo.findAllWithCount();
    expect(all.find((c) => c.id === catId)?.product_count).toBe(0);
  });
});

integrationDescribe("CategoryRepository.create", () => {
  test("inserts a new category", async () => {
    await repo.create({ name: "Pants", slug: "pants", description: "Bottoms", image_url: null, sort_order: 1 });
    const cat = await repo.findBySlug("pants");
    expect(cat).not.toBeNull();
    expect(cat?.description).toBe("Bottoms");
  });

  test("throws on duplicate slug", async () => {
    await repo.create({ name: "Tops", slug: "tops", description: null, image_url: null, sort_order: 0 });
    expect(
      repo.create({ name: "Tops2", slug: "tops", description: null, image_url: null, sort_order: 1 }),
    ).rejects.toThrow();
  });
});

integrationDescribe("CategoryRepository.update", () => {
  test("updates category fields", async () => {
    const id = await seedCategory(db);
    await repo.update(id, {
      name: "Updated",
      slug: "updated",
      description: "New desc",
      image_url: null,
      sort_order: 5,
    });
    const cat = await repo.findById(id);
    expect(cat?.name).toBe("Updated");
    expect(cat?.sort_order).toBe(5);
  });
});

integrationDescribe("CategoryRepository.delete", () => {
  test("removes the category", async () => {
    const id = await seedCategory(db);
    await repo.delete(id);
    expect(await repo.findById(id)).toBeNull();
  });
});
