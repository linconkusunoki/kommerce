import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { getDb } from "../db/schema.ts";

export const visitorSession = createMiddleware(async (c, next) => {
  const db = getDb();
  let sessionId = getCookie(c, "visitor_id");

  if (sessionId) {
    const session = db
      .query("SELECT id FROM visitor_sessions WHERE id = ? AND expires_at > datetime('now')")
      .get(sessionId) as { id: string } | null;

    if (session) {
      c.set("visitorId", session.id);
      await next();
      return;
    }
  }

  // Create new visitor session (30 days)
  sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.query("INSERT INTO visitor_sessions (id, expires_at) VALUES (?, ?)").run(sessionId, expiresAt);

  setCookie(c, "visitor_id", sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  c.set("visitorId", sessionId);
  await next();
});

export function getCartCount(visitorId: string): number {
  const db = getDb();
  const result = db
    .query("SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE session_id = ?")
    .get(visitorId) as { count: number };
  return result.count;
}
