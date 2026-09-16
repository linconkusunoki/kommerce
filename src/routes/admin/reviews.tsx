import { Hono } from "hono";
import { AdminLayout } from "../../components/AdminLayout.tsx";
import type { Services } from "../../lib/container.ts";
import type { AppEnv } from "../../types/context.ts";

function formatDate(value: string): string {
  return new Date(`${value}Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function createAdminReviews(services: Services) {
  const reviews = new Hono<AppEnv>();

  reviews.get("/", (c) => {
    const visibility = (c.req.query("visibility") || "all") as "all" | "visible" | "hidden";
    const productIdValue = c.req.query("product_id") || "";
    const productId = Number.parseInt(productIdValue, 10);
    const productFilter = Number.isInteger(productId) && productId > 0 ? productId : undefined;
    const allReviews = services.reviewService.getAdminReviews(
      ["all", "visible", "hidden"].includes(visibility) ? visibility : "all",
      productFilter,
    );
    const products = services.productService.getAll();

    return c.html(
      <AdminLayout title="Reviews">
        <div class="admin-toolbar review-toolbar">
          <a href="/admin/reviews/new" class="btn btn-primary">Add Admin Review</a>
        </div>
        <form method="get" class="review-filters">
          <label>
            Visibility
            <select name="visibility">
              <option value="all" selected={visibility === "all"}>All</option>
              <option value="visible" selected={visibility === "visible"}>Visible</option>
              <option value="hidden" selected={visibility === "hidden"}>Hidden</option>
            </select>
          </label>
          <label>
            Product
            <select name="product_id">
              <option value="">All products</option>
              {products.map((product) => <option value={product.id} selected={product.id === productFilter}>{product.name}</option>)}
            </select>
          </label>
          <button type="submit" class="btn btn-outline btn-sm">Filter</button>
        </form>

        {allReviews.length === 0 ? (
          <p class="admin-empty">No reviews found.</p>
        ) : (
          <table class="admin-table review-admin-table">
            <thead>
              <tr><th>Product</th><th>Author</th><th>Rating</th><th>Review</th><th>Visibility</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {allReviews.map((review) => (
                <tr>
                  <td><a href={`/products/${review.product_slug}`}>{review.product_name}</a></td>
                  <td><strong>{review.author_name}</strong><small>{review.is_admin ? "Admin" : "Customer"}</small></td>
                  <td>{review.rating} / 5</td>
                  <td class="review-admin-text">{review.text || "Rating only"}</td>
                  <td>{review.visible ? "Visible" : "Hidden"}</td>
                  <td>{formatDate(review.updated_at)}</td>
                  <td class="admin-actions">
                    {review.visible && (
                      <form method="post" action={`/admin/reviews/${review.id}/hide`}>
                        <button type="submit" class="btn btn-sm btn-outline">Hide</button>
                      </form>
                    )}
                    <form method="post" action={`/admin/reviews/${review.id}/delete`}>
                      <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Delete this review permanently?')">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminLayout>,
    );
  });

  reviews.get("/new", (c) => {
    const products = services.productService.getAll();
    const error = c.req.query("error");
    return c.html(
      <AdminLayout title="New Admin Review">
        {error && <div class="alert alert-error">{error}</div>}
        <form method="post" action="/admin/reviews/new" class="admin-form">
          <div class="form-group">
            <label for="product_id">Product</label>
            <select id="product_id" name="product_id" required>
              <option value="">Select product...</option>
              {products.map((product) => <option value={product.id}>{product.name}</option>)}
            </select>
          </div>
          <div class="form-group">
            <label for="rating">Rating</label>
            <select id="rating" name="rating" required>
              {[1, 2, 3, 4, 5].map((rating) => <option value={rating}>{rating} / 5</option>)}
            </select>
          </div>
          <div class="form-group">
            <label for="text">Review text <span class="form-hint">(optional)</span></label>
            <textarea id="text" name="text" maxlength="2000" rows={5}></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Publish Review</button>
            <a href="/admin/reviews" class="btn btn-outline">Cancel</a>
          </div>
        </form>
      </AdminLayout>,
    );
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
