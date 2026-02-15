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
      </body>
    </html>
  );
};
