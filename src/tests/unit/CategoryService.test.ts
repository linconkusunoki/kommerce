import { describe, test, expect, mock } from "bun:test";
import { CategoryService } from "../../services/CategoryService.ts";
import type { ICategoryRepository } from "../../repositories/interfaces.ts";

function mockCategoryRepo(overrides: Partial<ICategoryRepository> = {}): ICategoryRepository {
  return {
    findAll: mock(async () => []),
    findBySlug: mock(async () => null),
    findById: mock(async () => null),
    findAllWithCount: mock(async () => []),
    create: mock(async () => {}),
    update: mock(async () => {}),
    delete: mock(async () => {}),
    ...overrides,
  };
}

describe("CategoryService.getBySlug", () => {
  test("returns null when not found", async () => {
    const service = new CategoryService(mockCategoryRepo());
    expect(await service.getBySlug("unknown")).toBeNull();
  });

  test("returns category when found", async () => {
    const fakeCategory = { id: 1, name: "Tops", slug: "tops" } as any;
    const repo = mockCategoryRepo({ findBySlug: mock(async () => fakeCategory) });
    const service = new CategoryService(repo);
    expect(await service.getBySlug("tops")).toEqual(fakeCategory);
  });
});

describe("CategoryService.getAllWithCount", () => {
  test("returns categories with product counts", async () => {
    const fakeData = [{ id: 1, name: "Tops", product_count: 5 }] as any;
    const repo = mockCategoryRepo({ findAllWithCount: mock(async () => fakeData) });
    const service = new CategoryService(repo);
    expect(await service.getAllWithCount()).toEqual(fakeData);
  });
});

describe("CategoryService.create", () => {
  test("delegates to repo.create with correct data", async () => {
    const createFn = mock(async () => {});
    const service = new CategoryService(mockCategoryRepo({ create: createFn }));
    const data = { name: "Tops", slug: "tops", description: null, image_url: null, sort_order: 0 };
    await service.create(data);
    expect(createFn).toHaveBeenCalledWith(data);
  });
});

describe("CategoryService.delete", () => {
  test("delegates to repo.delete", async () => {
    const deleteFn = mock(async () => {});
    const service = new CategoryService(mockCategoryRepo({ delete: deleteFn }));
    await service.delete(3);
    expect(deleteFn).toHaveBeenCalledWith(3);
  });
});
