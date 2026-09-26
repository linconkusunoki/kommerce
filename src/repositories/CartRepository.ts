import type { SQL } from "bun";
import type { CartItem } from "../types/index.ts";
import type { ICartRepository } from "./interfaces.ts";

export class PostgresCartRepository implements ICartRepository {
  constructor(private db: SQL) {}

  async getItems(sessionId: string) {
    return (
      await this.db`SELECT ci.id, ci.variant_id, ci.quantity, pv.size, pv.color, pv.stock,
      p.name AS product_name, p.slug AS product_slug, p.price AS product_price, p.image_url AS product_image
      FROM cart_items ci JOIN product_variants pv ON ci.variant_id = pv.id JOIN products p ON pv.product_id = p.id
      WHERE ci.session_id = ${sessionId} ORDER BY ci.added_at DESC`
    ).map((item: CartItem & { product_price: number | string }) => ({
      ...item,
      product_price: Number(item.product_price),
    })) as CartItem[];
  }

  async getCount(sessionId: string) {
    const [row] = await this
      .db`SELECT COALESCE(SUM(quantity), 0)::int AS count FROM cart_items WHERE session_id = ${sessionId}`;
    return Number(row.count);
  }

  async getExistingItem(sessionId: string, variantId: number) {
    return (
      ((
        await this.db`SELECT id, quantity FROM cart_items WHERE session_id = ${sessionId} AND variant_id = ${variantId}`
      )[0] as {
        id: number;
        quantity: number;
      }) ?? null
    );
  }

  async addItem(sessionId: string, variantId: number, quantity: number) {
    await this
      .db`INSERT INTO cart_items (session_id, variant_id, quantity) VALUES (${sessionId}, ${variantId}, ${quantity})`;
  }
  async updateItem(itemId: number, sessionId: string, quantity: number) {
    await this.db`UPDATE cart_items SET quantity = ${quantity} WHERE id = ${itemId} AND session_id = ${sessionId}`;
  }
  async removeItem(itemId: number, sessionId: string) {
    await this.db`DELETE FROM cart_items WHERE id = ${itemId} AND session_id = ${sessionId}`;
  }
  async clearCart(sessionId: string) {
    await this.db`DELETE FROM cart_items WHERE session_id = ${sessionId}`;
  }
}
