import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { AdminLoginPage } from "../../pages/admin/auth/AdminLoginPage.tsx";
import type { Services } from "../../lib/container.ts";
import type { AppEnv } from "../../types/context.ts";

export function createAdminAuth(services: Services) {
  const auth = new Hono<AppEnv>();

  auth.get("/login", (c) => {
    const error = c.req.query("error");
    return c.html(<AdminLoginPage error={error} />);
  });

  auth.post("/login", async (c) => {
    const body = await c.req.parseBody();
    const username = body["username"] as string;
    const password = body["password"] as string;

    const sessionId = await services.adminAuthService.login(username, password);
    if (!sessionId) return c.redirect("/admin/login?error=Invalid+credentials");

    setCookie(c, "session_id", sessionId, {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return c.redirect("/admin");
  });

  auth.post("/logout", async (c) => {
    const sessionId = getCookie(c, "session_id");
    if (sessionId) {
      await services.adminAuthService.logout(sessionId);
      deleteCookie(c, "session_id", { path: "/" });
    }
    return c.redirect("/admin/login");
  });

  return auth;
}
