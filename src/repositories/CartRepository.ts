import type { Database } from "bun:sqlite";
import type { CartItem } from "../types/index.ts";
import type { ICartRepository } from "./interfaces.ts";

export class SqliteCartRepository implements ICartRepository {
  constructor(private db: Database) {}

  getItems(sessionId: string): CartItem[] {
    return this.db
      .query(
        `SELECT ci.id, ci.variant_id, ci.quantity,
                pv.size, pv.color, pv.stock,
                p.name as product_name, p.slug as product_slug,
                p.price as product_price, p.image_url as product_image
         FROM cart_items ci
         JOIN product_variants pv ON ci.variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         WHERE ci.session_id = ?
         ORDER BY ci.added_at DESC`,
      )
      .all(sessionId) as CartItem[];
  }

  getCount(sessionId: string): number {
    const result = this.db
      .query("SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE session_id = ?")
      .get(sessionId) as { count: number };
    return result.count;
  }

  getExistingItem(sessionId: string, variantId: number): { id: number; quantity: number } | null {
    return this.db
      .query("SELECT id, quantity FROM cart_items WHERE session_id = ? AND variant_id = ?")
      .get(sessionId, variantId) as { id: number; quantity: number } | null;
  }

  addItem(sessionId: string, variantId: number, quantity: number): void {
    this.db
      .query("INSERT INTO cart_items (session_id, variant_id, quantity) VALUES (?, ?, ?)")
      .run(sessionId, variantId, quantity);
  }

  updateItem(itemId: number, sessionId: string, quantity: number): void {
    this.db
      .query("UPDATE cart_items SET quantity = ? WHERE id = ? AND session_id = ?")
      .run(quantity, itemId, sessionId);
  }

  removeItem(itemId: number, sessionId: string): void {
    this.db.query("DELETE FROM cart_items WHERE id = ? AND session_id = ?").run(itemId, sessionId);
  }

  clearCart(sessionId: string): void {
    this.db.query("DELETE FROM cart_items WHERE session_id = ?").run(sessionId);
  }
}
