import { describe, test, expect, beforeEach } from "bun:test";
import { PostgresOrderRepository } from "../../repositories/OrderRepository.ts";
import {
  createTestDb,
  postgresAvailable,
  seedCategory,
  seedProduct,
  seedVariant,
  seedVisitorSession,
} from "./helpers.ts";
import type { SQL } from "bun";
import type { CartItem, PlaceOrderInput } from "../../types/index.ts";

const integrationDescribe = postgresAvailable ? describe : describe.skip;
let db: SQL;
let repo: PostgresOrderRepository;
let sessionId: string;
let variantId: number;

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
    variant_id: variantId,
    quantity: 2,
    size: "M",
    color: "Black",
    stock: 10,
    product_name: "Test Product",
    product_slug: "test-product",
    product_price: 29.99,
    product_image: null,
    ...overrides,
  };
}

beforeEach(async () => {
  db = await createTestDb();
  repo = new PostgresOrderRepository(db);
  sessionId = await seedVisitorSession(db);
  const categoryId = await seedCategory(db);
  const productId = await seedProduct(db, categoryId);
  variantId = await seedVariant(db, productId, { stock: 10 });
});

integrationDescribe("OrderRepository.create", () => {
  test("creates an order with items and clears the cart", async () => {
    await db`INSERT INTO cart_items (session_id, variant_id, quantity) VALUES (${sessionId}, ${variantId}, 2)`;

    await repo.create(validInput, [makeCartItem()], "KOM-TEST-001", sessionId);

    const order = await repo.findByNumber("KOM-TEST-001");
    expect(order).not.toBeNull();
    expect(order!.email).toBe("test@example.com");
    expect(order!.total).toBeCloseTo(59.98);
    const [cartCount] = await db`SELECT COUNT(*)::int AS count FROM cart_items WHERE session_id = ${sessionId}`;
    expect(cartCount.count).toBe(0);
  });

  test("creates order items with correct data", async () => {
    await repo.create(validInput, [makeCartItem({ quantity: 3, product_price: 10.0 })], "KOM-TEST-002", sessionId);

    const order = (await repo.findByNumber("KOM-TEST-002"))!;
    const orderItems = await repo.getItems(order.id);
    expect(orderItems).toHaveLength(1);
    expect(orderItems[0]!.product_name).toBe("Test Product");
    expect(orderItems[0]!.quantity).toBe(3);
    expect(orderItems[0]!.total).toBeCloseTo(30.0);
  });

  test("decrements product variant stock atomically", async () => {
    const [beforeRow] = await db`SELECT stock FROM product_variants WHERE id = ${variantId}`;

    await repo.create(validInput, [makeCartItem({ quantity: 3 })], "KOM-TEST-003", sessionId);

    const [afterRow] = await db`SELECT stock FROM product_variants WHERE id = ${variantId}`;
    expect(afterRow.stock).toBe(beforeRow.stock - 3);
  });
});

integrationDescribe("OrderRepository.findByNumber", () => {
  test("returns null for unknown order number", async () => {
    expect(await repo.findByNumber("KOM-UNKNOWN")).toBeNull();
  });
});

integrationDescribe("OrderRepository.findByCustomer", () => {
  test("returns an order for its customer even when checkout email differs", async () => {
    const [customer] = await db`INSERT INTO customer_users (email, password_hash, display_name)
      VALUES ('account@example.com', 'hash', 'Customer') RETURNING id`;
    const customerId = Number(customer.id);
    await repo.create(
      { ...validInput, email: "checkout@example.com" },
      [makeCartItem()],
      "KOM-CUSTOMER-1",
      sessionId,
      customerId,
    );

    const orders = await repo.findByCustomer(customerId, "account@example.com");
    expect(orders.map((order) => order.order_number)).toContain("KOM-CUSTOMER-1");
  });
});

integrationDescribe("OrderRepository.findAll", () => {
  test("returns all orders when no filter", async () => {
    await repo.create(validInput, [makeCartItem()], "KOM-1", sessionId);
    await repo.create(validInput, [makeCartItem()], "KOM-2", sessionId);
    const orders = await repo.findAll();
    expect(orders.length).toBeGreaterThanOrEqual(2);
  });

  test("filters by status", async () => {
    await repo.create(validInput, [makeCartItem()], "KOM-FILTER-1", sessionId);
    const order = (await repo.findByNumber("KOM-FILTER-1"))!;
    await repo.updateStatus(order.id, "confirmed");

    const pending = await repo.findAll("pending");
    const confirmed = await repo.findAll("confirmed");
    expect(pending.every((o) => o.status === "pending")).toBe(true);
    expect(confirmed.some((o) => o.order_number === "KOM-FILTER-1")).toBe(true);
  });
});

integrationDescribe("OrderRepository.updateStatus", () => {
  test("changes order status", async () => {
    await repo.create(validInput, [makeCartItem()], "KOM-STATUS-1", sessionId);
    const order = (await repo.findByNumber("KOM-STATUS-1"))!;
    await repo.updateStatus(order.id, "shipped");
    expect((await repo.findById(order.id))?.status).toBe("shipped");
  });
});

integrationDescribe("OrderRepository.getStatusCounts", () => {
  test("returns counts grouped by status", async () => {
    await repo.create(validInput, [makeCartItem()], "KOM-SC-1", sessionId);
    const counts = await repo.getStatusCounts();
    expect(counts.find((c) => c.status === "pending")?.count).toBeGreaterThanOrEqual(1);
  });
});
