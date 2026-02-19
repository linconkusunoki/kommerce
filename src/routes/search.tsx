import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import { getCartCount } from "../middleware/visitor.ts";

const search = new Hono();

search.get("/search", (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId") as string;
  const cartCount = getCartCount(visitorId);
  const q = (c.req.query("q") ?? "").trim();

  if (q.length < 2) {
    return c.redirect("/");
  }

  const like = `%${q}%`;
  const products = db
    .query(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.name LIKE ? OR p.description LIKE ?
       ORDER BY p.name`,
    )
    .all(like, like) as {
    id: number;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    image_url: string | null;
    category_name: string;
  }[];

  return c.html(
    <Layout title={`Search: ${q}`}>
      <Header cartCount={cartCount} />
      <main class="section">
        <div class="container">
          <form method="get" action="/search" class="search-form">
            <input type="text" name="q" value={q} placeholder="Search products..." class="search-input" required />
            <button type="submit" class="btn btn-primary">Search</button>
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
