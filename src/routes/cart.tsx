import { Hono } from "hono";
import { CartPage } from "../pages/cart/CartPage.tsx";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

export function createCart(services: Services) {
  const cart = new Hono<AppEnv>();

  cart.get("/cart", async (c) => {
    const visitorId = c.get("visitorId");
    return c.html(<CartPage {...await services.cartService.getCart(visitorId)} />);
  });

  cart.get("/api/cart/count", async (c) => {
    const visitorId = c.get("visitorId");
    const count = await services.cartService.getCount(visitorId);
    return c.json({ count });
  });

  cart.post("/cart/add", async (c) => {
    const visitorId = c.get("visitorId");
    const body = await c.req.parseBody();

    const productId = Number(body.product_id);
    const size = String(body.size);
    const color = String(body.color);
    const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));

    const success = await services.cartService.addToCart(visitorId, productId, size, color, quantity);
    if (!success) return c.redirect("/");

    const p = await services.productService.getById(String(productId));
    return c.redirect(`/products/${p?.slug}?added=1`);
  });

  cart.post("/cart/update", async (c) => {
    const visitorId = c.get("visitorId");
    const body = await c.req.parseBody();
    await services.cartService.updateQuantity(visitorId, Number(body.item_id), Number(body.quantity) || 1);
    return c.redirect("/cart");
  });

  cart.post("/cart/remove", async (c) => {
    const visitorId = c.get("visitorId");
    const body = await c.req.parseBody();
    await services.cartService.removeItem(visitorId, Number(body.item_id));
    return c.redirect("/cart");
  });

  return cart;
}
