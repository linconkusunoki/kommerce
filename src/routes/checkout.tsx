import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { OrderService } from "../services/OrderService.ts";
import { CartService } from "../services/CartService.ts";
import { SqliteOrderRepository } from "../repositories/OrderRepository.ts";
import { SqliteCartRepository } from "../repositories/CartRepository.ts";
import { SqliteVariantRepository } from "../repositories/VariantRepository.ts";

const db = getDb();
const cartRepo = new SqliteCartRepository(db);
const cartService = new CartService(cartRepo, new SqliteVariantRepository(db));
const orderService = new OrderService(new SqliteOrderRepository(db), cartRepo);

const checkout = new Hono();

checkout.get("/checkout", (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const { items, subtotal, count } = cartService.getCart(visitorId);
  const error = c.req.query("error");

  if (items.length === 0) return c.redirect("/cart");

  return c.html(
    <Layout title="Checkout">
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
                <input type="email" id="email" name="email" required placeholder="your@email.com" />
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
    </Layout>,
  );
});

checkout.post("/checkout", async (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const body = await c.req.parseBody();

  const email = (body.email as string)?.trim();
  const name = (body.name as string)?.trim();
  const address = (body.address as string)?.trim();
  const city = (body.city as string)?.trim();
  const postalCode = (body.postal_code as string)?.trim();

  if (!email || !name || !address || !city || !postalCode) {
    return c.redirect("/checkout?error=Please fill in all required fields");
  }

  const orderNumber = orderService.placeOrder(visitorId, {
    email,
    name,
    address,
    city,
    postal_code: postalCode,
    country: (body.country as string)?.trim() || "",
    phone: (body.phone as string)?.trim() || "",
    notes: (body.notes as string)?.trim() || "",
  });

  if (!orderNumber) return c.redirect("/cart");

  return c.redirect(`/order/${orderNumber}`);
});

checkout.get("/order/:orderNumber", (c) => {
  const visitorId = c.get("visitorId" as never) as string;
  const count = cartService.getCount(visitorId);
  const orderNumber = c.req.param("orderNumber");

  const result = orderService.getOrderByNumber(orderNumber);

  if (!result) {
    return c.html(
      <Layout title="Order Not Found">
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
      </Layout>,
      404,
    );
  }

  const { order, items } = result;

  return c.html(
    <Layout title={`Order ${order.order_number}`}>
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
    </Layout>,
  );
});

export default checkout;
