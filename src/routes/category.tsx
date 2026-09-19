import { Hono } from "hono";
import { CategoryNotFound, CategoryPage } from "../pages/category/CategoryPage.tsx";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

export function createCategory(services: Services) {
  const category = new Hono<AppEnv>();
  category.get("/categories/:slug", (c) => {
    const cartCount = services.cartService.getCount(c.get("visitorId"));
    const found = services.categoryService.getBySlug(c.req.param("slug"));
    if (!found) return c.html(<CategoryNotFound cartCount={cartCount} />, 404);
    return c.html(
      <CategoryPage
        category={found}
        products={services.productService.getByCategory(found.id)}
        cartCount={cartCount}
      />,
    );
  });
  return category;
}
