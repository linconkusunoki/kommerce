import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { getCartCount } from "../middleware/visitor.ts";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  category_name: string;
  category_slug: string;
};

type Variant = {
  id: number;
  size: string;
  color: string;
  stock: number;
};

const product = new Hono();

product.get("/products/:slug", (c) => {
  const db = getDb();
  const slug = c.req.param("slug");
  const visitorId = c.get("visitorId" as never) as string;
  const cartCount = getCartCount(visitorId);
  const added = c.req.query("added");

  const p = db
    .query(
      `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ?
  `,
    )
    .get(slug) as Product | null;

  if (!p) {
    return c.html(
      <Layout title="Not Found">
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
      </Layout>,
      404,
    );
  }

  const variants = db
    .query("SELECT id, size, color, stock FROM product_variants WHERE product_id = ? ORDER BY size, color")
    .all(p.id) as Variant[];

  const sizes = [...new Set(variants.map((v) => v.size))];
  const colors = [...new Set(variants.map((v) => v.color))];
  const onSale = p.compare_at_price != null && p.compare_at_price > p.price;

  return c.html(
    <Layout title={p.name}>
      <Header cartCount={cartCount} />
      <main>
        <div class="container">
          <nav class="breadcrumb">
            <a href="/">Home</a>
            <span class="breadcrumb-sep">/</span>
            <span>{p.category_name}</span>
            <span class="breadcrumb-sep">/</span>
            <span>{p.name}</span>
          </nav>

          {added && (
            <div class="alert alert-success">
              Added to cart!{" "}
              <a href="/cart" style="font-weight: 600; text-decoration: underline;">
                View cart
              </a>
            </div>
          )}

          <div class="product-detail">
            <div class="product-detail-image">
              {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div class="product-detail-placeholder" />}
              {onSale && <span class="badge badge-sale">Sale</span>}
            </div>

            <div class="product-detail-info">
              <span class="product-detail-category">{p.category_name}</span>
              <h1 class="product-detail-title">{p.name}</h1>

              <div class="product-detail-price">
                <span class={onSale ? "price-lg price-sale" : "price-lg"}>${p.price.toFixed(2)}</span>
                {onSale && <span class="price-lg price-compare">${p.compare_at_price!.toFixed(2)}</span>}
              </div>

              {p.description && <p class="product-detail-desc">{p.description}</p>}

              <form method="post" action="/cart/add" class="product-form">
                <input type="hidden" name="product_id" value={String(p.id)} />

                <div class="product-option">
                  <label class="product-option-label">Size</label>
                  <div class="option-chips">
                    {sizes.map((size, i) => (
                      <label class="chip">
                        <input type="radio" name="size" value={size} checked={i === 0} />
                        <span class="chip-label">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div class="product-option">
                  <label class="product-option-label">Color</label>
                  <div class="option-chips">
                    {colors.map((color, i) => (
                      <label class="chip">
                        <input type="radio" name="color" value={color} checked={i === 0} />
                        <span class="chip-label">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div class="product-option">
                  <label class="product-option-label">Quantity</label>
                  <select name="quantity" class="quantity-select">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option value={String(n)}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Hidden field to pass variants data for stock validation */}
                <input
                  type="hidden"
                  name="variants"
                  value={JSON.stringify(
                    variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock })),
                  )}
                />

                <button type="submit" class="btn btn-primary btn-lg btn-block">
                  Add to Cart
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </Layout>,
  );
});

export default product;
