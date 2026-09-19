import { AdminLayout } from "../../../components/AdminLayout.tsx";
import type { ProductWithStock } from "../../../types/index.ts";

export function AdminReviewFormPage({ products, error }: { products: ProductWithStock[]; error?: string }) {
  return (
    <AdminLayout title="New Admin Review">
      {error && <div class="alert alert-error">{error}</div>}
      <form method="post" action="/admin/reviews/new" class="admin-form">
        <div class="form-group">
          <label for="product_id">Product</label>
          <select id="product_id" name="product_id" required>
            <option value="">Select product...</option>
            {products.map((product) => (
              <option value={String(product.id)}>{product.name}</option>
            ))}
          </select>
        </div>
        <div class="form-group">
          <label for="rating">Rating</label>
          <select id="rating" name="rating" required>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option value={rating}>{rating} / 5</option>
            ))}
          </select>
        </div>
        <div class="form-group">
          <label for="text">
            Review text <span class="form-hint">(optional)</span>
          </label>
          <textarea id="text" name="text" maxlength={2000} rows={5}></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            Publish Review
          </button>
          <a href="/admin/reviews" class="btn btn-outline">
            Cancel
          </a>
        </div>
      </form>
    </AdminLayout>
  );
}
