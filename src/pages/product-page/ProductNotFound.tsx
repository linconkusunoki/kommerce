import { Layout } from "../../components/Layout.tsx";
import { Header } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";

export function ProductNotFound({ cartCount }: { cartCount: number }) {
  return (
    <Layout title="Not Found" styles={["/styles/pages/product-detail.css"]}>
      <Header cartCount={cartCount} />
      <main class="section">
        <div class="container" style="text-align: center; padding: 4rem 0;">
          <h1>Product not found</h1>
          <p style="color: var(--color-text-muted); margin: 1rem 0;">The product you're looking for doesn't exist.</p>
          <a href="/" class="btn btn-primary">
            Back to Home
          </a>
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
