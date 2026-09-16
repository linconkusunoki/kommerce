import { Hono } from "hono";
import { AdminLayout } from "../../components/AdminLayout.tsx";
import type { Services } from "../../lib/container.ts";
import { slugify } from "../../lib/utils.ts";
import type { AppEnv } from "../../types/context.ts";

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

export function createAdminCategories(services: Services) {
  const categories = new Hono<AppEnv>();

categories.get("/", (c) => {
  const allCategories = services.categoryService.getAllWithCount();
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

categories.get("/new", (c) => c.html(<CategoryForm />));

categories.post("/new", async (c) => {
  const body = await c.req.parseBody();
  const name = (body["name"] as string).trim();

  try {
    services.categoryService.create({
      name,
      slug: slugify(name),
      description: (body["description"] as string) || null,
      image_url: (body["image_url"] as string) || null,
      sort_order: parseInt(body["sort_order"] as string) || 0,
    });
    return c.redirect("/admin/categories");
  } catch (e: any) {
    return c.html(<CategoryForm error={e.message} />);
  }
});

categories.get("/:id/edit", (c) => {
  const category = services.categoryService.getById(c.req.param("id"));
  if (!category) return c.notFound();
  return c.html(<CategoryForm category={category} />);
});

categories.post("/:id/edit", async (c) => {
  const body = await c.req.parseBody();
  const id = c.req.param("id");
  const name = (body["name"] as string).trim();

  try {
    services.categoryService.update(id, {
      name,
      slug: slugify(name),
      description: (body["description"] as string) || null,
      image_url: (body["image_url"] as string) || null,
      sort_order: parseInt(body["sort_order"] as string) || 0,
    });
    return c.redirect("/admin/categories");
  } catch (e: any) {
    const category = services.categoryService.getById(id);
    return c.html(<CategoryForm category={category ?? undefined} error={e.message} />);
  }
});

categories.post("/:id/delete", (c) => {
  services.categoryService.delete(c.req.param("id"));
  return c.redirect("/admin/categories");
  });

  return categories;
}
