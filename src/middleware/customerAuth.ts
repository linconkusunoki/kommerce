import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import type { CustomerAuthService } from "../services/CustomerAuthService.ts";
import type { AppEnv } from "../types/context.ts";

export function getAuthenticatedCustomer(c: Context<AppEnv>, auth: CustomerAuthService) {
  const sessionId = getCookie(c, "customer_session_id");
  if (!sessionId) return null;

  const session = auth.getSession(sessionId);
  if (!session) return null;

  return { id: session.id, email: session.email, display_name: session.display_name };
}

export function requireCustomerAuth(auth: CustomerAuthService) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const customer = getAuthenticatedCustomer(c, auth);
    if (!customer) return c.redirect("/account/login");

    c.set("customer", customer);
    await next();
  });
}
