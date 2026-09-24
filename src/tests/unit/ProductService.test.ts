import { describe, test, expect, mock } from "bun:test";
import { ProductService } from "../../services/ProductService.ts";
import type { IProductRepository, IVariantRepository } from "../../repositories/interfaces.ts";
import type { ObjectStorage } from "../../services/ObjectStorage.ts";

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

function mockStorage(overrides: Partial<ObjectStorage> = {}): ObjectStorage {
  return {
    upload: mock(async () => "https://cdn.test/products/new"),
    delete: mock(async () => {}),
    owns: mock(() => true),
    ...overrides,
  };
}

describe("ProductService.getBySlug", () => {
  test("returns null when product not found", () => {
    const service = new ProductService(mockProductRepo(), mockVariantRepo(), mockStorage());
    expect(service.getBySlug("nonexistent")).toBeNull();
  });

  test("returns product when found", () => {
    const fakeProduct = { id: 1, name: "Shirt", slug: "shirt" } as any;
    const repo = mockProductRepo({ findBySlug: mock(() => fakeProduct) });
    const service = new ProductService(repo, mockVariantRepo(), mockStorage());
    expect(service.getBySlug("shirt")).toEqual(fakeProduct);
  });
});

describe("ProductService.search", () => {
  test("delegates query to repo.search", () => {
    const searchFn = mock(() => []);
    const service = new ProductService(mockProductRepo({ search: searchFn }), mockVariantRepo(), mockStorage());
    service.search("blue shirt");
    expect(searchFn).toHaveBeenCalledWith("blue shirt");
  });
});

describe("ProductService.create", () => {
  test("returns new product id", () => {
    const repo = mockProductRepo({ create: mock(() => 42) });
    const service = new ProductService(repo, mockVariantRepo(), mockStorage());
    const id = service.create({
      name: "Shirt",
      slug: "shirt",
      description: "",
      price: 29.99,
      compare_at_price: null,
      category_id: 1,
      image_url: null,
      featured: false,
    });
    expect(id).toBe(42);
  });
});

describe("ProductService.getVariants", () => {
  test("delegates to variantRepo.findByProduct", () => {
    const findByProduct = mock(() => [{ id: 1, size: "M" }] as any);
    const service = new ProductService(mockProductRepo(), mockVariantRepo({ findByProduct }), mockStorage());
    service.getVariants(5);
    expect(findByProduct).toHaveBeenCalledWith(5);
  });
});

describe("ProductService.deleteVariant", () => {
  test("passes variantId and productId to variantRepo.delete", () => {
    const deleteFn = mock(() => {});
    const service = new ProductService(mockProductRepo(), mockVariantRepo({ delete: deleteFn }), mockStorage());
    service.deleteVariant(3, 7);
    expect(deleteFn).toHaveBeenCalledWith(3, 7);
  });
});

describe("ProductService image lifecycle", () => {
  const input = {
    name: "Shirt",
    slug: "shirt",
    description: "",
    price: 29.99,
    compare_at_price: null,
    category_id: 1,
    image_url: "https://example.com/old.jpg",
    image_alt_text: null,
    featured: false,
  };

  test("rolls back an uploaded image when product creation fails", async () => {
    const upload = mock(async () => "https://cdn.test/products/new");
    const remove = mock(async () => {});
    const service = new ProductService(
      mockProductRepo({
        create: mock(() => {
          throw new Error("database failed");
        }),
      }),
      mockVariantRepo(),
      mockStorage({ upload, delete: remove }),
    );

    await expect(service.createWithImage(input, new File(["image"], "image.png"))).rejects.toThrow("database failed");
    expect(remove).toHaveBeenCalledWith("https://cdn.test/products/new");
  });

  test("cleans up the old image after a successful replacement", async () => {
    const update = mock(() => {});
    const remove = mock(async () => {});
    const service = new ProductService(
      mockProductRepo({ findById: mock(() => ({ id: 1, image_url: "https://cdn.test/products/old" }) as any), update }),
      mockVariantRepo(),
      mockStorage({ delete: remove }),
    );

    await service.updateWithImage(1, input, new File(["image"], "image.png"));
    expect(update).toHaveBeenCalledWith(1, { ...input, image_url: "https://cdn.test/products/new" });
    expect(remove).toHaveBeenCalledWith("https://cdn.test/products/old");
  });

  test("deletes the stored image with the product", async () => {
    const remove = mock(async () => {});
    const service = new ProductService(
      mockProductRepo({ findById: mock(() => ({ id: 1, image_url: "https://cdn.test/products/old" }) as any) }),
      mockVariantRepo(),
      mockStorage({ delete: remove }),
    );

    await service.deleteWithImage(1);
    expect(remove).toHaveBeenCalledWith("https://cdn.test/products/old");
  });
});
