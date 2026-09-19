import { AdminLayout } from "../../../components/AdminLayout.tsx";
import type { CategoryWithCount } from "../../../types/index.ts";

export function CategoryListPage({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <AdminLayout title="Categories">
      <div class="admin-toolbar">
        <a href="/admin/categories/new" class="btn btn-primary">
          Add Category
        </a>
      </div>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr>
              <td>{category.sort_order}</td>
              <td>{category.name}</td>
              <td>{category.slug}</td>
              <td>{category.product_count}</td>
              <td class="admin-actions">
                <a href={`/admin/categories/${category.id}/edit`} class="btn btn-sm">
                  Edit
                </a>
                <form method="post" action={`/admin/categories/${category.id}/delete`} style="display:inline">
                  <button
                    type="submit"
                    class="btn btn-sm btn-danger"
                    onclick="return confirm('Delete this category? Products in this category will also be deleted.')"
                  >
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
