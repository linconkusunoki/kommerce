import { describe, test, expect, mock, beforeEach } from "bun:test";
import { OrderService } from "../../services/OrderService.ts";
import type { ICartRepository, IOrderRepository } from "../../repositories/interfaces.ts";
import type { CartItem, PlaceOrderInput } from "../../types/index.ts";

const validInput: PlaceOrderInput = {
  email: "test@example.com",
  name: "John Doe",
  address: "123 Main St",
  city: "New York",
  postal_code: "10001",
  country: "US",
  phone: "",
  notes: "",
};

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    variant_id: 10,
    quantity: 2,
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

function mockOrderRepo(overrides: Partial<IOrderRepository> = {}): IOrderRepository {
  return {
    create: mock(() => {}),
    findByNumber: mock(() => null),
    findById: mock(() => null),
    findAll: mock(() => []),
    getStatusCounts: mock(() => []),
    updateStatus: mock(() => {}),
    getItems: mock(() => []),
    getItemsByOrderNumber: mock(() => []),
    ...overrides,
  };
}

function mockCartRepo(items: CartItem[] = []): ICartRepository {
  return {
    getItems: mock(() => items),
    getCount: mock(() => items.reduce((s, i) => s + i.quantity, 0)),
    getExistingItem: mock(() => null),
    addItem: mock(() => {}),
    updateItem: mock(() => {}),
    removeItem: mock(() => {}),
    clearCart: mock(() => {}),
  };
}

describe("OrderService.placeOrder", () => {
  test("returns null when cart is empty", () => {
    const service = new OrderService(mockOrderRepo(), mockCartRepo([]));
    const result = service.placeOrder("session-1", validInput);
    expect(result).toBeNull();
  });

  test("creates order and returns order number when cart has items", () => {
    const createOrder = mock(() => {});
    const orderRepo = mockOrderRepo({ create: createOrder, getItemsByOrderNumber: mock(() => []) });
    const service = new OrderService(orderRepo, mockCartRepo([makeCartItem()]));

    const result = service.placeOrder("session-1", validInput);
    expect(result).toMatch(/^KOM-/);
    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  test("passes session id and order number to orderRepo.create", () => {
    const createOrder = mock(() => {});
    const orderRepo = mockOrderRepo({ create: createOrder, getItemsByOrderNumber: mock(() => []) });
    const cartItems = [makeCartItem()];
    const service = new OrderService(orderRepo, mockCartRepo(cartItems));

    const orderNumber = service.placeOrder("session-abc", validInput)!;

    const [input, items, number, sessionId] = (createOrder as any).mock.calls[0];
    expect(sessionId).toBe("session-abc");
    expect(number).toBe(orderNumber);
    expect(input).toMatchObject({ email: "test@example.com" });
    expect(items).toEqual(cartItems);
  });
});

describe("OrderService.getOrderByNumber", () => {
  test("returns null when order not found", () => {
    const service = new OrderService(mockOrderRepo(), mockCartRepo());
    expect(service.getOrderByNumber("NONEXISTENT")).toBeNull();
  });

  test("returns order and items when found", () => {
    const fakeOrder = { id: 1, order_number: "KOM-123", status: "pending" } as any;
    const fakeItems = [{ id: 1, product_name: "Shirt" }] as any;
    const orderRepo = mockOrderRepo({
      findByNumber: mock(() => fakeOrder),
      getItems: mock(() => fakeItems),
    });
    const service = new OrderService(orderRepo, mockCartRepo());
    const result = service.getOrderByNumber("KOM-123");
    expect(result?.order).toEqual(fakeOrder);
    expect(result?.items).toEqual(fakeItems);
  });
});

describe("OrderService.listOrders", () => {
  test("returns orders and status counts", () => {
    const fakeOrders = [{ id: 1, order_number: "KOM-1" }] as any;
    const fakeCounts = [{ status: "pending", count: 1 }];
    const orderRepo = mockOrderRepo({
      findAll: mock(() => fakeOrders),
      getStatusCounts: mock(() => fakeCounts),
    });
    const service = new OrderService(orderRepo, mockCartRepo());
    const result = service.listOrders();
    expect(result.orders).toEqual(fakeOrders);
    expect(result.statusCounts).toEqual(fakeCounts);
  });

  test("passes status filter to findAll", () => {
    const findAll = mock(() => []);
    const orderRepo = mockOrderRepo({ findAll });
    const service = new OrderService(orderRepo, mockCartRepo());
    service.listOrders("pending");
    expect(findAll).toHaveBeenCalledWith("pending");
  });
});
