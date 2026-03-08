import { describe, test, expect, beforeEach } from "bun:test";
import { SqliteCartRepository } from "../../repositories/CartRepository.ts";
import { createTestDb, seedCategory, seedProduct, seedVariant, seedVisitorSession } from "./helpers.ts";
import type { Database } from "bun:sqlite";

let db: Database;
let repo: SqliteCartRepository;
let sessionId: string;
let variantId: number;

beforeEach(() => {
  db = createTestDb();
  repo = new SqliteCartRepository(db);
  sessionId = seedVisitorSession(db);
  const categoryId = seedCategory(db);
  const productId = seedProduct(db, categoryId);
  variantId = seedVariant(db, productId);
});

describe("CartRepository.getItems", () => {
  test("returns empty array when cart is empty", () => {
    expect(repo.getItems(sessionId)).toEqual([]);
  });

  test("returns cart items with product and variant info", () => {
    repo.addItem(sessionId, variantId, 2);
    const items = repo.getItems(sessionId);
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.variant_id).toBe(variantId);
    expect(item.quantity).toBe(2);
    expect(item.product_name).toBe("Test Product");
    expect(item.size).toBe("M");
    expect(item.color).toBe("Black");
  });
});

describe("CartRepository.getCount", () => {
  test("returns 0 for empty cart", () => {
    expect(repo.getCount(sessionId)).toBe(0);
  });

  test("sums all item quantities", () => {
    const categoryId = seedCategory(db, { slug: "cat-2" });
    const productId2 = seedProduct(db, categoryId, { slug: "product-2" });
    const variantId2 = seedVariant(db, productId2, { sku: "sku-2" });

    repo.addItem(sessionId, variantId, 3);
    repo.addItem(sessionId, variantId2, 2);
    expect(repo.getCount(sessionId)).toBe(5);
  });
});

describe("CartRepository.addItem and updateItem", () => {
  test("adds an item to the cart", () => {
    repo.addItem(sessionId, variantId, 1);
    expect(repo.getItems(sessionId)).toHaveLength(1);
  });

  test("updateItem changes the quantity", () => {
    repo.addItem(sessionId, variantId, 1);
    const item = repo.getItems(sessionId)[0]!;
    repo.updateItem(item.id, sessionId, 5);
    expect(repo.getItems(sessionId)[0]!.quantity).toBe(5);
  });

  test("updateItem is scoped to session", () => {
    repo.addItem(sessionId, variantId, 1);
    const item = repo.getItems(sessionId)[0]!;
    repo.updateItem(item.id, "other-session", 99);
    expect(repo.getItems(sessionId)[0]!.quantity).toBe(1); // not changed
  });
});

describe("CartRepository.removeItem", () => {
  test("removes an item from the cart", () => {
    repo.addItem(sessionId, variantId, 1);
    const item = repo.getItems(sessionId)[0]!;
    repo.removeItem(item.id, sessionId);
    expect(repo.getItems(sessionId)).toHaveLength(0);
  });

  test("does not remove item from another session", () => {
    repo.addItem(sessionId, variantId, 1);
    const item = repo.getItems(sessionId)[0]!;
    repo.removeItem(item.id, "other-session");
    expect(repo.getItems(sessionId)).toHaveLength(1);
  });
});

describe("CartRepository.clearCart", () => {
  test("removes all items for the session", () => {
    repo.addItem(sessionId, variantId, 1);
    repo.clearCart(sessionId);
    expect(repo.getItems(sessionId)).toHaveLength(0);
  });
});

describe("CartRepository.getExistingItem", () => {
  test("returns null when item not in cart", () => {
    expect(repo.getExistingItem(sessionId, variantId)).toBeNull();
  });

  test("returns the existing item with id and quantity", () => {
    repo.addItem(sessionId, variantId, 3);
    const item = repo.getExistingItem(sessionId, variantId);
    expect(item).not.toBeNull();
    expect(item!.quantity).toBe(3);
  });
});
