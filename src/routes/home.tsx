import { Hono } from "hono";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import { CategoryCard } from "../components/CategoryCard.tsx";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

export function createHome(services: Services) {
  const home = new Hono<AppEnv>();

home.get("/", (c) => {
  const visitorId = c.get("visitorId");
  const cartCount = services.cartService.getCount(visitorId);
  const categories = services.categoryService.getAll();
  const featured = services.productService.getFeatured();

  return c.html(
    <Layout styles={["/styles/pages/hero.css", "/styles/components/product-card.css", "/styles/components/category-card.css"]}>
      <Header cartCount={cartCount} />
      <main>
        <section class="hero">
          <div class="container">
            <h1>Discover Your Style</h1>
            <p>Quality clothing for every occasion, from head to toe.</p>
            <a href="#categories" class="btn btn-primary btn-lg">
              Shop Now
            </a>
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
    </Layout>,
  );
  });

  return home;
}
