import { Layout } from "../../components/Layout.tsx";
import { Header } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";
import { ProductCard } from "../../components/ProductCard.tsx";
import { CategoryCard } from "../../components/CategoryCard.tsx";
import type { HomePageData } from "./loadHomePage.ts";

export function HomePage({ data }: { data: HomePageData }) {
  return (
    <Layout
      styles={["/styles/pages/hero.css", "/styles/components/product-card.css", "/styles/components/category-card.css"]}
    >
      <Header cartCount={data.cartCount} categories={data.categories} />
      <main>
        <section class="hero">
          <img
            class="hero-image"
            src="/public/hero.webp"
            alt="Model in a dark green jacket on a neon-lit city street at night"
            width="2752"
            height="1536"
            fetchpriority="high"
            decoding="async"
          />
          <div class="container">
            <div class="hero-content">
              <p class="hero-eyebrow">New Season Arrivals</p>
              <h1>Discover Your Style</h1>
              <p class="hero-sub">Quality clothing for every occasion, from head to toe.</p>
              <div class="hero-actions">
                <a href="#categories" class="btn btn-lg hero-cta-primary">
                  Shop Now
                </a>
                <a href="#featured" class="btn btn-lg hero-cta-ghost">
                  Best Sellers
                </a>
              </div>
              <ul class="hero-points">
                <li>Free shipping over $50</li>
                <li>30-day returns</li>
              </ul>
            </div>
          </div>
        </section>
        {data.recent.length > 0 && (
          <section id="recent" class="section section-alt">
            <div class="container">
              <h2 class="section-title">Recently Added</h2>
              <div class="grid grid-3">
                {data.recent.map((product) => (
                  <ProductCard
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    compare_at_price={product.compare_at_price}
                    image_url={product.image_url}
                    image_alt_text={product.image_alt_text}
                    category_name={product.category_name}
                    image_sizes="(max-width: 500px) calc(100vw - 2rem), (max-width: 900px) 50vw, 33vw"
                  />
                ))}
              </div>
            </div>
          </section>
        )}
        <section id="categories" class="section">
          <div class="container">
            <h2 class="section-title">Shop by Category</h2>
            <div class="category-strip">
              {data.categories.map((category, index) => (
                <CategoryCard
                  name={category.name}
                  slug={category.slug}
                  image_url={category.image_url}
                  priority={index === 0}
                />
              ))}
            </div>
          </div>
        </section>
        <section id="featured" class="section section-alt">
          <div class="container">
            <h2 class="section-title">Featured Products</h2>
            <div class="grid grid-4">
              {data.featured.map((product) => (
                <ProductCard
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  compare_at_price={product.compare_at_price}
                  image_url={product.image_url}
                  image_alt_text={product.image_alt_text}
                  category_name={product.category_name}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Layout>
  );
}
