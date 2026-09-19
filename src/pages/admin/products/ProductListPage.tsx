import { AdminLayout } from "../../../components/AdminLayout.tsx";
import type { ProductWithStock } from "../../../types/index.ts";

export function ProductListPage({ products }: { products: ProductWithStock[] }) {
  return (
    <AdminLayout title="Products">
      <div class="admin-toolbar">
        <a href="/admin/products/new" class="btn btn-primary">
          Add Product
        </a>
      </div>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Featured</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr>
              <td>{product.name}</td>
              <td>{product.category_name}</td>
              <td>${product.price.toFixed(2)}</td>
              <td style={product.total_stock === 0 ? "color: var(--color-danger, #dc2626); font-weight: 600;" : ""}>
                {product.total_stock}
              </td>
              <td>{product.featured ? "Yes" : "No"}</td>
              <td class="admin-actions">
                <a href={`/admin/products/${product.id}/edit`} class="btn btn-sm">
                  Edit
                </a>
                <form method="post" action={`/admin/products/${product.id}/delete`} style="display:inline">
                  <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Delete this product?')">
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
