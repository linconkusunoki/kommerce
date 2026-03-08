import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import { CartService } from "../services/CartService.ts";
import { ProductService } from "../services/ProductService.ts";
import { CategoryService } from "../services/CategoryService.ts";
import { SqliteCartRepository } from "../repositories/CartRepository.ts";
import { SqliteVariantRepository } from "../repositories/VariantRepository.ts";
import { SqliteProductRepository } from "../repositories/ProductRepository.ts";
import { SqliteCategoryRepository } from "../repositories/CategoryRepository.ts";

const db = getDb();
const variantRepo = new SqliteVariantRepository(db);
const cartService = new CartService(new SqliteCartRepository(db), variantRepo);
const productService = new ProductService(new SqliteProductRepository(db), variantRepo);
const categoryService = new CategoryService(new SqliteCategoryRepository(db));

const category = new Hono();

category.get("/categories/:slug", (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const cartCount = cartService.getCount(visitorId);
  const slug = c.req.param("slug");

  const cat = categoryService.getBySlug(slug);

  if (!cat) {
    return c.html(
      <Layout title="Category Not Found">
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

  const products = productService.getByCategory(cat.id);

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
