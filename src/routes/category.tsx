import { Hono } from "hono";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

export function createCategory(services: Services) {
  const category = new Hono<AppEnv>();

category.get("/categories/:slug", (c) => {
  const visitorId = c.get("visitorId");
  const cartCount = services.cartService.getCount(visitorId);
  const slug = c.req.param("slug");

  const cat = services.categoryService.getBySlug(slug);

  if (!cat) {
    return c.html(
      <Layout title="Category Not Found" styles={["/styles/components/product-card.css"]}>
        <Header cartCount={cartCount} />
        <main class="section">
          <div class="container" style="text-align: center; padding: 4rem 0;">
            <h1>Category not found</h1>
            <a href="/" class="btn btn-primary">
              Back to Home
            </a>
          </div>
        </main>
        <Footer />
      </Layout>,
      404,
    );
  }

  const products = services.productService.getByCategory(cat.id);

  return c.html(
    <Layout title={cat.name} styles={["/styles/components/product-card.css"]}>
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
          {cat.description && (
            <p style="color: var(--color-text-muted); margin-bottom: 2rem;">{cat.description}</p>
          )}
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
                  image_alt_text={p.image_alt_text}
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

  return category;
}
