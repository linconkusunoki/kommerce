import { Hono } from "hono";
import { AdminOrderDetailPage } from "../../pages/admin/orders/AdminOrderDetailPage.tsx";
import { AdminOrderListPage } from "../../pages/admin/orders/AdminOrderListPage.tsx";
import { loadAdminOrderPage, loadAdminOrdersPage } from "../../pages/admin/orders/loadAdminOrdersPage.ts";
import type { Services } from "../../lib/container.ts";
import { ORDER_STATUSES, type OrderStatus } from "../../types/index.ts";
import type { AppEnv } from "../../types/context.ts";

export function createAdminOrders(services: Services) {
  const orders = new Hono<AppEnv>();

  orders.get("/", async (c) => {
    const statusFilter = c.req.query("status") || "";
    const page = await loadAdminOrdersPage({ orderService: services.orderService }, statusFilter);
    return c.html(<AdminOrderListPage {...page} statusFilter={statusFilter} />);
  });

  orders.get("/:id", async (c) => {
    const page = await loadAdminOrderPage({ orderService: services.orderService }, c.req.param("id"));
    if (!page) return c.notFound();
    return c.html(<AdminOrderDetailPage {...page} />);
  });

  orders.post("/:id/status", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.parseBody();
    const status = body.status as string;

    if (ORDER_STATUSES.includes(status as OrderStatus)) {
      await services.orderService.updateStatus(id, status as OrderStatus);
    }

    return c.redirect(`/admin/orders/${id}`);
  });

  return orders;
}
