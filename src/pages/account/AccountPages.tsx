import type { PropsWithChildren } from "hono/jsx";
import { Layout } from "../../components/Layout.tsx";
import { Header } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";
import type { Customer, CustomerReview, OrderSummary } from "../../types/index.ts";

type Active = "profile" | "reviews" | "orders";

function AccountNav({ active }: { active: Active }) {
  return (
    <nav class="account-nav" aria-label="Account navigation">
      <a class={active === "profile" ? "active" : ""} href="/account/profile">
        Profile
      </a>
      <a class={active === "reviews" ? "active" : ""} href="/account/reviews">
        Reviews
      </a>
      <a class={active === "orders" ? "active" : ""} href="/account/orders">
        Orders
      </a>
      <form method="post" action="/account/logout" class="account-nav-logout">
        <button type="submit">Log out</button>
      </form>
    </nav>
  );
}

function AccountDashboard({ active, children }: PropsWithChildren<{ active: Active }>) {
  return (
    <div class="account-dashboard">
      <AccountNav active={active} />
      <div class="account-dashboard-content">{children}</div>
    </div>
  );
}

function AccountPage({
  title,
  children,
  wide = false,
  dashboard = false,
}: PropsWithChildren<{ title: string; wide?: boolean; dashboard?: boolean }>) {
  return (
    <Layout title={title} styles={["/styles/pages/login.css"]}>
      <Header />
      <main class={dashboard ? "account-page" : "login-page"}>
        <div class={dashboard ? "account-card-dashboard" : `login-card ${wide ? "account-card-wide" : ""}`}>
          {children}
        </div>
      </main>
      <Footer />
    </Layout>
  );
}

export function CustomerLoginPage({ error }: { error?: string }) {
  return (
    <AccountPage title="Customer Login">
      <h1>Customer Login</h1>
      {error && <div class="alert alert-error">{error}</div>}
      <form method="post" action="/account/login">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required autofocus />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block">
          Login
        </button>
      </form>
      <a href="/account/register" class="login-back">
        Create an account
      </a>
    </AccountPage>
  );
}

export function CustomerRegisterPage({ error }: { error?: string }) {
  return (
    <AccountPage title="Create Account">
      <h1>Create Account</h1>
      {error && <div class="alert alert-error">{error}</div>}
      <form method="post" action="/account/register">
        <div class="form-group">
          <label for="display_name">Display name</label>
          <input type="text" id="display_name" name="display_name" maxlength={80} required autofocus />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" minlength={8} required />
        </div>
        <button type="submit" class="btn btn-primary btn-block">
          Create account
        </button>
      </form>
      <a href="/account/login" class="login-back">
        Already have an account?
      </a>
    </AccountPage>
  );
}

export function ProfilePage({ customer, error }: { customer: Customer; error?: string }) {
  return (
    <AccountPage title="Your Account" wide dashboard>
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
            <div class="form-group">
              <label for="display_name">Display name</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                maxlength={80}
                value={customer.display_name}
                required
              />
            </div>
            <button type="submit" class="btn btn-primary btn-block">
              Save name
            </button>
          </form>
        </section>
      </AccountDashboard>
    </AccountPage>
  );
}

export function ReviewsPage({ reviews }: { reviews: CustomerReview[] }) {
  return (
    <AccountPage title="Your Reviews" wide dashboard>
      <AccountDashboard active="reviews">
        <section class="profile-section profile-details" aria-labelledby="profile-reviews-heading">
          <div class="profile-header">
            <div>
              <span class="profile-eyebrow">Account</span>
              <h1 id="profile-reviews-heading">Your Reviews</h1>
            </div>
            <span class="profile-email">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
          {reviews.length > 0 ? (
            <div class="profile-review-list">
              {reviews.map((review) => (
                <article class="profile-review">
                  <div class="profile-review-header">
                    <a class="profile-review-product" href={`/products/${review.product_slug}`}>
                      {review.product_name}
                    </a>
                    <span class={review.visible ? "review-status" : "review-status review-status-hidden"}>
                      {review.visible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <div class="profile-review-rating">
                    {"\u2605".repeat(review.rating)}
                    {"\u2606".repeat(5 - review.rating)} <span>{review.rating} / 5</span>
                  </div>
                  {review.text && <p>{review.text}</p>}
                  <time datetime={review.updated_at}>Updated {review.updated_at}</time>
                </article>
              ))}
            </div>
          ) : (
            <p class="profile-reviews-empty">You have not written any reviews yet.</p>
          )}
        </section>
      </AccountDashboard>
    </AccountPage>
  );
}

export function OrdersPage({ orders }: { orders: OrderSummary[] }) {
  return (
    <AccountPage title="Your Orders" wide dashboard>
      <AccountDashboard active="orders">
        <section class="profile-section profile-details" aria-labelledby="orders-heading">
          <div class="profile-header">
            <div>
              <span class="profile-eyebrow">Account</span>
              <h1 id="orders-heading">Your Orders</h1>
            </div>
            <span class="profile-email">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </div>
          {orders.length > 0 ? (
            <div class="account-order-list">
              {orders.map((order) => (
                <a class="account-order" href={`/order/${order.order_number}`}>
                  <div>
                    <strong>{order.order_number}</strong>
                    <span>
                      {order.item_count} {order.item_count === 1 ? "item" : "items"}
                    </span>
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
      </AccountDashboard>
    </AccountPage>
  );
}
