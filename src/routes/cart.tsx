import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { CartService } from "../services/CartService.ts";
import { SqliteCartRepository } from "../repositories/CartRepository.ts";
import { SqliteVariantRepository } from "../repositories/VariantRepository.ts";
import { SqliteProductRepository } from "../repositories/ProductRepository.ts";

const db = getDb();
const cartService = new CartService(new SqliteCartRepository(db), new SqliteVariantRepository(db));
const productRepo = new SqliteProductRepository(db);

const cart = new Hono();

cart.get("/cart", (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const { items, subtotal, count } = cartService.getCart(visitorId);

  return c.html(
    <Layout title="Cart">
      <Header cartCount={count} />
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
                  <span>Subtotal ({count} items)</span>
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

cart.get("/api/cart/count", (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const count = cartService.getCount(visitorId);
  return c.json({ count });
});

cart.post("/cart/add", async (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const body = await c.req.parseBody();

  const productId = Number(body.product_id);
  const size = String(body.size);
  const color = String(body.color);
  const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));

  const success = cartService.addToCart(visitorId, productId, size, color, quantity);
  if (!success) return c.redirect("/");

  const product = productRepo.findById(productId);
  return c.redirect(`/products/${product?.slug}?added=1`);
});

cart.post("/cart/update", async (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const body = await c.req.parseBody();
  cartService.updateQuantity(visitorId, Number(body.item_id), Number(body.quantity) || 1);
  return c.redirect("/cart");
});

cart.post("/cart/remove", async (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const body = await c.req.parseBody();
  cartService.removeItem(visitorId, Number(body.item_id));
  return c.redirect("/cart");
});

export default cart;
