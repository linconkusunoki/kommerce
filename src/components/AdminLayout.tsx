import type { FC, PropsWithChildren } from "hono/jsx";
import { Layout } from "./Layout.tsx";

type AdminLayoutProps = PropsWithChildren<{
  title?: string;
}>;

export const AdminLayout: FC<AdminLayoutProps> = ({ title, children }) => {
  return (
    <Layout title={title ? `Admin - ${title}` : "Admin"}>
      <div class="admin-wrapper">
        <aside class="admin-sidebar">
          <a href="/admin" class="admin-logo">Kommerce Admin</a>
          <nav class="admin-nav">
            <a href="/admin">Dashboard</a>
            <a href="/admin/orders">Orders</a>
            <a href="/admin/products">Products</a>
            <a href="/admin/categories">Categories</a>
          </nav>
          <div class="admin-sidebar-footer">
            <form method="POST" action="/admin/logout">
              <button type="submit" class="btn btn-outline btn-sm">Logout</button>
            </form>
          </div>
        </aside>
        <main class="admin-main">
          {title && <h1 class="admin-page-title">{title}</h1>}
          {children}
        </main>
      </div>
    </Layout>
  );
};
