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
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
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

function ProductForm({
  product,
  categories,
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

  try {
    db.prepare(
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
  } catch (e: any) {
    return c.html(<ProductForm categories={categories} error={e.message} />);
  }

  return c.redirect("/admin/products");
});

products.get("/:id/edit", (c) => {
  const db = getDb();
  const product = db.query("SELECT * FROM products WHERE id = ?").get(c.req.param("id")) as any;
  if (!product) return c.notFound();
  const categories = db.query("SELECT id, name FROM categories ORDER BY sort_order").all() as {
    id: number;
    name: string;
  }[];
  return c.html(<ProductForm product={product} categories={categories} />);
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
    return c.html(<ProductForm product={product} categories={categories} error={e.message} />);
  }

  return c.redirect("/admin/products");
});

products.post("/:id/delete", (c) => {
  getDb().prepare("DELETE FROM products WHERE id = ?").run(c.req.param("id"));
  return c.redirect("/admin/products");
});

export default products;
