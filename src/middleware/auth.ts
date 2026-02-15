import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getDb } from "../db/schema.ts";

export const requireAuth = createMiddleware(async (c, next) => {
  const sessionId = getCookie(c, "session_id");

  if (!sessionId) {
    return c.redirect("/admin/login");
  }

  const db = getDb();
  const session = db.query(
    "SELECT s.*, a.username FROM sessions s JOIN admin_users a ON s.admin_user_id = a.id WHERE s.id = ? AND s.expires_at > datetime('now')"
  ).get(sessionId) as { id: string; admin_user_id: number; username: string; expires_at: string } | null;

  if (!session) {
    return c.redirect("/admin/login");
  }

  c.set("adminUser", { id: session.admin_user_id, username: session.username });
  await next();
});
