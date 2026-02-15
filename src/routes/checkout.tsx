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
  product_name: string;
  product_slug: string;
  product_price: number;
  product_image: string | null;
};

function generateOrderNumber(): string {
  const prefix = "KOM";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const checkout = new Hono();

checkout.get("/checkout", (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId" as never) as string;
  const cartCount = getCartCount(visitorId);
  const error = c.req.query("error");

  const items = db
    .query(
      `
    SELECT ci.id, ci.variant_id, ci.quantity,
           pv.size, pv.color,
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

  if (items.length === 0) {
    return c.redirect("/cart");
  }

  const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);

  return c.html(
    <Layout title="Checkout">
      <Header cartCount={cartCount} />
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
  const db = getDb();
  const visitorId = c.get("visitorId" as never) as string;
  const body = await c.req.parseBody();

  const email = (body.email as string)?.trim();
  const name = (body.name as string)?.trim();
  const address = (body.address as string)?.trim();
  const city = (body.city as string)?.trim();
  const postalCode = (body.postal_code as string)?.trim();
  const country = (body.country as string)?.trim() || "";
  const phone = (body.phone as string)?.trim() || "";
  const notes = (body.notes as string)?.trim() || "";

  if (!email || !name || !address || !city || !postalCode) {
    return c.redirect("/checkout?error=Please fill in all required fields");
  }

  // Get cart items
  const items = db
    .query(
      `
    SELECT ci.quantity,
           pv.size, pv.color,
           p.name as product_name, p.slug as product_slug,
           p.price as product_price
    FROM cart_items ci
    JOIN product_variants pv ON ci.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE ci.session_id = ?
  `,
    )
    .all(visitorId) as {
    quantity: number;
    size: string;
    color: string;
    product_name: string;
    product_slug: string;
    product_price: number;
  }[];

  if (items.length === 0) {
    return c.redirect("/cart");
  }

  const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
  const orderNumber = generateOrderNumber();

  // Create order
  const result = db
    .query(
      `INSERT INTO orders (order_number, email, name, address, city, postal_code, country, phone, notes, subtotal, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(orderNumber, email, name, address, city, postalCode, country, phone, notes, subtotal, subtotal);

  const orderId = Number(result.lastInsertRowid);

  // Create order items
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_name, product_slug, variant_size, variant_color, price, quantity, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const item of items) {
    insertItem.run(
      orderId,
      item.product_name,
      item.product_slug,
      item.size,
      item.color,
      item.product_price,
      item.quantity,
      item.product_price * item.quantity,
    );
  }

  // Clear cart
  db.query("DELETE FROM cart_items WHERE session_id = ?").run(visitorId);

  return c.redirect(`/order/${orderNumber}`);
});

checkout.get("/order/:orderNumber", (c) => {
  const db = getDb();
  const visitorId = c.get("visitorId" as never) as string;
  const cartCount = getCartCount(visitorId);
  const orderNumber = c.req.param("orderNumber");

  const order = db.query("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) as {
    id: number;
    order_number: string;
    status: string;
    email: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
    notes: string;
    subtotal: number;
    total: number;
    created_at: string;
  } | null;

  if (!order) {
    return c.html(
      <Layout title="Order Not Found">
        <Header cartCount={cartCount} />
        <main class="section">
          <div class="container" style="text-align: center; padding: 4rem 0;">
            <h1>Order not found</h1>
            <p style="color: var(--color-text-muted); margin: 1rem 0;">
              We couldn't find that order.
            </p>
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

  const items = db.query("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as {
    product_name: string;
    product_slug: string;
    variant_size: string;
    variant_color: string;
    price: number;
    quantity: number;
    total: number;
  }[];

  return c.html(
    <Layout title={`Order ${order.order_number}`}>
      <Header cartCount={cartCount} />
      <main class="section">
        <div class="container">
          <div class="order-confirmation">
            <div class="order-confirmation-header">
              <div class="order-check">&#10003;</div>
              <h1>Order Confirmed!</h1>
              <p>
                Thank you, {order.name}. Your order <strong>{order.order_number}</strong> has been placed.
              </p>
              <p class="order-email-note">A confirmation would be sent to {order.email}</p>
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
