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
      <Header cartCount={data.cartCount} />
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
              {data.categories.map((category, index) => (
                <CategoryCard
                  name={category.name}
                  slug={category.slug}
                  description={category.description}
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
