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
    create: mock(async () => {}),
    findByNumber: mock(async () => null),
    findById: mock(async () => null),
    findAll: mock(async () => []),
    findByCustomer: mock(async () => []),
    getStatusCounts: mock(async () => []),
    updateStatus: mock(async () => {}),
    getItems: mock(async () => []),
    getItemsByOrderNumber: mock(async () => []),
    ...overrides,
  };
}

function mockCartRepo(items: CartItem[] = []): ICartRepository {
  return {
    getItems: mock(async () => items),
    getCount: mock(async () => items.reduce((s, i) => s + i.quantity, 0)),
    getExistingItem: mock(async () => null),
    addItem: mock(async () => {}),
    updateItem: mock(async () => {}),
    removeItem: mock(async () => {}),
    clearCart: mock(async () => {}),
  };
}

describe("OrderService.placeOrder", () => {
  test("returns null when cart is empty", async () => {
    const service = new OrderService(mockOrderRepo(), mockCartRepo([]));
    const result = await service.placeOrder("session-1", validInput);
    expect(result).toBeNull();
  });

  test("creates order and returns order number when cart has items", async () => {
    const createOrder = mock(async () => {});
    const orderRepo = mockOrderRepo({ create: createOrder, getItemsByOrderNumber: mock(async () => []) });
    const service = new OrderService(orderRepo, mockCartRepo([makeCartItem()]));

    const result = await service.placeOrder("session-1", validInput);
    expect(result).toMatch(/^KOM-/);
    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  test("passes session id and order number to orderRepo.create", async () => {
    const createOrder = mock(async () => {});
    const orderRepo = mockOrderRepo({ create: createOrder, getItemsByOrderNumber: mock(async () => []) });
    const cartItems = [makeCartItem()];
    const service = new OrderService(orderRepo, mockCartRepo(cartItems));

    const orderNumber = (await service.placeOrder("session-abc", validInput))!;

    const [input, items, number, sessionId] = (createOrder as any).mock.calls[0];
    expect(sessionId).toBe("session-abc");
    expect(number).toBe(orderNumber);
    expect(input).toMatchObject({ email: "test@example.com" });
    expect(items).toEqual(cartItems);
  });
});

describe("OrderService.getOrderByNumber", () => {
  test("returns null when order not found", async () => {
    const service = new OrderService(mockOrderRepo(), mockCartRepo());
    expect(await service.getOrderByNumber("NONEXISTENT")).toBeNull();
  });

  test("returns order and items when found", async () => {
    const fakeOrder = { id: 1, order_number: "KOM-123", status: "pending" } as any;
    const fakeItems = [{ id: 1, product_name: "Shirt" }] as any;
    const orderRepo = mockOrderRepo({
      findByNumber: mock(async () => fakeOrder),
      getItems: mock(async () => fakeItems),
    });
    const service = new OrderService(orderRepo, mockCartRepo());
    const result = await service.getOrderByNumber("KOM-123");
    expect(result?.order).toEqual(fakeOrder);
    expect(result?.items).toEqual(fakeItems);
  });

  test("hides an order from unrelated visitors", async () => {
    const orderRepo = mockOrderRepo({
      findByNumber: mock(
        async () => ({ id: 1, order_number: "KOM-123", customer_id: null, visitor_session_id: "visitor-1" }) as any,
      ),
    });
    const service = new OrderService(orderRepo, mockCartRepo());

    expect(await service.getOrderByNumberForVisitor("KOM-123", "visitor-2")).toBeNull();
  });

  test("allows the visitor that placed a guest order", async () => {
    const fakeOrder = { id: 1, order_number: "KOM-123", customer_id: null, visitor_session_id: "visitor-1" } as any;
    const fakeItems = [{ id: 1, product_name: "Shirt" }] as any;
    const orderRepo = mockOrderRepo({
      findByNumber: mock(async () => fakeOrder),
      getItems: mock(async () => fakeItems),
    });
    const service = new OrderService(orderRepo, mockCartRepo());

    expect((await service.getOrderByNumberForVisitor("KOM-123", "visitor-1"))?.items).toEqual(fakeItems);
  });

  test("allows the Customer who owns an order", async () => {
    const fakeOrder = { id: 1, order_number: "KOM-123", customer_id: 7, visitor_session_id: "other" } as any;
    const orderRepo = mockOrderRepo({ findByNumber: mock(async () => fakeOrder) });
    const service = new OrderService(orderRepo, mockCartRepo());

    expect((await service.getOrderByNumberForVisitor("KOM-123", "visitor-1", 7))?.order).toEqual(fakeOrder);
  });

  test("does not use guest possession for a Customer-owned order", async () => {
    const orderRepo = mockOrderRepo({
      findByNumber: mock(
        async () => ({ id: 1, order_number: "KOM-123", customer_id: 7, visitor_session_id: "visitor-1" }) as any,
      ),
    });
    const service = new OrderService(orderRepo, mockCartRepo());

    expect(await service.getOrderByNumberForVisitor("KOM-123", "visitor-1")).toBeNull();
  });
});

describe("OrderService.listOrders", () => {
  test("returns orders and status counts", async () => {
    const fakeOrders = [{ id: 1, order_number: "KOM-1" }] as any;
    const fakeCounts = [{ status: "pending", count: 1 }];
    const orderRepo = mockOrderRepo({
      findAll: mock(async () => fakeOrders),
      getStatusCounts: mock(async () => fakeCounts),
    });
    const service = new OrderService(orderRepo, mockCartRepo());
    const result = await service.listOrders();
    expect(result.orders).toEqual(fakeOrders);
    expect(result.statusCounts).toEqual(fakeCounts);
  });

  test("passes status filter to findAll", async () => {
    const findAll = mock(async () => []);
    const orderRepo = mockOrderRepo({ findAll });
    const service = new OrderService(orderRepo, mockCartRepo());
    await service.listOrders("pending");
    expect(findAll).toHaveBeenCalledWith("pending");
  });
});
