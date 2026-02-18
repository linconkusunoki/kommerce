import type { FC, PropsWithChildren } from "hono/jsx";

type LayoutProps = PropsWithChildren<{
  title?: string;
}>;

export const Layout: FC<LayoutProps> = ({ title, children }) => {
  const pageTitle = title ? `${title} | Kommerce` : "Kommerce - Clothing Store";

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <link rel="stylesheet" href="/styles/main.css" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          function updateCartBadge() {
            fetch('/api/cart/count', { cache: 'no-store' })
              .then(r => r.json())
              .then(({ count }) => {
                const badge = document.getElementById('cart-badge');
                if (!badge) return;
                if (count > 0) {
                  badge.textContent = count;
                  badge.style.display = '';
                } else {
                  badge.style.display = 'none';
                }
              });
          }
          updateCartBadge();
          window.addEventListener('pageshow', (e) => { if (e.persisted) updateCartBadge(); });
        `}} />
      </body>
    </html>
  );
};
