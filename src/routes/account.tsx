import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { requireCustomerAuth } from "../middleware/customerAuth.ts";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

const cookieOptions = { httpOnly: true, sameSite: "Lax" as const, path: "/", maxAge: 7 * 24 * 60 * 60 };

function AccountNav({ active }: { active: "profile" | "reviews" | "orders" }) {
  return (
    <nav class="account-nav" aria-label="Account navigation">
      <a class={active === "profile" ? "active" : ""} href="/account/profile">Profile</a>
      <a class={active === "reviews" ? "active" : ""} href="/account/reviews">Reviews</a>
      <a class={active === "orders" ? "active" : ""} href="/account/orders">Orders</a>
      <form method="post" action="/account/logout" class="account-nav-logout">
        <button type="submit">Log out</button>
      </form>
    </nav>
  );
}

function AccountDashboard({ active, children }: { active: "profile" | "reviews" | "orders"; children: any }) {
  return (
    <div class="account-dashboard">
      <AccountNav active={active} />
      <div class="account-dashboard-content">{children}</div>
    </div>
  );
}

function accountPage(title: string, children: any, wide = false, dashboard = false) {
  return (
    <Layout title={title} styles={["/styles/pages/login.css"]}>
      <Header />
      <main class={dashboard ? "account-page" : "login-page"}>
        <div class={dashboard ? "account-card-dashboard" : `login-card ${wide ? "account-card-wide" : ""}`}>{children}</div>
      </main>
      <Footer />
    </Layout>
  );
}

export function createAccount(services: Services) {
  const account = new Hono<AppEnv>();

  account.get("/account", requireCustomerAuth, (c) => c.redirect("/account/profile"));

  account.get("/account/login", (c) => {
    c.header("Cache-Control", "private, no-store");
    const error = c.req.query("error");
    return c.html(accountPage("Customer Login", <>
      <h1>Customer Login</h1>
      {error && <div class="alert alert-error">{error}</div>}
      <form method="post" action="/account/login">
        <div class="form-group"><label for="email">Email</label><input type="email" id="email" name="email" required autofocus /></div>
        <div class="form-group"><label for="password">Password</label><input type="password" id="password" name="password" required /></div>
        <button type="submit" class="btn btn-primary btn-block">Login</button>
      </form>
      <a href="/account/register" class="login-back">Create an account</a>
    </>));
  });

  account.post("/account/login", async (c) => {
    const body = await c.req.parseBody();
    const sessionId = await services.authService.loginCustomer(String(body.email ?? ""), String(body.password ?? ""));
    if (!sessionId) return c.redirect("/account/login?error=Invalid+credentials");
    setCookie(c, "customer_session_id", sessionId, cookieOptions);
    return c.redirect("/account/profile");
  });

  account.get("/account/register", (c) => {
    c.header("Cache-Control", "private, no-store");
    const error = c.req.query("error");
    return c.html(accountPage("Create Account", <>
      <h1>Create Account</h1>
      {error && <div class="alert alert-error">{error}</div>}
      <form method="post" action="/account/register">
        <div class="form-group"><label for="display_name">Display name</label><input type="text" id="display_name" name="display_name" maxlength="80" required autofocus /></div>
        <div class="form-group"><label for="email">Email</label><input type="email" id="email" name="email" required /></div>
        <div class="form-group"><label for="password">Password</label><input type="password" id="password" name="password" minlength="8" required /></div>
        <button type="submit" class="btn btn-primary btn-block">Create account</button>
      </form>
      <a href="/account/login" class="login-back">Already have an account?</a>
    </>));
  });

  account.post("/account/register", async (c) => {
    const body = await c.req.parseBody();
    const sessionId = await services.authService.registerCustomer(
      String(body.email ?? ""),
      String(body.password ?? ""),
      String(body.display_name ?? ""),
    );
    if (!sessionId) return c.redirect("/account/register?error=Invalid+or+duplicate+account+details");
    setCookie(c, "customer_session_id", sessionId, cookieOptions);
    return c.redirect("/account/profile");
  });

  account.use("/account/profile", requireCustomerAuth);
  account.get("/account/profile", (c) => {
    c.header("Cache-Control", "private, no-store");
    const customer = c.get("customer");
    const error = c.req.query("error");
    return c.html(accountPage("Your Account", <>
      <AccountDashboard active="profile">
        <section class="profile-section profile-details" aria-labelledby="profile-details-heading">
          <div class="profile-header">
            <div>
              <span class="profile-eyebrow">Account</span>
              <h1 id="profile-details-heading">Your Account</h1>
            </div>
            <span class="profile-email">{customer.email}</span>
          </div>
          {error && <div class="alert alert-error">{error}</div>}
          <form method="post" action="/account/profile">
            <div class="form-group"><label for="display_name">Display name</label><input type="text" id="display_name" name="display_name" maxlength="80" value={customer.display_name} required /></div>
            <button type="submit" class="btn btn-primary btn-block">Save name</button>
          </form>
        </section>
      </AccountDashboard>
    </>, true, true));
  });

  account.get("/account/reviews", requireCustomerAuth, (c) => {
    c.header("Cache-Control", "private, no-store");
    const customerReviews = services.reviewService.getCustomerReviews(c.get("customer").id);
    return c.html(accountPage("Your Reviews", <AccountDashboard active="reviews">
      <section class="profile-section profile-details" aria-labelledby="profile-reviews-heading">
        <div class="profile-header">
          <div>
            <span class="profile-eyebrow">Account</span>
            <h1 id="profile-reviews-heading">Your Reviews</h1>
          </div>
          <span class="profile-email">{customerReviews.length} {customerReviews.length === 1 ? "review" : "reviews"}</span>
        </div>
        {customerReviews.length > 0 ? (
          <div class="profile-review-list">
            {customerReviews.map((review) => (
              <article class="profile-review">
                <div class="profile-review-header">
                  <a class="profile-review-product" href={`/products/${review.product_slug}`}>{review.product_name}</a>
                  <span class={review.visible ? "review-status" : "review-status review-status-hidden"}>{review.visible ? "Visible" : "Hidden"}</span>
                </div>
                <div class="profile-review-rating">{"\u2605".repeat(review.rating)}{"\u2606".repeat(5 - review.rating)} <span>{review.rating} / 5</span></div>
                {review.text && <p>{review.text}</p>}
                <time datetime={review.updated_at}>Updated {review.updated_at}</time>
              </article>
            ))}
          </div>
        ) : (
          <p class="profile-reviews-empty">You have not written any reviews yet.</p>
        )}
      </section>
    </AccountDashboard>, true, true));
  });

  account.get("/account/orders", requireCustomerAuth, (c) => {
    c.header("Cache-Control", "private, no-store");
    const customer = c.get("customer");
    const orders = services.orderService.getCustomerOrders(customer.email);
    return c.html(accountPage("Your Orders", <AccountDashboard active="orders">
      <section class="profile-section profile-details" aria-labelledby="orders-heading">
        <div class="profile-header">
          <div>
            <span class="profile-eyebrow">Account</span>
            <h1 id="orders-heading">Your Orders</h1>
          </div>
          <span class="profile-email">{orders.length} {orders.length === 1 ? "order" : "orders"}</span>
        </div>
        {orders.length > 0 ? (
          <div class="account-order-list">
            {orders.map((order) => (
              <a class="account-order" href={`/order/${order.order_number}`}>
                <div>
                  <strong>{order.order_number}</strong>
                  <span>{order.item_count} {order.item_count === 1 ? "item" : "items"}</span>
                </div>
                <div class="account-order-meta">
                  <strong>${order.total.toFixed(2)}</strong>
                  <span>{order.status}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p class="profile-reviews-empty">You have not placed any orders yet.</p>
        )}
      </section>
    </AccountDashboard>, true, true));
  });

  account.post("/account/profile", requireCustomerAuth, async (c) => {
    const body = await c.req.parseBody();
    const customer = c.get("customer");
    if (!services.authService.updateCustomerDisplayName(customer.id, String(body.display_name ?? ""))) {
      return c.redirect("/account/profile?error=Display+name+must+be+1+to+80+characters");
    }
    return c.redirect("/account/profile");
  });

  account.post("/account/logout", (c) => {
    const sessionId = getCookie(c, "customer_session_id");
    if (sessionId) {
      services.authService.logoutCustomer(sessionId);
      deleteCookie(c, "customer_session_id", { path: "/" });
    }
    return c.redirect("/account/login");
  });

  return account;
}
