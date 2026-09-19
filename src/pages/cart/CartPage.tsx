import { Layout } from "../../components/Layout.tsx";
import { Header } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";
import type { CartItem } from "../../types/index.ts";

export function CartPage({ items, subtotal, count }: { items: CartItem[]; subtotal: number; count: number }) {
  return (
    <Layout title="Cart" styles={["/styles/pages/cart.css"]}>
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
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((quantity) => (
                            <option value={String(quantity)} selected={quantity === item.quantity}>
                              {quantity}
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
    </Layout>
  );
}
