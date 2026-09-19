import { Layout } from "../../components/Layout.tsx";
import { Header } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";
import { ProductDetails } from "./ProductDetails.tsx";
import { ProductReviews } from "./ProductReviews.tsx";
import type { ProductPageData } from "./loadProductPage.ts";

type ProductPageProps = {
  data: ProductPageData;
  added?: string;
  reviewError?: string;
};

export function ProductPage({ data, added, reviewError }: ProductPageProps) {
  const { product } = data;

  return (
    <Layout title={product.name} styles={["/styles/pages/product-detail.css"]}>
      <Header cartCount={data.cartCount} />
      <main>
        <div class="container">
          <nav class="breadcrumb">
            <a href="/">Home</a>
            <span class="breadcrumb-sep">/</span>
            <span>{product.category_name}</span>
            <span class="breadcrumb-sep">/</span>
            <span>{product.name}</span>
          </nav>

          {added && (
            <div class="alert alert-success">
              Added to cart!{" "}
              <a href="/cart" style="font-weight: 600; text-decoration: underline;">
                View cart
              </a>
            </div>
          )}
          {reviewError && <div class="alert alert-error">{reviewError}</div>}

          <ProductDetails data={data} />
          <ProductReviews data={data} />
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
