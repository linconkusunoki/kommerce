import { describe, test, expect, mock } from "bun:test";
import { ProductService } from "../../services/ProductService.ts";
import type { IProductRepository, IVariantRepository } from "../../repositories/interfaces.ts";

function mockProductRepo(overrides: Partial<IProductRepository> = {}): IProductRepository {
  return {
    findBySlug: mock(() => null),
    findFeatured: mock(() => []),
    findByCategory: mock(() => []),
    search: mock(() => []),
    findAll: mock(() => []),
    findById: mock(() => null),
    create: mock(() => 1),
    update: mock(() => {}),
    delete: mock(() => {}),
    ...overrides,
  };
}

function mockVariantRepo(overrides: Partial<IVariantRepository> = {}): IVariantRepository {
  return {
    findByProduct: mock(() => []),
    findByOptions: mock(() => null),
    add: mock(() => {}),
    delete: mock(() => {}),
    ...overrides,
  };
}

describe("ProductService.getBySlug", () => {
  test("returns null when product not found", () => {
    const service = new ProductService(mockProductRepo(), mockVariantRepo());
    expect(service.getBySlug("nonexistent")).toBeNull();
  });

  test("returns product when found", () => {
    const fakeProduct = { id: 1, name: "Shirt", slug: "shirt" } as any;
    const repo = mockProductRepo({ findBySlug: mock(() => fakeProduct) });
    const service = new ProductService(repo, mockVariantRepo());
    expect(service.getBySlug("shirt")).toEqual(fakeProduct);
  });
});

describe("ProductService.search", () => {
  test("delegates query to repo.search", () => {
    const searchFn = mock(() => []);
    const service = new ProductService(mockProductRepo({ search: searchFn }), mockVariantRepo());
    service.search("blue shirt");
    expect(searchFn).toHaveBeenCalledWith("blue shirt");
  });
});

describe("ProductService.create", () => {
  test("returns new product id", () => {
    const repo = mockProductRepo({ create: mock(() => 42) });
    const service = new ProductService(repo, mockVariantRepo());
    const id = service.create({
      name: "Shirt",
      slug: "shirt",
      description: "",
      price: 29.99,
      compare_at_price: null,
      category_id: 1,
      image_url: null,
      featured: 0,
    });
    expect(id).toBe(42);
  });
});

describe("ProductService.getVariants", () => {
  test("delegates to variantRepo.findByProduct", () => {
    const findByProduct = mock(() => [{ id: 1, size: "M" }] as any);
    const service = new ProductService(mockProductRepo(), mockVariantRepo({ findByProduct }));
    service.getVariants(5);
    expect(findByProduct).toHaveBeenCalledWith(5);
  });
});

describe("ProductService.deleteVariant", () => {
  test("passes variantId and productId to variantRepo.delete", () => {
    const deleteFn = mock(() => {});
    const service = new ProductService(mockProductRepo(), mockVariantRepo({ delete: deleteFn }));
    service.deleteVariant(3, 7);
    expect(deleteFn).toHaveBeenCalledWith(3, 7);
  });
});
