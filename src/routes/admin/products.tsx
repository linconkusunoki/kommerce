import { Hono } from "hono";
import { AdminLayout } from "../../components/AdminLayout.tsx";
import type { Services } from "../../lib/container.ts";
import { slugify } from "../../lib/utils.ts";
import type { Variant } from "../../types/index.ts";
import type { AppEnv } from "../../types/context.ts";

function ProductForm({
  product,
  categories,
  variants,
  error,
}: {
  product?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    compare_at_price: number | null;
    category_id: number;
    image_url: string | null;
    featured: boolean;
  };
  categories: { id: number; name: string }[];
  variants?: Variant[];
  error?: string;
}) {
  const isEdit = !!product;
  return (
    <AdminLayout title={isEdit ? "Edit Product" : "New Product"}>
      {error && <div class="alert alert-error">{error}</div>}
      <form method="post" class="admin-form">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" value={product?.name ?? ""} required />
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows={4}>
            {product?.description ?? ""}
          </textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              step="0.01"
              min="0"
              value={product?.price?.toString() ?? ""}
              required
            />
          </div>
          <div class="form-group">
            <label for="compare_at_price">Compare at Price</label>
            <input
              type="number"
              id="compare_at_price"
              name="compare_at_price"
              step="0.01"
              min="0"
              value={product?.compare_at_price?.toString() ?? ""}
            />
          </div>
        </div>
        <div class="form-group">
          <label for="category_id">Category</label>
          <select id="category_id" name="category_id" required>
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option value={cat.id.toString()} selected={product?.category_id === cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div class="form-group">
          <label for="image_url">Image URL</label>
          <input type="text" id="image_url" name="image_url" value={product?.image_url ?? ""} />
        </div>
        <div class="form-group form-check">
          <label>
            <input type="checkbox" name="featured" value="1" checked={product?.featured} />
            Featured product
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            {isEdit ? "Update" : "Create"} Product
          </button>
          <a href="/admin/products" class="btn btn-outline">
            Cancel
          </a>
        </div>
      </form>

      {isEdit && product && (
        <div style="margin-top: 2rem;">
          <h2 style="margin-bottom: 1rem;">Variants</h2>
          {variants && variants.length > 0 ? (
            <table class="admin-table" style="margin-bottom: 1.5rem;">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Stock</th>
                  <th>SKU</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr>
                    <td>{v.size}</td>
                    <td>{v.color}</td>
                    <td>{v.stock}</td>
                    <td>{v.sku ?? "—"}</td>
                    <td>
                      <form
                        method="post"
                        action={`/admin/products/${product.id}/variants/${v.id}/delete`}
                        style="display:inline"
                      >
                        <button
                          type="submit"
                          class="btn btn-sm btn-danger"
                          onclick="return confirm('Delete this variant?')"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style="color: var(--color-text-muted); margin-bottom: 1rem;">No variants yet.</p>
          )}

          <h3 style="margin-bottom: 0.75rem;">Add Variant</h3>
          <form
            method="post"
            action={`/admin/products/${product.id}/variants/add`}
            class="admin-form"
            style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;"
          >
            <div class="form-group" style="flex: 1; min-width: 120px;">
              <label for="v_size">Size</label>
              <input type="text" id="v_size" name="size" placeholder="M" required />
            </div>
            <div class="form-group" style="flex: 1; min-width: 120px;">
              <label for="v_color">Color</label>
              <input type="text" id="v_color" name="color" placeholder="Black" required />
            </div>
            <div class="form-group" style="flex: 1; min-width: 100px;">
              <label for="v_stock">Stock</label>
              <input type="number" id="v_stock" name="stock" min="0" value="0" required />
            </div>
            <div class="form-group" style="flex: 2; min-width: 160px;">
              <label for="v_sku">SKU (optional)</label>
              <input type="text" id="v_sku" name="sku" placeholder="auto-generated" />
            </div>
            <div class="form-group">
              <button type="submit" class="btn btn-primary">
                Add Variant
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

export function createAdminProducts(services: Services) {
  const products = new Hono<AppEnv>();

products.get("/", (c) => {
  const allProducts = services.productService.getAll();
  return c.html(
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
          {allProducts.map((p) => (
            <tr>
              <td>{p.name}</td>
              <td>{p.category_name}</td>
              <td>${p.price.toFixed(2)}</td>
              <td style={p.total_stock === 0 ? "color: var(--color-danger, #dc2626); font-weight: 600;" : ""}>
                {p.total_stock}
              </td>
              <td>{p.featured ? "Yes" : "No"}</td>
              <td class="admin-actions">
                <a href={`/admin/products/${p.id}/edit`} class="btn btn-sm">
                  Edit
                </a>
                <form method="post" action={`/admin/products/${p.id}/delete`} style="display:inline">
                  <button
                    type="submit"
                    class="btn btn-sm btn-danger"
                    onclick="return confirm('Delete this product?')"
                  >
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>,
  );
});

products.get("/new", (c) => {
  const categories = services.categoryService.getAll();
  return c.html(<ProductForm categories={categories} />);
});

products.post("/new", async (c) => {
  const body = await c.req.parseBody();
  const categories = services.categoryService.getAll();
  const name = (body["name"] as string).trim();

  try {
    const id = services.productService.create({
      name,
      slug: slugify(name),
      description: (body["description"] as string) ?? "",
      price: parseFloat(body["price"] as string),
      compare_at_price: body["compare_at_price"] ? parseFloat(body["compare_at_price"] as string) : null,
      category_id: parseInt(body["category_id"] as string),
      image_url: (body["image_url"] as string) || null,
      featured: !!body["featured"],
    });
    return c.redirect(`/admin/products/${id}/edit`);
  } catch (e: any) {
    return c.html(<ProductForm categories={categories} error={e.message} />);
  }
});

products.get("/:id/edit", (c) => {
  const id = c.req.param("id");
  const product = services.productService.getById(id);
  if (!product) return c.notFound();
  const categories = services.categoryService.getAll();
  const variants = services.productService.getVariants(id);
  return c.html(<ProductForm product={product} categories={categories} variants={variants} />);
});

products.post("/:id/edit", async (c) => {
  const body = await c.req.parseBody();
  const id = c.req.param("id");
  const categories = services.categoryService.getAll();
  const name = (body["name"] as string).trim();

  try {
    services.productService.update(id, {
      name,
      slug: slugify(name),
      description: (body["description"] as string) ?? "",
      price: parseFloat(body["price"] as string),
      compare_at_price: body["compare_at_price"] ? parseFloat(body["compare_at_price"] as string) : null,
      category_id: parseInt(body["category_id"] as string),
      image_url: (body["image_url"] as string) || null,
      featured: !!body["featured"],
    });
    return c.redirect("/admin/products");
  } catch (e: any) {
    const product = services.productService.getById(id);
    const variants = services.productService.getVariants(id);
    return c.html(<ProductForm product={product ?? undefined} categories={categories} variants={variants} error={e.message} />);
  }
});

products.post("/:id/variants/add", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody();

  const product = services.productService.getById(id);
  if (!product) return c.notFound();

  const size = (body["size"] as string).trim();
  const color = (body["color"] as string).trim();
  const stock = parseInt(body["stock"] as string) || 0;
  const sku = (body["sku"] as string)?.trim() || `${product.slug}-${slugify(size)}-${slugify(color)}`;

  services.productService.addVariant(id, { size, color, stock, sku });
  return c.redirect(`/admin/products/${id}/edit`);
});

products.post("/:id/variants/:variantId/delete", (c) => {
  const id = c.req.param("id");
  const variantId = c.req.param("variantId");
  services.productService.deleteVariant(variantId, id);
  return c.redirect(`/admin/products/${id}/edit`);
});

products.post("/:id/delete", (c) => {
  services.productService.delete(c.req.param("id"));
  return c.redirect("/admin/products");
  });

  return products;
}
