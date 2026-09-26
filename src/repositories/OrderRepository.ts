import type { SQL } from "bun";
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

const mapOrder = (row: Order) => ({ ...row, subtotal: Number(row.subtotal), total: Number(row.total) });
const mapSummary = (row: OrderSummary) => ({ ...row, total: Number(row.total) });
const mapItem = (row: OrderItem) => ({ ...row, price: Number(row.price), total: Number(row.total) });

export class PostgresOrderRepository implements IOrderRepository {
  constructor(private db: SQL) {}

  async create(input: PlaceOrderInput, items: CartItem[], orderNumber: string, sessionId: string, customerId?: number) {
    const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
    await this.db.begin(async (tx) => {
      const [order] =
        await tx`INSERT INTO orders (order_number, customer_id, visitor_session_id, email, name, address, city, postal_code, country, phone, notes, subtotal, total)
        VALUES (${orderNumber}, ${customerId ?? null}, ${sessionId}, ${input.email}, ${input.name}, ${input.address}, ${input.city}, ${input.postal_code}, ${input.country}, ${input.phone}, ${input.notes}, ${subtotal}, ${subtotal}) RETURNING id`;
      for (const item of items) {
        await tx`INSERT INTO order_items (order_id, product_name, product_slug, variant_size, variant_color, price, quantity, total)
          VALUES (${order.id}, ${item.product_name}, ${item.product_slug}, ${item.size}, ${item.color}, ${item.product_price}, ${item.quantity}, ${item.product_price * item.quantity})`;
        const [updated] = await tx`UPDATE product_variants
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.variant_id} AND stock >= ${item.quantity}
          RETURNING id`;
        if (!updated) throw new Error("Insufficient stock");
      }
      await tx`DELETE FROM cart_items WHERE session_id = ${sessionId}`;
    });
  }
  async findByNumber(orderNumber: string) {
    const row = (await this.db`SELECT * FROM orders WHERE order_number = ${orderNumber}`)[0] as Order | undefined;
    return row ? mapOrder(row) : null;
  }
  async findById(id: number | string) {
    const row = (await this.db`SELECT * FROM orders WHERE id = ${id}`)[0] as Order | undefined;
    return row ? mapOrder(row) : null;
  }
  async findAll(statusFilter?: string) {
    const rows = statusFilter
      ? await this
          .db`SELECT o.*, COUNT(oi.id)::int AS item_count FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.status = ${statusFilter} GROUP BY o.id ORDER BY o.created_at DESC`
      : await this
          .db`SELECT o.*, COUNT(oi.id)::int AS item_count FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id GROUP BY o.id ORDER BY o.created_at DESC`;
    return rows.map(mapSummary) as OrderSummary[];
  }
  async findByCustomer(customerId: number, email: string) {
    return (
      await this
        .db`SELECT o.*, COUNT(oi.id)::int AS item_count FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.customer_id = ${customerId} OR (o.customer_id IS NULL AND LOWER(o.email) = LOWER(${email})) GROUP BY o.id ORDER BY o.created_at DESC`
    ).map(mapSummary) as OrderSummary[];
  }
  async getStatusCounts() {
    return (await this.db`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`) as StatusCount[];
  }
  async updateStatus(id: number | string, status: OrderStatus) {
    await this
      .db`UPDATE orders SET status = ${status}, updated_at = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') WHERE id = ${id}`;
  }
  async getItems(orderId: number) {
    return (await this.db`SELECT * FROM order_items WHERE order_id = ${orderId}`).map(mapItem) as OrderItem[];
  }
  async getItemsByOrderNumber(orderNumber: string) {
    return (
      await this
        .db`SELECT oi.* FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.order_number = ${orderNumber}`
    ).map(mapItem) as OrderItem[];
  }
}
