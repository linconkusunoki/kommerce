import { AdminLayout } from "../../../components/AdminLayout.tsx";
import type { Category } from "../../../types/index.ts";

export function CategoryForm({ category, error }: { category?: Category; error?: string }) {
  const isEdit = !!category;

  return (
    <AdminLayout title={isEdit ? "Edit Category" : "New Category"}>
      {error && <div class="alert alert-error">{error}</div>}
      <form method="post" class="admin-form">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" value={category?.name ?? ""} required />
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows={3}>
            {category?.description ?? ""}
          </textarea>
        </div>
        <div class="form-group">
          <label for="image_url">Image URL</label>
          <input type="text" id="image_url" name="image_url" value={category?.image_url ?? ""} />
        </div>
        <div class="form-group">
          <label for="sort_order">Sort Order</label>
          <input type="number" id="sort_order" name="sort_order" value={category?.sort_order?.toString() ?? "0"} />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            {isEdit ? "Update" : "Create"} Category
          </button>
          <a href="/admin/categories" class="btn btn-outline">
            Cancel
          </a>
        </div>
      </form>
    </AdminLayout>
  );
}
