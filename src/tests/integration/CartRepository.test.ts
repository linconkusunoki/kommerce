import { describe, test, expect, beforeEach } from "bun:test";
import { PostgresCartRepository } from "../../repositories/CartRepository.ts";
import {
  createTestDb,
  postgresAvailable,
  seedCategory,
  seedProduct,
  seedVariant,
  seedVisitorSession,
} from "./helpers.ts";
import type { SQL } from "bun";

const integrationDescribe = postgresAvailable ? describe : describe.skip;
let db: SQL;
let repo: PostgresCartRepository;
let sessionId: string;
let variantId: number;

beforeEach(async () => {
  db = await createTestDb();
  repo = new PostgresCartRepository(db);
  sessionId = await seedVisitorSession(db);
  const categoryId = await seedCategory(db);
  const productId = await seedProduct(db, categoryId);
  variantId = await seedVariant(db, productId);
});

integrationDescribe("CartRepository.getItems", () => {
  test("returns empty array when cart is empty", async () => {
    expect(await repo.getItems(sessionId)).toEqual([]);
  });

  test("returns cart items with product and variant info", async () => {
    await repo.addItem(sessionId, variantId, 2);
    const items = await repo.getItems(sessionId);
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.variant_id).toBe(variantId);
    expect(item.quantity).toBe(2);
    expect(item.product_name).toBe("Test Product");
    expect(item.size).toBe("M");
    expect(item.color).toBe("Black");
  });
});

integrationDescribe("CartRepository.getCount", () => {
  test("returns 0 for empty cart", async () => {
    expect(await repo.getCount(sessionId)).toBe(0);
  });

  test("sums all item quantities", async () => {
    const categoryId = await seedCategory(db, { slug: "cat-2" });
    const productId2 = await seedProduct(db, categoryId, { slug: "product-2" });
    const variantId2 = await seedVariant(db, productId2, { sku: "sku-2" });

    await repo.addItem(sessionId, variantId, 3);
    await repo.addItem(sessionId, variantId2, 2);
    expect(await repo.getCount(sessionId)).toBe(5);
  });
});

integrationDescribe("CartRepository.addItem and updateItem", () => {
  test("adds an item to the cart", async () => {
    await repo.addItem(sessionId, variantId, 1);
    expect(await repo.getItems(sessionId)).toHaveLength(1);
  });

  test("updateItem changes the quantity", async () => {
    await repo.addItem(sessionId, variantId, 1);
    const item = (await repo.getItems(sessionId))[0]!;
    await repo.updateItem(item.id, sessionId, 5);
    expect((await repo.getItems(sessionId))[0]!.quantity).toBe(5);
  });

  test("updateItem is scoped to session", async () => {
    await repo.addItem(sessionId, variantId, 1);
    const item = (await repo.getItems(sessionId))[0]!;
    await repo.updateItem(item.id, "other-session", 99);
    expect((await repo.getItems(sessionId))[0]!.quantity).toBe(1);
  });
});

integrationDescribe("CartRepository.removeItem", () => {
  test("removes an item from the cart", async () => {
    await repo.addItem(sessionId, variantId, 1);
    const item = (await repo.getItems(sessionId))[0]!;
    await repo.removeItem(item.id, sessionId);
    expect(await repo.getItems(sessionId)).toHaveLength(0);
  });

  test("does not remove item from another session", async () => {
    await repo.addItem(sessionId, variantId, 1);
    const item = (await repo.getItems(sessionId))[0]!;
    await repo.removeItem(item.id, "other-session");
    expect(await repo.getItems(sessionId)).toHaveLength(1);
  });
});

integrationDescribe("CartRepository.clearCart", () => {
  test("removes all items for the session", async () => {
    await repo.addItem(sessionId, variantId, 1);
    await repo.clearCart(sessionId);
    expect(await repo.getItems(sessionId)).toHaveLength(0);
  });
});

integrationDescribe("CartRepository.getExistingItem", () => {
  test("returns null when item not in cart", async () => {
    expect(await repo.getExistingItem(sessionId, variantId)).toBeNull();
  });

  test("returns the existing item with id and quantity", async () => {
    await repo.addItem(sessionId, variantId, 3);
    const item = await repo.getExistingItem(sessionId, variantId);
    expect(item).not.toBeNull();
    expect(item!.quantity).toBe(3);
  });
});
