import { Hono } from "hono";
import { CheckoutPage, OrderConfirmationPage, OrderNotFoundPage } from "../pages/checkout/CheckoutPage.tsx";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";
import { getAuthenticatedCustomer } from "../middleware/customerAuth.ts";

export function createCheckout(services: Services) {
  const checkout = new Hono<AppEnv>();

  checkout.get("/checkout", (c) => {
    const customer = getAuthenticatedCustomer(c, services.customerAuthService);
    const cart = services.cartService.getCart(c.get("visitorId"));
    if (cart.items.length === 0) return c.redirect("/cart");
    return c.html(<CheckoutPage {...cart} customer={customer} error={c.req.query("error")} />);
  });

  checkout.post("/checkout", async (c) => {
    const customer = getAuthenticatedCustomer(c, services.customerAuthService);
    const body = await c.req.parseBody();
    const email = customer?.email ?? (body.email as string)?.trim();
    const name = (body.name as string)?.trim();
    const address = (body.address as string)?.trim();
    const city = (body.city as string)?.trim();
    const postalCode = (body.postal_code as string)?.trim();
    if (!email || !name || !address || !city || !postalCode)
      return c.redirect("/checkout?error=Please fill in all required fields");
    const orderNumber = services.orderService.placeOrder(
      c.get("visitorId"),
      {
        email,
        name,
        address,
        city,
        postal_code: postalCode,
        country: (body.country as string)?.trim() || "",
        phone: (body.phone as string)?.trim() || "",
        notes: (body.notes as string)?.trim() || "",
      },
      customer?.id,
    );
    if (!orderNumber) return c.redirect("/cart");
    return c.redirect(`/order/${orderNumber}`);
  });

  checkout.get("/order/:orderNumber", (c) => {
    const count = services.cartService.getCount(c.get("visitorId"));
    const result = services.orderService.getOrderByNumber(c.req.param("orderNumber"));
    if (!result) return c.html(<OrderNotFoundPage count={count} />, 404);
    return c.html(<OrderConfirmationPage {...result} count={count} />);
  });

  return checkout;
}
