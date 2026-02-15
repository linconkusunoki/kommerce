import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { getDb } from "../../db/schema.ts";
import { Layout } from "../../components/Layout.tsx";

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

  const db = getDb();
  const user = db.query("SELECT * FROM admin_users WHERE username = ?").get(username) as {
    id: number;
    username: string;
    password_hash: string;
  } | null;

  if (!user || !(await Bun.password.verify(password, user.password_hash))) {
    return c.redirect("/admin/login?error=Invalid+credentials");
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare("INSERT INTO sessions (id, admin_user_id, expires_at) VALUES (?, ?, ?)").run(
    sessionId,
    user.id,
    expiresAt,
  );

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
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    deleteCookie(c, "session_id", { path: "/" });
  }
  return c.redirect("/admin/login");
});

export default auth;
