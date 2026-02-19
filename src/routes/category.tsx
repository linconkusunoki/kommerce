import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import { getCartCount } from "../middleware/visitor.ts";

const category = new Hono();

category.get("/categories/:slug", (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId") as string;
  const cartCount = getCartCount(visitorId);
  const slug = c.req.param("slug");

  const cat = db
    .query("SELECT * FROM categories WHERE slug = ?")
    .get(slug) as { id: number; name: string; slug: string; description: string | null } | null;

  if (!cat) {
    return c.html(
      <Layout title="Category Not Found">
        <Header cartCount={cartCount} />
        <main class="section">
          <div class="container" style="text-align: center; padding: 4rem 0;">
            <h1>Category not found</h1>
            <a href="/" class="btn btn-primary">Back to Home</a>
          </div>
        </main>
        <Footer />
      </Layout>,
      404,
    );
  }

  const products = db
    .query(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = ?
       ORDER BY p.created_at DESC`,
    )
    .all(cat.id) as {
    id: number;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    image_url: string | null;
    category_name: string;
  }[];

  return c.html(
    <Layout title={cat.name}>
      <Header cartCount={cartCount} />
      <main class="section">
        <div class="container">
          <nav class="breadcrumb">
            <a href="/">Home</a>
            <span class="breadcrumb-sep">/</span>
            <span>{cat.name}</span>
          </nav>
          <h1 class="section-title" style="text-align: left;">
            {cat.name}
          </h1>
          {cat.description && <p style="color: var(--color-text-muted); margin-bottom: 2rem;">{cat.description}</p>}
          {products.length === 0 ? (
            <p style="color: var(--color-text-muted);">No products in this category yet.</p>
          ) : (
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
          )}
        </div>
      </main>
      <Footer />
    </Layout>,
  );
});

export default category;
