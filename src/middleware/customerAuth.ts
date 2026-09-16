import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { getDb } from "../db/schema.ts";
import { SqliteAuthRepository } from "../repositories/AuthRepository.ts";
import type { AppEnv } from "../types/context.ts";

export function getAuthenticatedCustomer(c: Context<AppEnv>) {
  const sessionId = getCookie(c, "customer_session_id");
  if (!sessionId) return null;

  const session = new SqliteAuthRepository(getDb()).findCustomerSession(sessionId);
  if (!session) return null;

  return { id: session.id, email: session.email, display_name: session.display_name };
}

export const requireCustomerAuth = createMiddleware<AppEnv>(async (c, next) => {
  const customer = getAuthenticatedCustomer(c);
  if (!customer) return c.redirect("/account/login");

  c.set("customer", customer);
  await next();
});
