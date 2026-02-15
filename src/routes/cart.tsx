import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { getCartCount } from "../middleware/visitor.ts";

type CartItem = {
  id: number;
  variant_id: number;
  quantity: number;
  size: string;
  color: string;
  stock: number;
  product_name: string;
  product_slug: string;
  product_price: number;
  product_image: string | null;
};

const cart = new Hono();

cart.get("/cart", (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId" as never) as string;
  const cartCount = getCartCount(visitorId);

  const items = db
    .query(
      `
    SELECT ci.id, ci.variant_id, ci.quantity,
           pv.size, pv.color, pv.stock,
           p.name as product_name, p.slug as product_slug,
           p.price as product_price, p.image_url as product_image
    FROM cart_items ci
    JOIN product_variants pv ON ci.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE ci.session_id = ?
    ORDER BY ci.added_at DESC
  `,
    )
    .all(visitorId) as CartItem[];

  const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);

  return c.html(
    <Layout title="Cart">
      <Header cartCount={cartCount} />
      <main class="section">
        <div class="container">
          <h1 class="section-title" style="text-align: left;">
            Your Cart
          </h1>

          {items.length === 0 ? (
            <div class="cart-empty">
              <p>Your cart is empty.</p>
              <a href="/" class="btn btn-primary">
                Continue Shopping
              </a>
            </div>
          ) : (
            <div class="cart-layout">
              <div class="cart-items">
                {items.map((item) => (
                  <div class="cart-item">
                    <div class="cart-item-image">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} />
                      ) : (
                        <div class="cart-item-placeholder" />
                      )}
                    </div>
                    <div class="cart-item-info">
                      <a href={`/products/${item.product_slug}`} class="cart-item-name">
                        {item.product_name}
                      </a>
                      <p class="cart-item-variant">
                        {item.size} / {item.color}
                      </p>
                      <p class="cart-item-price">${item.product_price.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                      <form method="post" action="/cart/update" class="cart-qty-form">
                        <input type="hidden" name="item_id" value={String(item.id)} />
                        <select name="quantity" onchange="this.form.submit()" class="quantity-select">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option value={String(n)} selected={n === item.quantity}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </form>
                      <form method="post" action="/cart/remove">
                        <input type="hidden" name="item_id" value={String(item.id)} />
                        <button type="submit" class="btn btn-sm btn-outline cart-remove-btn">
                          Remove
                        </button>
                      </form>
                    </div>
                    <div class="cart-item-total">${(item.product_price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div class="cart-summary">
                <h3>Order Summary</h3>
                <div class="cart-summary-row">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div class="cart-summary-row">
                  <span>Shipping</span>
                  <span class="cart-free">Free</span>
                </div>
                <div class="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <a href="/checkout" class="btn btn-primary btn-lg btn-block" style="margin-top: 1rem;">
                  Proceed to Checkout
                </a>
                <a href="/" class="btn btn-outline btn-block" style="margin-top: 0.5rem;">
                  Continue Shopping
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </Layout>,
  );
});

cart.post("/cart/add", async (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId" as never) as string;
  const body = await c.req.parseBody();

  const productId = Number(body.product_id);
  const size = String(body.size);
  const color = String(body.color);
  const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));

  // Find the matching variant
  const variant = db
    .query("SELECT id, stock FROM product_variants WHERE product_id = ? AND size = ? AND color = ?")
    .get(productId, size, color) as { id: number; stock: number } | null;

  if (!variant) {
    return c.redirect("/");
  }

  // Upsert: add quantity if already in cart
  const existing = db
    .query("SELECT id, quantity FROM cart_items WHERE session_id = ? AND variant_id = ?")
    .get(visitorId, variant.id) as { id: number; quantity: number } | null;

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, variant.stock, 10);
    db.query("UPDATE cart_items SET quantity = ? WHERE id = ?").run(newQty, existing.id);
  } else {
    const qty = Math.min(quantity, variant.stock, 10);
    db.query("INSERT INTO cart_items (session_id, variant_id, quantity) VALUES (?, ?, ?)").run(
      visitorId,
      variant.id,
      qty,
    );
  }

  // Get the product slug for redirect
  const product = db.query("SELECT slug FROM products WHERE id = ?").get(productId) as { slug: string };
  return c.redirect(`/products/${product.slug}?added=1`);
});

cart.post("/cart/update", async (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId" as never) as string;
  const body = await c.req.parseBody();

  const itemId = Number(body.item_id);
  const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));

  db.query("UPDATE cart_items SET quantity = ? WHERE id = ? AND session_id = ?").run(quantity, itemId, visitorId);

  return c.redirect("/cart");
});

cart.post("/cart/remove", async (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId" as never) as string;
  const body = await c.req.parseBody();

  const itemId = Number(body.item_id);

  db.query("DELETE FROM cart_items WHERE id = ? AND session_id = ?").run(itemId, visitorId);

  return c.redirect("/cart");
});

export default cart;
