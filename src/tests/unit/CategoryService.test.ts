import { describe, test, expect, mock } from "bun:test";
import { CategoryService } from "../../services/CategoryService.ts";
import type { ICategoryRepository } from "../../repositories/interfaces.ts";

function mockCategoryRepo(overrides: Partial<ICategoryRepository> = {}): ICategoryRepository {
  return {
    findAll: mock(() => []),
    findBySlug: mock(() => null),
    findById: mock(() => null),
    findAllWithCount: mock(() => []),
    create: mock(() => {}),
    update: mock(() => {}),
    delete: mock(() => {}),
    ...overrides,
  };
}

describe("CategoryService.getBySlug", () => {
  test("returns null when not found", () => {
    const service = new CategoryService(mockCategoryRepo());
    expect(service.getBySlug("unknown")).toBeNull();
  });

  test("returns category when found", () => {
    const fakeCategory = { id: 1, name: "Tops", slug: "tops" } as any;
    const repo = mockCategoryRepo({ findBySlug: mock(() => fakeCategory) });
    const service = new CategoryService(repo);
    expect(service.getBySlug("tops")).toEqual(fakeCategory);
  });
});

describe("CategoryService.getAllWithCount", () => {
  test("returns categories with product counts", () => {
    const fakeData = [{ id: 1, name: "Tops", product_count: 5 }] as any;
    const repo = mockCategoryRepo({ findAllWithCount: mock(() => fakeData) });
    const service = new CategoryService(repo);
    expect(service.getAllWithCount()).toEqual(fakeData);
  });
});

describe("CategoryService.create", () => {
  test("delegates to repo.create with correct data", () => {
    const createFn = mock(() => {});
    const service = new CategoryService(mockCategoryRepo({ create: createFn }));
    const data = { name: "Tops", slug: "tops", description: null, image_url: null, sort_order: 0 };
    service.create(data);
    expect(createFn).toHaveBeenCalledWith(data);
  });
});

describe("CategoryService.delete", () => {
  test("delegates to repo.delete", () => {
    const deleteFn = mock(() => {});
    const service = new CategoryService(mockCategoryRepo({ delete: deleteFn }));
    service.delete(3);
    expect(deleteFn).toHaveBeenCalledWith(3);
  });
});
