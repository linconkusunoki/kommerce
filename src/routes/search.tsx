import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import { CartService } from "../services/CartService.ts";
import { ProductService } from "../services/ProductService.ts";
import { SqliteCartRepository } from "../repositories/CartRepository.ts";
import { SqliteVariantRepository } from "../repositories/VariantRepository.ts";
import { SqliteProductRepository } from "../repositories/ProductRepository.ts";

const db = getDb();
const variantRepo = new SqliteVariantRepository(db);
const cartService = new CartService(new SqliteCartRepository(db), variantRepo);
const productService = new ProductService(new SqliteProductRepository(db), variantRepo);

const search = new Hono();

search.get("/search", (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const cartCount = cartService.getCount(visitorId);
  const q = (c.req.query("q") ?? "").trim();

  if (q.length < 2) return c.redirect("/");

  const products = productService.search(q);

  return c.html(
    <Layout title={`Search: ${q}`}>
      <Header cartCount={cartCount} />
      <main class="section">
        <div class="container">
          <form method="get" action="/search" class="search-form">
            <input type="text" name="q" value={q} placeholder="Search products..." class="search-input" required />
            <button type="submit" class="btn btn-primary">
              Search
            </button>
          </form>
          <h1 class="section-title" style="text-align: left; margin-top: 2rem;">
            {products.length > 0
              ? `${products.length} result${products.length === 1 ? "" : "s"} for "${q}"`
              : `No results for "${q}"`}
          </h1>
          {products.length > 0 ? (
            <div class="grid grid-4">
              {products.map((p) => (
                <ProductCard
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  compare_at_price={p.compare_at_price}
                  image_url={p.image_url}
                  category_name={p.category_name}
                />
              ))}
            </div>
          ) : (
            <p style="color: var(--color-text-muted);">Try different keywords.</p>
          )}
        </div>
      </main>
      <Footer />
    </Layout>,
  );
});

export default search;
