import type { ICartRepository, IOrderRepository } from "../repositories/interfaces.ts";
import type { Order, OrderItem, OrderStatus, OrderSummary, PlaceOrderInput, StatusCount } from "../types/index.ts";
import { generateOrderNumber } from "../lib/utils.ts";
import { sendOrderConfirmation } from "../lib/email.ts";

export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private cartRepo: ICartRepository,
  ) {}

  // Returns the order number on success, null if cart is empty
  async placeOrder(sessionId: string, input: PlaceOrderInput, customerId?: number): Promise<string | null> {
    const items = await this.cartRepo.getItems(sessionId);
    if (items.length === 0) return null;

    const orderNumber = generateOrderNumber();
    await this.orderRepo.create(input, items, orderNumber, sessionId, customerId);

    // Send confirmation email (non-blocking)
    const orderItems = await this.orderRepo.getItemsByOrderNumber(orderNumber);
    const total = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
    sendOrderConfirmation(
      {
        order_number: orderNumber,
        email: input.email,
        name: input.name,
        address: input.address,
        city: input.city,
        postal_code: input.postal_code,
        country: input.country,
        total,
      },
      orderItems,
    );

    return orderNumber;
  }

  getOrderByNumber(orderNumber: string) {
    return this.getOrder(() => this.orderRepo.findByNumber(orderNumber));
  }

  getOrderByNumberForVisitor(orderNumber: string, visitorId: string, customerId?: number) {
    return this.getOrderByNumber(orderNumber).then((result) => {
      if (!result) return null;
      if (result.order.customer_id !== null) {
        return customerId === result.order.customer_id ? result : null;
      }
      if (result.order.visitor_session_id === visitorId) return result;
      return null;
    });
  }

  getOrderById(id: number | string) {
    return this.getOrder(() => this.orderRepo.findById(id));
  }

  private async getOrder(find: () => Promise<Order | null>): Promise<{ order: Order; items: OrderItem[] } | null> {
    const order = await find();
    if (!order) return null;
    const items = await this.orderRepo.getItems(order.id);
    return { order, items };
  }

  async listOrders(statusFilter?: string): Promise<{ orders: OrderSummary[]; statusCounts: StatusCount[] }> {
    return {
      orders: await this.orderRepo.findAll(statusFilter),
      statusCounts: await this.orderRepo.getStatusCounts(),
    };
  }

  getCustomerOrders(customerId: number, email: string) {
    return this.orderRepo.findByCustomer(customerId, email);
  }

  async updateStatus(id: number | string, status: OrderStatus): Promise<void> {
    await this.orderRepo.updateStatus(id, status);
  }
}
