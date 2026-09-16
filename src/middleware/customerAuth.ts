import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getDb } from "../db/schema.ts";
import { SqliteAuthRepository } from "../repositories/AuthRepository.ts";
import type { AppEnv } from "../types/context.ts";

export const requireCustomerAuth = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = getCookie(c, "customer_session_id");
  if (!sessionId) return c.redirect("/account/login");

  const session = new SqliteAuthRepository(getDb()).findCustomerSession(sessionId);
  if (!session) return c.redirect("/account/login");

  c.set("customer", { id: session.id, email: session.email, display_name: session.display_name });
  await next();
});
