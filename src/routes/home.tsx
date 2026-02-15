import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import { CategoryCard } from "../components/CategoryCard.tsx";
import { getCartCount } from "../middleware/visitor.ts";

const home = new Hono();

home.get("/", (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId") as string;
  const cartCount = getCartCount(visitorId);

  const categories = db.query(
    "SELECT * FROM categories ORDER BY sort_order"
  ).all() as { id: number; name: string; slug: string; description: string | null; image_url: string | null }[];

  const featured = db.query(`
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.featured = 1
    ORDER BY p.created_at DESC
  `).all() as {
    id: number; name: string; slug: string; price: number;
    compare_at_price: number | null; image_url: string | null; category_name: string;
  }[];

  return c.html(
    <Layout>
      <Header cartCount={cartCount} />
      <main>
        <section class="hero">
          <div class="container">
            <h1>Discover Your Style</h1>
            <p>Quality clothing for every occasion, from head to toe.</p>
            <a href="#categories" class="btn btn-primary btn-lg">Shop Now</a>
          </div>
        </section>

        <section id="categories" class="section">
          <div class="container">
            <h2 class="section-title">Shop by Category</h2>
            <div class="grid grid-4">
              {categories.map((cat) => (
                <CategoryCard
                  name={cat.name}
                  slug={cat.slug}
                  description={cat.description}
                  image_url={cat.image_url}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="featured" class="section section-alt">
          <div class="container">
            <h2 class="section-title">Featured Products</h2>
            <div class="grid grid-4">
              {featured.map((p) => (
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
          </div>
        </section>
      </main>
      <Footer />
    </Layout>
  );
});

export default home;
