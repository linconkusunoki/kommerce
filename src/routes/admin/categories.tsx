import { Hono } from "hono";
import { CategoryForm } from "../../pages/admin/categories/CategoryForm.tsx";
import { CategoryListPage } from "../../pages/admin/categories/CategoryListPage.tsx";
import {
  loadAdminCategoriesPage,
  loadAdminCategoryForm,
} from "../../pages/admin/categories/loadAdminCategoriesPage.ts";
import type { Services } from "../../lib/container.ts";
import { slugify } from "../../lib/utils.ts";
import type { AppEnv } from "../../types/context.ts";

export function createAdminCategories(services: Services) {
  const categories = new Hono<AppEnv>();

  categories.get("/", (c) => {
    const { categories: allCategories } = loadAdminCategoriesPage(services);
    return c.html(<CategoryListPage categories={allCategories} />);
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
    const page = loadAdminCategoryForm(services, c.req.param("id"));
    if (!page || !page.category) return c.notFound();
    return c.html(<CategoryForm category={page.category} />);
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
      const page = loadAdminCategoryForm(services, id);
      return c.html(<CategoryForm category={page?.category} error={e.message} />);
    }
  });

  categories.post("/:id/delete", (c) => {
    services.categoryService.delete(c.req.param("id"));
    return c.redirect("/admin/categories");
  });

  return categories;
}
