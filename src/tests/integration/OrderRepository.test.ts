import { describe, test, expect, beforeEach } from "bun:test";
import { SqliteOrderRepository } from "../../repositories/OrderRepository.ts";
import {
  createTestDb,
  seedCategory,
  seedProduct,
  seedVariant,
  seedVisitorSession,
} from "./helpers.ts";
import type { Database } from "bun:sqlite";
import type { CartItem, PlaceOrderInput } from "../../types/index.ts";

let db: Database;
let repo: SqliteOrderRepository;
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

beforeEach(() => {
  db = createTestDb();
  repo = new SqliteOrderRepository(db);
  sessionId = seedVisitorSession(db);
  const categoryId = seedCategory(db);
  const productId = seedProduct(db, categoryId);
  variantId = seedVariant(db, productId, { stock: 10 });
});

describe("OrderRepository.create", () => {
  test("creates an order with items and clears the cart", () => {
    // Seed a cart item
    db.prepare("INSERT INTO cart_items (session_id, variant_id, quantity) VALUES (?, ?, ?)").run(
      sessionId,
      variantId,
      2,
    );

    const items = [makeCartItem()];
    repo.create(validInput, items, "KOM-TEST-001", sessionId);

    const order = repo.findByNumber("KOM-TEST-001");
    expect(order).not.toBeNull();
    expect(order!.email).toBe("test@example.com");
    expect(order!.total).toBeCloseTo(59.98);

    // Cart should be cleared
    const cartCount = (
      db.query("SELECT COUNT(*) as count FROM cart_items WHERE session_id = ?").get(sessionId) as any
    ).count;
    expect(cartCount).toBe(0);
  });

  test("creates order items with correct data", () => {
    const items = [makeCartItem({ quantity: 3, product_price: 10.0 })];
    repo.create(validInput, items, "KOM-TEST-002", sessionId);

    const order = repo.findByNumber("KOM-TEST-002")!;
    const orderItems = repo.getItems(order.id);
    expect(orderItems).toHaveLength(1);
    expect(orderItems[0]!.product_name).toBe("Test Product");
    expect(orderItems[0]!.quantity).toBe(3);
    expect(orderItems[0]!.total).toBeCloseTo(30.0);
  });

  test("decrements product variant stock atomically", () => {
    const before = (
      db.query("SELECT stock FROM product_variants WHERE id = ?").get(variantId) as any
    ).stock;

    const items = [makeCartItem({ quantity: 3 })];
    repo.create(validInput, items, "KOM-TEST-003", sessionId);

    const after = (
      db.query("SELECT stock FROM product_variants WHERE id = ?").get(variantId) as any
    ).stock;
    expect(after).toBe(before - 3);
  });
});

describe("OrderRepository.findByNumber", () => {
  test("returns null for unknown order number", () => {
    expect(repo.findByNumber("KOM-UNKNOWN")).toBeNull();
  });
});

describe("OrderRepository.findByCustomer", () => {
  test("returns an order for its customer even when checkout email differs", () => {
    db.exec("INSERT INTO customer_users (email, password_hash, display_name) VALUES ('account@example.com', 'hash', 'Customer')");
    const customerId = Number(db.query("SELECT last_insert_rowid() AS id").get() as { id: number });
    repo.create({ ...validInput, email: "checkout@example.com" }, [makeCartItem()], "KOM-CUSTOMER-1", sessionId, customerId);

    const orders = repo.findByCustomer(customerId, "account@example.com");

    expect(orders.map((order) => order.order_number)).toContain("KOM-CUSTOMER-1");
  });
});

describe("OrderRepository.findAll", () => {
  test("returns all orders when no filter", () => {
    repo.create(validInput, [makeCartItem()], "KOM-1", sessionId);
    repo.create(validInput, [makeCartItem()], "KOM-2", sessionId);
    const orders = repo.findAll();
    expect(orders.length).toBeGreaterThanOrEqual(2);
  });

  test("filters by status", () => {
    repo.create(validInput, [makeCartItem()], "KOM-FILTER-1", sessionId);
    const order = repo.findByNumber("KOM-FILTER-1")!;
    repo.updateStatus(order.id, "confirmed");

    const pending = repo.findAll("pending");
    const confirmed = repo.findAll("confirmed");
    expect(pending.every((o) => o.status === "pending")).toBe(true);
    expect(confirmed.some((o) => o.order_number === "KOM-FILTER-1")).toBe(true);
  });
});

describe("OrderRepository.updateStatus", () => {
  test("changes order status", () => {
    repo.create(validInput, [makeCartItem()], "KOM-STATUS-1", sessionId);
    const order = repo.findByNumber("KOM-STATUS-1")!;
    repo.updateStatus(order.id, "shipped");
    const updated = repo.findById(order.id);
    expect(updated?.status).toBe("shipped");
  });
});

describe("OrderRepository.getStatusCounts", () => {
  test("returns counts grouped by status", () => {
    repo.create(validInput, [makeCartItem()], "KOM-SC-1", sessionId);
    const counts = repo.getStatusCounts();
    const pendingCount = counts.find((c) => c.status === "pending");
    expect(pendingCount?.count).toBeGreaterThanOrEqual(1);
  });
});
