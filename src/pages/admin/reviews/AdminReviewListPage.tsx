import { AdminLayout } from "../../../components/AdminLayout.tsx";
import type { AdminReview, ProductWithStock } from "../../../types/index.ts";

function formatDate(value: string): string {
  return new Date(`${value}Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Props = {
  reviews: AdminReview[];
  products: ProductWithStock[];
  visibility: "all" | "visible" | "hidden";
  productFilter?: number;
};

export function AdminReviewListPage({ reviews, products, visibility, productFilter }: Props) {
  return (
    <AdminLayout title="Reviews">
      <div class="admin-toolbar review-toolbar">
        <a href="/admin/reviews/new" class="btn btn-primary">
          Add Admin Review
        </a>
      </div>
      <form method="get" class="review-filters">
        <label>
          Visibility
          <select name="visibility">
            <option value="all" selected={visibility === "all"}>
              All
            </option>
            <option value="visible" selected={visibility === "visible"}>
              Visible
            </option>
            <option value="hidden" selected={visibility === "hidden"}>
              Hidden
            </option>
          </select>
        </label>
        <label>
          Product
          <select name="product_id">
            <option value="">All products</option>
            {products.map((product) => (
              <option value={String(product.id)} selected={product.id === productFilter}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" class="btn btn-outline btn-sm">
          Filter
        </button>
      </form>

      {reviews.length === 0 ? (
        <p class="admin-empty">No reviews found.</p>
      ) : (
        <table class="admin-table review-admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Author</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Visibility</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr>
                <td>
                  <a href={`/products/${review.product_slug}`}>{review.product_name}</a>
                </td>
                <td>
                  <strong>{review.author_name}</strong>
                  <small>{review.is_admin ? "Admin" : "Customer"}</small>
                </td>
                <td>{review.rating} / 5</td>
                <td class="review-admin-text">{review.text || "Rating only"}</td>
                <td>{review.visible ? "Visible" : "Hidden"}</td>
                <td>{formatDate(review.updated_at)}</td>
                <td class="admin-actions">
                  {review.visible ? (
                    <form method="post" action={`/admin/reviews/${review.id}/hide`}>
                      <button type="submit" class="btn btn-sm btn-outline">
                        Hide
                      </button>
                    </form>
                  ) : (
                    <form method="post" action={`/admin/reviews/${review.id}/show`}>
                      <button type="submit" class="btn btn-sm btn-outline">
                        Show
                      </button>
                    </form>
                  )}
                  <form method="post" action={`/admin/reviews/${review.id}/delete`}>
                    <button
                      type="submit"
                      class="btn btn-sm btn-danger"
                      onclick="return confirm('Delete this review permanently?')"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  );
}
