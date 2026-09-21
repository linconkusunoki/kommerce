import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { requireCustomerAuth } from "../middleware/customerAuth.ts";
import { ProductNotFound } from "../pages/product-page/ProductNotFound.tsx";
import { ProductPage } from "../pages/product-page/ProductPage.tsx";
import { loadProductPage } from "../pages/product-page/loadProductPage.ts";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

export function createProduct(services: Services) {
  const product = new Hono<AppEnv>();

  product.get("/products/:slug", (c) => {
    c.header("Cache-Control", "private, no-store");

    const requestedPage = Number.parseInt(c.req.query("page") ?? "1", 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const data = loadProductPage(services, {
      slug: c.req.param("slug"),
      visitorId: c.get("visitorId"),
      page,
      customerSessionId: getCookie(c, "customer_session_id"),
    });

    if (!data) {
      return c.html(<ProductNotFound cartCount={services.cartService.getCount(c.get("visitorId"))} />, 404);
    }

    if (page > data.reviewPage.totalPages) {
      return c.redirect(`/products/${data.product.slug}?page=${data.reviewPage.totalPages}`);
    }

    return c.html(<ProductPage data={data} added={c.req.query("added")} reviewError={c.req.query("review_error")} />);
  });

  product.post("/products/:slug/reviews", requireCustomerAuth, async (c) => {
    const product = services.productService.getBySlug(c.req.param("slug"));
    if (!product) return c.notFound();
    const customer = c.get("customer");
    const body = await c.req.parseBody();
    const result = services.reviewService.createCustomerReview({
      productId: product.id,
      customerId: customer.id,
      rating: Number.parseInt(String(body.rating ?? ""), 10),
      text: String(body.text ?? ""),
    });
    if (!result.ok) {
      const error =
        result.reason === "duplicate"
          ? "You+already+reviewed+this+product"
          : "Rating+must+be+1+to+5+and+text+must+be+under+2000+characters";
      return c.redirect(`/products/${product.slug}?review_error=${error}`);
    }
    return c.redirect(`/products/${product.slug}`);
  });

  product.post("/products/:slug/reviews/:reviewId/edit", requireCustomerAuth, async (c) => {
    const product = services.productService.getBySlug(c.req.param("slug"));
    if (!product) return c.notFound();
    const customer = c.get("customer");
    const body = await c.req.parseBody();
    const updated = services.reviewService.updateCustomerReview(
      Number.parseInt(c.req.param("reviewId"), 10),
      product.id,
      customer.id,
      Number.parseInt(String(body.rating ?? ""), 10),
      String(body.text ?? ""),
    );
    if (!updated.ok) return c.redirect(`/products/${product.slug}?review_error=Review+could+not+be+updated`);
    return c.redirect(`/products/${product.slug}`);
  });

  product.post("/products/:slug/reviews/:reviewId/delete", requireCustomerAuth, (c) => {
    const product = services.productService.getBySlug(c.req.param("slug"));
    if (!product) return c.notFound();
    services.reviewService.deleteCustomerReview(Number.parseInt(c.req.param("reviewId"), 10), c.get("customer").id);
    return c.redirect(`/products/${product.slug}`);
  });

  return product;
}
