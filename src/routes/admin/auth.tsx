import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { getDb } from "../../db/schema.ts";
import { Layout } from "../../components/Layout.tsx";
import { AuthService } from "../../services/AuthService.ts";
import { SqliteAuthRepository } from "../../repositories/AuthRepository.ts";

const authService = new AuthService(new SqliteAuthRepository(getDb()));

const auth = new Hono();

auth.get("/login", (c) => {
  const error = c.req.query("error");

  return c.html(
    <Layout title="Admin Login">
      <div class="login-page">
        <div class="login-card">
          <h1>Admin Login</h1>
          {error && <div class="alert alert-error">{error}</div>}
          <form method="post" action="/admin/login">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" required autofocus />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required />
            </div>
            <button type="submit" class="btn btn-primary btn-block">
              Login
            </button>
          </form>
          <a href="/" class="login-back">
            &larr; Back to store
          </a>
        </div>
      </div>
    </Layout>,
  );
});

auth.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const username = body["username"] as string;
  const password = body["password"] as string;

  const sessionId = await authService.login(username, password);
  if (!sessionId) return c.redirect("/admin/login?error=Invalid+credentials");

  setCookie(c, "session_id", sessionId, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return c.redirect("/admin");
});

auth.post("/logout", (c) => {
  const sessionId = getCookie(c, "session_id");
  if (sessionId) {
    authService.logout(sessionId);
    deleteCookie(c, "session_id", { path: "/" });
  }
  return c.redirect("/admin/login");
});

export default auth;
