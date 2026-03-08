import type { FC } from "hono/jsx";

type HeaderProps = {
  cartCount?: number;
};

export const Header: FC<HeaderProps> = ({ cartCount = 0 }) => {
  return (
    <header class="header">
      <div class="container header-inner">
        <a href="/" class="logo">Kommerce</a>
        <nav class="nav">
          <a href="/">Home</a>
          <a href="/#categories">Categories</a>
          <a href="/#featured">Featured</a>
          <form method="get" action="/search" class="nav-search">
            <input type="text" name="q" placeholder="Search..." class="nav-search-input" />
            <button type="submit" class="nav-search-btn" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
          <a href="/cart" class="nav-cart" aria-label="View cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span id="cart-badge" class="cart-badge" style={cartCount > 0 ? "" : "display:none"}>{cartCount}</span>
          </a>
        </nav>
      </div>
    </header>
  );
};
