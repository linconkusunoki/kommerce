import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getDb } from "../db/schema.ts";
import { SqliteAuthRepository } from "../repositories/AuthRepository.ts";
import type { AppEnv } from "../types/context.ts";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) return c.redirect("/admin/login");

  const authRepo = new SqliteAuthRepository(getDb());
  const session = authRepo.findSession(sessionId);
  if (!session) return c.redirect("/admin/login");

  c.set("adminUser", { id: session.id, username: session.username });
  await next();
});
