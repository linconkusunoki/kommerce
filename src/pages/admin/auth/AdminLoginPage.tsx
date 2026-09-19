import { Layout } from "../../../components/Layout.tsx";

export function AdminLoginPage({ error }: { error?: string }) {
  return (
    <Layout title="Admin Login" styles={["/styles/pages/login.css"]}>
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
    </Layout>
  );
}
