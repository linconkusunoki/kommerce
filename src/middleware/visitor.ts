import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { getDb } from "../db/schema.ts";
import { PostgresVisitorRepository } from "../repositories/VisitorRepository.ts";
import type { AppEnv } from "../types/context.ts";

export const visitorSession = createMiddleware<AppEnv>(async (c, next) => {
  const visitorRepo = new PostgresVisitorRepository(getDb());
  let sessionId = getCookie(c, "visitor_id");

  if (sessionId) {
    const session = await visitorRepo.findSession(sessionId);
    if (session) {
      c.set("visitorId", session.id);
      await next();
      return;
    }
  }

  const { id, expiresAt: _expiresAt } = await visitorRepo.createSession();
  sessionId = id;

  setCookie(c, "visitor_id", sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  c.set("visitorId", sessionId);
  await next();
});
