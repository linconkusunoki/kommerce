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
  placeOrder(sessionId: string, input: PlaceOrderInput, customerId?: number): string | null {
    const items = this.cartRepo.getItems(sessionId);
    if (items.length === 0) return null;

    const orderNumber = generateOrderNumber();
    this.orderRepo.create(input, items, orderNumber, sessionId, customerId);

    // Send confirmation email (non-blocking)
    const orderItems = this.orderRepo.getItemsByOrderNumber(orderNumber);
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

  getOrderByNumber(orderNumber: string): { order: Order; items: OrderItem[] } | null {
    return this.getOrder(() => this.orderRepo.findByNumber(orderNumber));
  }

  getOrderByNumberForVisitor(
    orderNumber: string,
    visitorId: string,
    customerId?: number,
  ): { order: Order; items: OrderItem[] } | null {
    const result = this.getOrder(() => this.orderRepo.findByNumber(orderNumber));
    if (!result) return null;
    if (result.order.customer_id !== null) {
      return customerId === result.order.customer_id ? result : null;
    }
    if (result.order.visitor_session_id === visitorId) return result;
    return null;
  }

  getOrderById(id: number | string): { order: Order; items: OrderItem[] } | null {
    return this.getOrder(() => this.orderRepo.findById(id));
  }

  private getOrder(find: () => Order | null): { order: Order; items: OrderItem[] } | null {
    const order = find();
    if (!order) return null;
    const items = this.orderRepo.getItems(order.id);
    return { order, items };
  }

  listOrders(statusFilter?: string): { orders: OrderSummary[]; statusCounts: StatusCount[] } {
    return {
      orders: this.orderRepo.findAll(statusFilter),
      statusCounts: this.orderRepo.getStatusCounts(),
    };
  }

  getCustomerOrders(customerId: number, email: string): OrderSummary[] {
    return this.orderRepo.findByCustomer(customerId, email);
  }

  updateStatus(id: number | string, status: OrderStatus): void {
    this.orderRepo.updateStatus(id, status);
  }
}
