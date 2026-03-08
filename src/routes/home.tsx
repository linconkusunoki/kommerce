import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { ProductCard } from "../components/ProductCard.tsx";
import { CategoryCard } from "../components/CategoryCard.tsx";
import { CartService } from "../services/CartService.ts";
import { ProductService } from "../services/ProductService.ts";
import { CategoryService } from "../services/CategoryService.ts";
import { SqliteCartRepository } from "../repositories/CartRepository.ts";
import { SqliteVariantRepository } from "../repositories/VariantRepository.ts";
import { SqliteProductRepository } from "../repositories/ProductRepository.ts";
import { SqliteCategoryRepository } from "../repositories/CategoryRepository.ts";

const db = getDb();
const cartService = new CartService(new SqliteCartRepository(db), new SqliteVariantRepository(db));
const productService = new ProductService(new SqliteProductRepository(db), new SqliteVariantRepository(db));
const categoryService = new CategoryService(new SqliteCategoryRepository(db));

const home = new Hono();

home.get("/", (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const cartCount = cartService.getCount(visitorId);
  const categories = categoryService.getAll();
  const featured = productService.getFeatured();

  return c.html(
    <Layout>
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

export default home;
