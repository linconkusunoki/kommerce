import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { AdminAuthService } from "../services/AdminAuthService.ts";
import type { AppEnv } from "../types/context.ts";

export function requireAdminAuth(auth: AdminAuthService) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const sessionId = getCookie(c, "session_id");
    if (!sessionId) return c.redirect("/admin/login");

    const session = auth.getSession(sessionId);
    if (!session) return c.redirect("/admin/login");

    c.set("adminUser", { id: session.id, username: session.username });
    await next();
  });
}
