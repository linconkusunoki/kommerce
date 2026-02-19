import { Hono } from "hono";
import { getDb } from "../../db/schema.ts";
import { AdminLayout } from "../../components/AdminLayout.tsx";

const products = new Hono();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

products.get("/", (c) => {
  const db = getDb();
  const allProducts = db
    .query(
      `
    SELECT p.*, c.name as category_name,
           COALESCE(SUM(pv.stock), 0) as total_stock,
           COUNT(pv.id) as variant_count
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `,
    )
    .all() as {
    id: number;
    name: string;
    slug: string;
    price: number;
    featured: number;
    category_name: string;
    total_stock: number;
    variant_count: number;
  }[];

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
                  <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Delete this product?')">
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

type Variant = {
  id: number;
  size: string;
  color: string;
  stock: number;
  sku: string | null;
};

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
    featured: number;
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
            <input type="checkbox" name="featured" value="1" checked={!!product?.featured} />
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
                      <form method="post" action={`/admin/products/${product.id}/variants/${v.id}/delete`} style="display:inline">
                        <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Delete this variant?')">
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
          <form method="post" action={`/admin/products/${product.id}/variants/add`} class="admin-form" style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
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
              <button type="submit" class="btn btn-primary">Add Variant</button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

products.get("/new", (c) => {
  const categories = getDb().query("SELECT id, name FROM categories ORDER BY sort_order").all() as {
    id: number;
    name: string;
  }[];
  return c.html(<ProductForm categories={categories} />);
});

products.post("/new", async (c) => {
  const body = await c.req.parseBody();
  const db = getDb();
  const categories = db.query("SELECT id, name FROM categories ORDER BY sort_order").all() as {
    id: number;
    name: string;
  }[];

  const name = (body["name"] as string).trim();
  const slug = slugify(name);

  let newId: number;
  try {
    const result = db.prepare(
      `
      INSERT INTO products (name, slug, description, price, compare_at_price, category_id, image_url, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      name,
      slug,
      (body["description"] as string) ?? "",
      parseFloat(body["price"] as string),
      body["compare_at_price"] ? parseFloat(body["compare_at_price"] as string) : null,
      parseInt(body["category_id"] as string),
      (body["image_url"] as string) || null,
      body["featured"] ? 1 : 0,
    );
    newId = Number(result.lastInsertRowid);
  } catch (e: any) {
    return c.html(<ProductForm categories={categories} error={e.message} />);
  }

  return c.redirect(`/admin/products/${newId}/edit`);
});

products.get("/:id/edit", (c) => {
  const db = getDb();
  const id = c.req.param("id");
  const product = db.query("SELECT * FROM products WHERE id = ?").get(id) as any;
  if (!product) return c.notFound();
  const categories = db.query("SELECT id, name FROM categories ORDER BY sort_order").all() as {
    id: number;
    name: string;
  }[];
  const variants = db.query("SELECT * FROM product_variants WHERE product_id = ? ORDER BY size, color").all(id) as Variant[];
  return c.html(<ProductForm product={product} categories={categories} variants={variants} />);
});

products.post("/:id/edit", async (c) => {
  const body = await c.req.parseBody();
  const db = getDb();
  const id = c.req.param("id");
  const categories = db.query("SELECT id, name FROM categories ORDER BY sort_order").all() as {
    id: number;
    name: string;
  }[];

  const name = (body["name"] as string).trim();
  const slug = slugify(name);

  try {
    db.prepare(
      `
      UPDATE products SET name = ?, slug = ?, description = ?, price = ?, compare_at_price = ?,
      category_id = ?, image_url = ?, featured = ? WHERE id = ?
    `,
    ).run(
      name,
      slug,
      (body["description"] as string) ?? "",
      parseFloat(body["price"] as string),
      body["compare_at_price"] ? parseFloat(body["compare_at_price"] as string) : null,
      parseInt(body["category_id"] as string),
      (body["image_url"] as string) || null,
      body["featured"] ? 1 : 0,
      id,
    );
  } catch (e: any) {
    const product = db.query("SELECT * FROM products WHERE id = ?").get(id) as any;
    const variants = db.query("SELECT * FROM product_variants WHERE product_id = ? ORDER BY size, color").all(id) as Variant[];
    return c.html(<ProductForm product={product} categories={categories} variants={variants} error={e.message} />);
  }

  return c.redirect("/admin/products");
});

products.post("/:id/variants/add", async (c) => {
  const db = getDb();
  const id = c.req.param("id");
  const body = await c.req.parseBody();

  const product = db.query("SELECT slug FROM products WHERE id = ?").get(id) as { slug: string } | null;
  if (!product) return c.notFound();

  const size = (body["size"] as string).trim();
  const color = (body["color"] as string).trim();
  const stock = parseInt(body["stock"] as string) || 0;
  const sku = (body["sku"] as string)?.trim() || `${product.slug}-${slugify(size)}-${slugify(color)}`;

  db.prepare(
    `INSERT INTO product_variants (product_id, size, color, stock, sku) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, size, color, stock, sku);

  return c.redirect(`/admin/products/${id}/edit`);
});

products.post("/:id/variants/:variantId/delete", (c) => {
  const db = getDb();
  const id = c.req.param("id");
  const variantId = c.req.param("variantId");
  db.prepare("DELETE FROM product_variants WHERE id = ? AND product_id = ?").run(variantId, id);
  return c.redirect(`/admin/products/${id}/edit`);
});

products.post("/:id/delete", (c) => {
  getDb().prepare("DELETE FROM products WHERE id = ?").run(c.req.param("id"));
  return c.redirect("/admin/products");
});

export default products;
