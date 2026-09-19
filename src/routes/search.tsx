import { Hono } from "hono";
import { SearchPage } from "../pages/search/SearchPage.tsx";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

export function createSearch(services: Services) {
  const search = new Hono<AppEnv>();
  search.get("/search", (c) => {
    const query = (c.req.query("q") ?? "").trim();
    if (query.length < 2) return c.redirect("/");
    return c.html(
      <SearchPage
        query={query}
        products={services.productService.search(query)}
        cartCount={services.cartService.getCount(c.get("visitorId"))}
      />,
    );
  });
  return search;
}
