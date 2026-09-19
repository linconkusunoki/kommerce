import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
  CustomerLoginPage,
  CustomerRegisterPage,
  OrdersPage,
  ProfilePage,
  ReviewsPage,
} from "../pages/account/AccountPages.tsx";
import { requireCustomerAuth } from "../middleware/customerAuth.ts";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

const cookieOptions = { httpOnly: true, sameSite: "Lax" as const, path: "/", maxAge: 7 * 24 * 60 * 60 };

export function createAccount(services: Services) {
  const account = new Hono<AppEnv>();
  account.get("/account", requireCustomerAuth, (c) => c.redirect("/account/profile"));

  account.get("/account/login", (c) => {
    c.header("Cache-Control", "private, no-store");
    return c.html(<CustomerLoginPage error={c.req.query("error")} />);
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
    return c.html(<CustomerRegisterPage error={c.req.query("error")} />);
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
    return c.html(<ProfilePage customer={c.get("customer")} error={c.req.query("error")} />);
  });
  account.get("/account/reviews", requireCustomerAuth, (c) => {
    c.header("Cache-Control", "private, no-store");
    return c.html(<ReviewsPage reviews={services.reviewService.getCustomerReviews(c.get("customer").id)} />);
  });
  account.get("/account/orders", requireCustomerAuth, (c) => {
    c.header("Cache-Control", "private, no-store");
    const customer = c.get("customer");
    return c.html(<OrdersPage orders={services.orderService.getCustomerOrders(customer.id, customer.email)} />);
  });

  account.post("/account/profile", requireCustomerAuth, async (c) => {
    const body = await c.req.parseBody();
    if (!services.authService.updateCustomerDisplayName(c.get("customer").id, String(body.display_name ?? "")))
      return c.redirect("/account/profile?error=Display+name+must+be+1+to+80+characters");
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
