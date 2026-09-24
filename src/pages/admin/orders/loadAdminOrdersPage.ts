import type { OrderService } from "../../../services/OrderService.ts";

export function loadAdminOrdersPage(services: { orderService: OrderService }, status?: string) {
  return services.orderService.listOrders(status || undefined);
}

export function loadAdminOrderPage(services: { orderService: OrderService }, id: string) {
  return services.orderService.getOrderById(id);
}
