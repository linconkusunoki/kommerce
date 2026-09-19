import { Layout } from "../../components/Layout.tsx";
import { Header } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";
import { ProductCard } from "../../components/ProductCard.tsx";
import type { ProductWithCategory, Category } from "../../types/index.ts";

export function CategoryNotFound({ cartCount }: { cartCount: number }) {
  return (
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
    </Layout>
  );
}

export function CategoryPage({
  category,
  products,
  cartCount,
}: {
  category: Category;
  products: ProductWithCategory[];
  cartCount: number;
}) {
  return (
    <Layout title={category.name} styles={["/styles/components/product-card.css"]}>
      <Header cartCount={cartCount} />
      <main class="section">
        <div class="container">
          <nav class="breadcrumb">
            <a href="/">Home</a>
            <span class="breadcrumb-sep">/</span>
            <span>{category.name}</span>
          </nav>
          <h1 class="section-title" style="text-align: left;">
            {category.name}
          </h1>
          {category.description && (
            <p style="color: var(--color-text-muted); margin-bottom: 2rem;">{category.description}</p>
          )}
          {products.length === 0 ? (
            <p style="color: var(--color-text-muted);">No products in this category yet.</p>
          ) : (
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
          )}
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
