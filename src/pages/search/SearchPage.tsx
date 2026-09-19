import { Layout } from "../../components/Layout.tsx";
import { Header } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";
import { ProductCard } from "../../components/ProductCard.tsx";
import type { ProductWithCategory } from "../../types/index.ts";

export function SearchPage({
  query,
  products,
  cartCount,
}: {
  query: string;
  products: ProductWithCategory[];
  cartCount: number;
}) {
  return (
    <Layout title={`Search: ${query}`} styles={["/styles/pages/search.css", "/styles/components/product-card.css"]}>
      <Header cartCount={cartCount} />
      <main class="section">
        <div class="container">
          <form method="get" action="/search" class="search-form">
            <input type="text" name="q" value={query} placeholder="Search products..." class="search-input" required />
            <button type="submit" class="btn btn-primary">
              Search
            </button>
          </form>
          <h1 class="section-title" style="text-align: left; margin-top: 2rem;">
            {products.length > 0
              ? `${products.length} result${products.length === 1 ? "" : "s"} for "${query}"`
              : `No results for "${query}"`}
          </h1>
          {products.length > 0 ? (
            <div class="grid grid-4">
              {products.map((product) => (
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
          ) : (
            <p style="color: var(--color-text-muted);">Try different keywords.</p>
          )}
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
