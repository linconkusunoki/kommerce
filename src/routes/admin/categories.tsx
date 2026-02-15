import { Hono } from "hono";
import { getDb } from "../../db/schema.ts";
import { AdminLayout } from "../../components/AdminLayout.tsx";

const categories = new Hono();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

categories.get("/", (c) => {
  const db = getDb();
  const allCategories = db
    .query(
      `
    SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count
    FROM categories c ORDER BY c.sort_order
  `,
    )
    .all() as {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    product_count: number;
  }[];

  return c.html(
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
          {allCategories.map((cat) => (
            <tr>
              <td>{cat.sort_order}</td>
              <td>{cat.name}</td>
              <td>{cat.slug}</td>
              <td>{cat.product_count}</td>
              <td class="admin-actions">
                <a href={`/admin/categories/${cat.id}/edit`} class="btn btn-sm">
                  Edit
                </a>
                <form method="post" action={`/admin/categories/${cat.id}/delete`} style="display:inline">
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
    </AdminLayout>,
  );
});

function CategoryForm({
  category,
  error,
}: {
  category?: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    sort_order: number;
  };
  error?: string;
}) {
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

categories.get("/new", (c) => {
  return c.html(<CategoryForm />);
});

categories.post("/new", async (c) => {
  const body = await c.req.parseBody();
  const db = getDb();
  const name = (body["name"] as string).trim();
  const slug = slugify(name);

  try {
    db.prepare(
      `
      INSERT INTO categories (name, slug, description, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run(
      name,
      slug,
      (body["description"] as string) || null,
      (body["image_url"] as string) || null,
      parseInt(body["sort_order"] as string) || 0,
    );
  } catch (e: any) {
    return c.html(<CategoryForm error={e.message} />);
  }

  return c.redirect("/admin/categories");
});

categories.get("/:id/edit", (c) => {
  const category = getDb().query("SELECT * FROM categories WHERE id = ?").get(c.req.param("id")) as any;
  if (!category) return c.notFound();
  return c.html(<CategoryForm category={category} />);
});

categories.post("/:id/edit", async (c) => {
  const body = await c.req.parseBody();
  const db = getDb();
  const id = c.req.param("id");
  const name = (body["name"] as string).trim();
  const slug = slugify(name);

  try {
    db.prepare(
      `
      UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, sort_order = ? WHERE id = ?
    `,
    ).run(
      name,
      slug,
      (body["description"] as string) || null,
      (body["image_url"] as string) || null,
      parseInt(body["sort_order"] as string) || 0,
      id,
    );
  } catch (e: any) {
    const category = db.query("SELECT * FROM categories WHERE id = ?").get(id) as any;
    return c.html(<CategoryForm category={category} error={e.message} />);
  }

  return c.redirect("/admin/categories");
});

categories.post("/:id/delete", (c) => {
  getDb().prepare("DELETE FROM categories WHERE id = ?").run(c.req.param("id"));
  return c.redirect("/admin/categories");
});

export default categories;
