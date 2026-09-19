import type { Services } from "../../../lib/container.ts";

export function loadAdminOrdersPage(services: Services, status?: string) {
  return services.orderService.listOrders(status || undefined);
}

export function loadAdminOrderPage(services: Services, id: string) {
  return services.orderService.getOrderById(id);
}
