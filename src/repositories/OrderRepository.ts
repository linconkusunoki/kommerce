import type { Database } from "bun:sqlite";
import type {
  CartItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderSummary,
  PlaceOrderInput,
  StatusCount,
} from "../types/index.ts";
import type { IOrderRepository } from "./interfaces.ts";

export class SqliteOrderRepository implements IOrderRepository {
  constructor(private db: Database) {}

  create(input: PlaceOrderInput, items: CartItem[], orderNumber: string, sessionId: string, customerId?: number): void {
    const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);

    const insertItem = this.db.prepare(
      `INSERT INTO order_items (order_id, product_name, product_slug, variant_size, variant_color, price, quantity, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const decrementStock = this.db.prepare("UPDATE product_variants SET stock = stock - ? WHERE id = ?");

    const run = this.db.transaction(() => {
      const result = this.db
        .query(
          `INSERT INTO orders (order_number, customer_id, visitor_session_id, email, name, address, city, postal_code, country, phone, notes, subtotal, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          orderNumber,
          customerId ?? null,
          sessionId,
          input.email,
          input.name,
          input.address,
          input.city,
          input.postal_code,
          input.country,
          input.phone,
          input.notes,
          subtotal,
          subtotal,
        );

      const orderId = Number(result.lastInsertRowid);

      for (const item of items) {
        insertItem.run(
          orderId,
          item.product_name,
          item.product_slug,
          item.size,
          item.color,
          item.product_price,
          item.quantity,
          item.product_price * item.quantity,
        );
        decrementStock.run(item.quantity, item.variant_id);
      }

      this.db.query("DELETE FROM cart_items WHERE session_id = ?").run(sessionId);
    });

    run();
  }

  findByNumber(orderNumber: string): Order | null {
    return this.db.query("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) as Order | null;
  }

  findById(id: number | string): Order | null {
    return this.db.query("SELECT * FROM orders WHERE id = ?").get(id) as Order | null;
  }

  findAll(statusFilter?: string): OrderSummary[] {
    let query = `
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params: string[] = [];

    if (statusFilter) {
      query += " WHERE o.status = ?";
      params.push(statusFilter);
    }

    query += " GROUP BY o.id ORDER BY o.created_at DESC";
    return this.db.query(query).all(...params) as OrderSummary[];
  }

  findByCustomer(customerId: number, email: string): OrderSummary[] {
    return this.db
      .query(
        `SELECT o.*, COUNT(oi.id) AS item_count
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.customer_id = ? OR (o.customer_id IS NULL AND LOWER(o.email) = LOWER(?))
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
      )
      .all(customerId, email) as OrderSummary[];
  }

  getStatusCounts(): StatusCount[] {
    return this.db.query("SELECT status, COUNT(*) as count FROM orders GROUP BY status").all() as StatusCount[];
  }

  updateStatus(id: number | string, status: OrderStatus): void {
    this.db.query("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  }

  getItems(orderId: number): OrderItem[] {
    return this.db.query("SELECT * FROM order_items WHERE order_id = ?").all(orderId) as OrderItem[];
  }

  getItemsByOrderNumber(orderNumber: string): OrderItem[] {
    return this.db
      .query("SELECT oi.* FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.order_number = ?")
      .all(orderNumber) as OrderItem[];
  }
}
