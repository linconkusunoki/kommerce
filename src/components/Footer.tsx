import type { FC } from "hono/jsx";
import { Logo } from "./Logo.tsx";

export const Footer: FC = () => {
  return (
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <Logo />
          <p>Your one-stop clothing store.</p>
        </div>
        <div class="footer-links">
          <h2>Shop</h2>
          <a href="/#categories">Categories</a>
          <a href="/#featured">Featured</a>
        </div>
        <div class="footer-links">
          <h2>Account</h2>
          <a href="/admin/login">Admin</a>
        </div>
      </div>
      <div class="container footer-bottom">
        <p>&copy; {new Date().getFullYear()} Kommerce. All rights reserved.</p>
      </div>
    </footer>
  );
};
