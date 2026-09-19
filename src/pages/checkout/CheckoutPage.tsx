import { Layout } from "../../components/Layout.tsx";
import { Header } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";
import type { CartItem, Customer, Order, OrderItem } from "../../types/index.ts";

export function CheckoutPage({
  items,
  subtotal,
  count,
  customer,
  error,
}: {
  items: CartItem[];
  subtotal: number;
  count: number;
  customer: Customer | null;
  error?: string;
}) {
  return (
    <Layout title="Checkout" styles={["/styles/pages/checkout.css"]}>
      <Header cartCount={count} />
      <main class="section">
        <div class="container">
          <h1 class="section-title" style="text-align: left;">
            Checkout
          </h1>
          {error && <div class="alert alert-error">{error}</div>}
          <div class="checkout-layout">
            <form method="post" action="/checkout" class="checkout-form">
              <h2 class="checkout-section-title">Contact Information</h2>
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customer?.email ?? ""}
                  required
                  placeholder="your@email.com"
                  readonly={Boolean(customer)}
                />
              </div>
              <div class="form-group">
                <label for="phone">Phone (optional)</label>
                <input type="tel" id="phone" name="phone" placeholder="+1 (555) 000-0000" />
              </div>
              <h2 class="checkout-section-title">Shipping Address</h2>
              <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required placeholder="John Doe" />
              </div>
              <div class="form-group">
                <label for="address">Address</label>
                <input type="text" id="address" name="address" required placeholder="123 Main St" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="city">City</label>
                  <input type="text" id="city" name="city" required placeholder="New York" />
                </div>
                <div class="form-group">
                  <label for="postal_code">Postal Code</label>
                  <input type="text" id="postal_code" name="postal_code" required placeholder="10001" />
                </div>
              </div>
              <div class="form-group">
                <label for="country">Country</label>
                <input type="text" id="country" name="country" placeholder="United States" />
              </div>
              <h2 class="checkout-section-title">Additional Notes</h2>
              <div class="form-group">
                <textarea id="notes" name="notes" rows={3} placeholder="Any special instructions..."></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-lg btn-block">
                Place Order — ${subtotal.toFixed(2)}
              </button>
            </form>
            <div class="checkout-summary">
              <h3>Order Summary</h3>
              <div class="checkout-items">
                {items.map((item) => (
                  <div class="checkout-item">
                    <div class="checkout-item-image">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} />
                      ) : (
                        <div class="cart-item-placeholder" />
                      )}
                      <span class="checkout-item-qty">{item.quantity}</span>
                    </div>
                    <div class="checkout-item-info">
                      <span class="checkout-item-name">{item.product_name}</span>
                      <span class="checkout-item-variant">
                        {item.size} / {item.color}
                      </span>
                    </div>
                    <span class="checkout-item-total">${(item.product_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div class="cart-summary-row">
                <span>Subtotal</span>
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </Layout>
  );
}

export function OrderNotFoundPage({ count }: { count: number }) {
  return (
    <Layout title="Order Not Found" styles={["/styles/pages/order.css"]}>
      <Header cartCount={count} />
      <main class="section">
        <div class="container" style="text-align: center; padding: 4rem 0;">
          <h1>Order not found</h1>
          <p style="color: var(--color-text-muted); margin: 1rem 0;">We couldn't find that order.</p>
          <a href="/" class="btn btn-primary">
            Back to Home
          </a>
        </div>
      </main>
      <Footer />
    </Layout>
  );
}

export function OrderConfirmationPage({ order, items, count }: { order: Order; items: OrderItem[]; count: number }) {
  return (
    <Layout title={`Order ${order.order_number}`} styles={["/styles/pages/order.css"]}>
      <Header cartCount={count} />
      <main class="section">
        <div class="container">
          <div class="order-confirmation">
            <div class="order-confirmation-header">
              <div class="order-check">&#10003;</div>
              <h1>Order Confirmed!</h1>
              <p>
                Thank you, {order.name}. Your order <strong>{order.order_number}</strong> has been placed.
              </p>
              <p class="order-email-note">
                {process.env.RESEND_API_KEY
                  ? `A confirmation has been sent to ${order.email}`
                  : `Order details saved for ${order.email}`}
              </p>
            </div>
            <div class="order-details-grid">
              <div class="order-detail-card">
                <h3>Shipping Address</h3>
                <p>{order.name}</p>
                <p>{order.address}</p>
                <p>
                  {order.city}, {order.postal_code}
                </p>
                {order.country && <p>{order.country}</p>}
                {order.phone && <p>{order.phone}</p>}
              </div>
              <div class="order-detail-card">
                <h3>Order Summary</h3>
                {items.map((item) => (
                  <div class="order-line">
                    <span>
                      {item.product_name} ({item.variant_size}/{item.variant_color}) x{item.quantity}
                    </span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
                <div class="order-line order-line-total">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 2rem;">
              <a href="/" class="btn btn-primary btn-lg">
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
