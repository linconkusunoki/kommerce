import { describe, test, expect, mock } from "bun:test";
import { CartService } from "../../services/CartService.ts";
import type { ICartRepository, IVariantRepository } from "../../repositories/interfaces.ts";
import type { CartItem } from "../../types/index.ts";

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    variant_id: 10,
    quantity: 1,
    size: "M",
    color: "Black",
    stock: 5,
    product_name: "Test Product",
    product_slug: "test-product",
    product_price: 29.99,
    product_image: null,
    ...overrides,
  };
}

function mockCartRepo(overrides: Partial<ICartRepository> = {}): ICartRepository {
  return {
    getItems: mock(() => []),
    getCount: mock(() => 0),
    getExistingItem: mock(() => null),
    addItem: mock(() => {}),
    updateItem: mock(() => {}),
    removeItem: mock(() => {}),
    clearCart: mock(() => {}),
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

describe("CartService.getCart", () => {
  test("returns empty cart when no items", () => {
    const service = new CartService(mockCartRepo(), mockVariantRepo());
    const result = service.getCart("session-1");
    expect(result.items).toEqual([]);
    expect(result.subtotal).toBe(0);
    expect(result.count).toBe(0);
  });

  test("calculates subtotal from items", () => {
    const items = [
      makeCartItem({ product_price: 10.0, quantity: 2 }),
      makeCartItem({ id: 2, product_price: 5.5, quantity: 3 }),
    ];
    const cartRepo = mockCartRepo({
      getItems: mock(() => items),
      getCount: mock(() => 5),
    });
    const service = new CartService(cartRepo, mockVariantRepo());
    const result = service.getCart("session-1");
    expect(result.subtotal).toBe(36.5);
    expect(result.count).toBe(5);
  });
});

describe("CartService.addToCart", () => {
  test("returns false when variant not found", () => {
    const variantRepo = mockVariantRepo({ findByOptions: mock(() => null) });
    const service = new CartService(mockCartRepo(), variantRepo);
    const result = service.addToCart("session-1", 1, "M", "Black", 1);
    expect(result).toBe(false);
  });

  test("adds new item to cart when not already present", () => {
    const addItem = mock(() => {});
    const cartRepo = mockCartRepo({ getExistingItem: mock(() => null), addItem });
    const variantRepo = mockVariantRepo({ findByOptions: mock(() => ({ id: 10, stock: 5 })) });
    const service = new CartService(cartRepo, variantRepo);

    const result = service.addToCart("session-1", 1, "M", "Black", 2);
    expect(result).toBe(true);
    expect(addItem).toHaveBeenCalledWith("session-1", 10, 2);
  });

  test("updates existing item quantity when already in cart", () => {
    const updateItem = mock(() => {});
    const cartRepo = mockCartRepo({
      getExistingItem: mock(() => ({ id: 5, quantity: 3 })),
      updateItem,
    });
    const variantRepo = mockVariantRepo({ findByOptions: mock(() => ({ id: 10, stock: 10 })) });
    const service = new CartService(cartRepo, variantRepo);

    service.addToCart("session-1", 1, "M", "Black", 2);
    expect(updateItem).toHaveBeenCalledWith(5, "session-1", 5); // 3 + 2 = 5
  });

  test("clamps quantity to max 10 when adding", () => {
    const addItem = mock(() => {});
    const cartRepo = mockCartRepo({ getExistingItem: mock(() => null), addItem });
    const variantRepo = mockVariantRepo({ findByOptions: mock(() => ({ id: 10, stock: 20 })) });
    const service = new CartService(cartRepo, variantRepo);

    service.addToCart("session-1", 1, "M", "Black", 15);
    expect(addItem).toHaveBeenCalledWith("session-1", 10, 10);
  });

  test("clamps to stock limit when stock is lower than requested", () => {
    const addItem = mock(() => {});
    const cartRepo = mockCartRepo({ getExistingItem: mock(() => null), addItem });
    const variantRepo = mockVariantRepo({ findByOptions: mock(() => ({ id: 10, stock: 3 })) });
    const service = new CartService(cartRepo, variantRepo);

    service.addToCart("session-1", 1, "M", "Black", 5);
    expect(addItem).toHaveBeenCalledWith("session-1", 10, 3);
  });

  test("clamps combined quantity to max 10 when updating", () => {
    const updateItem = mock(() => {});
    const cartRepo = mockCartRepo({
      getExistingItem: mock(() => ({ id: 5, quantity: 8 })),
      updateItem,
    });
    const variantRepo = mockVariantRepo({ findByOptions: mock(() => ({ id: 10, stock: 20 })) });
    const service = new CartService(cartRepo, variantRepo);

    service.addToCart("session-1", 1, "M", "Black", 5);
    expect(updateItem).toHaveBeenCalledWith(5, "session-1", 10); // min(8+5=13, 20, 10) = 10
  });
});

describe("CartService.updateQuantity", () => {
  test("clamps quantity between 1 and 10", () => {
    const updateItem = mock(() => {});
    const service = new CartService(mockCartRepo({ updateItem }), mockVariantRepo());

    service.updateQuantity("session-1", 1, 0);
    expect(updateItem).toHaveBeenCalledWith(1, "session-1", 1);

    service.updateQuantity("session-1", 1, 15);
    expect(updateItem).toHaveBeenCalledWith(1, "session-1", 10);
  });
});

describe("CartService.removeItem", () => {
  test("delegates to cartRepo.removeItem with correct argument order", () => {
    const removeItem = mock(() => {});
    const service = new CartService(mockCartRepo({ removeItem }), mockVariantRepo());
    service.removeItem("session-1", 42);
    expect(removeItem).toHaveBeenCalledWith(42, "session-1");
  });
});
