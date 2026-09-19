import { Hono } from "hono";
import { AdminReviewFormPage } from "../../pages/admin/reviews/AdminReviewFormPage.tsx";
import { AdminReviewListPage } from "../../pages/admin/reviews/AdminReviewListPage.tsx";
import { loadAdminReviewForm, loadAdminReviewsPage } from "../../pages/admin/reviews/loadAdminReviewsPage.ts";
import type { Services } from "../../lib/container.ts";
import type { AppEnv } from "../../types/context.ts";

export function createAdminReviews(services: Services) {
  const reviews = new Hono<AppEnv>();

  reviews.get("/", (c) => {
    const requestedVisibility = c.req.query("visibility") || "all";
    const visibility = ["all", "visible", "hidden"].includes(requestedVisibility)
      ? (requestedVisibility as "all" | "visible" | "hidden")
      : "all";
    const productIdValue = c.req.query("product_id") || "";
    const productId = Number.parseInt(productIdValue, 10);
    const productFilter = Number.isInteger(productId) && productId > 0 ? productId : undefined;
    const page = loadAdminReviewsPage(services, { visibility, productId: productFilter });

    return c.html(<AdminReviewListPage {...page} visibility={visibility} productFilter={productFilter} />);
  });

  reviews.get("/new", (c) => {
    const { products } = loadAdminReviewForm(services);
    return c.html(<AdminReviewFormPage products={products} error={c.req.query("error")} />);
  });

  reviews.post("/new", async (c) => {
    const body = await c.req.parseBody();
    const productId = Number.parseInt(String(body.product_id ?? ""), 10);
    if (!Number.isInteger(productId) || !services.productService.getById(productId)) {
      return c.redirect("/admin/reviews/new?error=Select+a+valid+product+and+rating");
    }
    const reviewId = services.reviewService.createAdminReview({
      productId,
      adminUserId: c.get("adminUser").id,
      rating: Number.parseInt(String(body.rating ?? ""), 10),
      text: String(body.text ?? ""),
    });
    if (!reviewId) return c.redirect("/admin/reviews/new?error=Select+a+valid+product+and+rating");
    return c.redirect("/admin/reviews");
  });

  reviews.post("/:id/hide", (c) => {
    services.reviewService.setVisibility(Number.parseInt(c.req.param("id"), 10), false);
    return c.redirect("/admin/reviews");
  });

  reviews.post("/:id/delete", (c) => {
    services.reviewService.deleteReview(Number.parseInt(c.req.param("id"), 10));
    return c.redirect("/admin/reviews");
  });

  return reviews;
}
