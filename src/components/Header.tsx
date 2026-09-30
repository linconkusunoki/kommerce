import type { FC } from "hono/jsx";
import type { Category } from "../types/index.ts";
import { Logo } from "./Logo.tsx";

type HeaderProps = {
  cartCount?: number;
  categories?: Pick<Category, "name" | "slug">[];
};

export const Header: FC<HeaderProps> = ({ cartCount = 0, categories = [] }) => {
  return (
    <header class="header">
      <div class="container header-inner">
        <Logo href="/" />
        <div class="mobile-actions">
          <button
            type="button"
            class="header-action"
            data-panel-toggle="menu-panel"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="menu-panel"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            class="header-action"
            data-panel-toggle="categories-panel"
            aria-label="Open categories"
            aria-expanded="false"
            aria-controls="categories-panel"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <rect x="14" y="14" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            class="header-action"
            data-panel-toggle="search-panel"
            aria-label="Open search"
            aria-expanded="false"
            aria-controls="search-panel"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16" y1="16" x2="21" y2="21" />
            </svg>
          </button>
          <a href="/cart" class="nav-cart mobile-cart" aria-label="View cart">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span class="cart-badge" style={cartCount > 0 ? "" : "display:none"}>
              {cartCount}
            </span>
          </a>
        </div>
        <nav id="site-nav" class="nav" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/#categories">Categories</a>
          <a href="/#featured">Featured</a>
          <a href="/account/profile">Account</a>
          <form method="get" action="/search" class="nav-search">
            <input type="text" name="q" placeholder="Search..." class="nav-search-input" />
            <button type="submit" class="nav-search-btn" aria-label="Search">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
          <a href="/cart" class="nav-cart" aria-label="View cart">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span id="cart-badge" class="cart-badge" style={cartCount > 0 ? "" : "display:none"}>
              {cartCount}
            </span>
          </a>
        </nav>
      </div>
      <div id="search-panel" class="mobile-panel" hidden>
        <form method="get" action="/search" class="mobile-search-form">
          <label for="mobile-search">Search products</label>
          <input id="mobile-search" type="search" name="q" placeholder="Search products..." autocomplete="off" />
          <button type="button" class="panel-close" aria-label="Close search">
            &times;
          </button>
        </form>
      </div>
      <div id="categories-panel" class="mobile-panel" hidden>
        <nav class="panel-links" aria-label="Categories">
          {categories.length > 0 ? (
            categories.map((category) => <a href={`/categories/${category.slug}`}>{category.name}</a>)
          ) : (
            <span class="panel-loading">Loading categories...</span>
          )}
        </nav>
      </div>
      <div id="menu-panel" class="mobile-panel" hidden>
        <nav class="panel-links" aria-label="Menu">
          <a href="/">Home</a>
          <a href="/#featured">Featured</a>
          <a href="/account/profile">Account</a>
        </nav>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var header = document.querySelector('.header');
              if (!header) return;

              var toggles = Array.from(header.querySelectorAll('[data-panel-toggle]'));
              var panels = Array.from(header.querySelectorAll('.mobile-panel'));
              var categoriesPanel = document.getElementById('categories-panel');
              var categoriesLoaded = ${categories.length > 0 ? "true" : "false"};

              function closePanels(returnFocus) {
                panels.forEach(function (panel) {
                  panel.hidden = true;
                  panel.classList.remove('panel-open');
                });
                toggles.forEach(function (toggle) {
                  toggle.setAttribute('aria-expanded', 'false');
                });
                if (returnFocus) returnFocus.focus();
              }

              function openPanel(panelId, toggle) {
                var panel = document.getElementById(panelId);
                if (!panel) return;
                var alreadyOpen = !panel.hidden;
                closePanels(false);
                if (alreadyOpen) return;
                panel.hidden = false;
                panel.classList.add('panel-open');
                toggle.setAttribute('aria-expanded', 'true');
                var focusTarget = panel.querySelector('input, a, button');
                if (focusTarget) focusTarget.focus();
              }

              toggles.forEach(function (toggle) {
                toggle.addEventListener('click', function () {
                  var panelId = toggle.getAttribute('data-panel-toggle');
                  if (panelId === 'categories-panel' && !categoriesLoaded) {
                    fetch('/api/categories')
                      .then(function (response) { return response.json(); })
                      .then(function (items) {
                        var linkContainer = categoriesPanel.querySelector('.panel-links');
                        linkContainer.textContent = '';
                        if (items.length === 0) {
                          var empty = document.createElement('span');
                          empty.className = 'panel-loading';
                          empty.textContent = 'No categories available.';
                          linkContainer.appendChild(empty);
                        } else {
                          items.forEach(function (category) {
                            var link = document.createElement('a');
                            link.href = '/categories/' + encodeURIComponent(category.slug);
                            link.textContent = category.name;
                            link.addEventListener('click', function () { closePanels(false); });
                            linkContainer.appendChild(link);
                          });
                        }
                        var firstLink = linkContainer.querySelector('a');
                        if (firstLink && !categoriesPanel.hidden) firstLink.focus();
                        categoriesLoaded = true;
                      });
                  }
                  openPanel(panelId, toggle);
                });
              });

              header.querySelectorAll('.panel-close').forEach(function (close) {
                close.addEventListener('click', function () {
                  closePanels(document.querySelector('[data-panel-toggle="search-panel"]'));
                });
              });

              header.querySelectorAll('.mobile-panel a').forEach(function (link) {
                link.addEventListener('click', function () { closePanels(false); });
              });

              header.querySelectorAll('form').forEach(function (form) {
                form.addEventListener('submit', function (event) {
                  var input = form.querySelector('input[name="q"]');
                  if (!input.value.trim()) event.preventDefault();
                });
              });

              document.addEventListener('click', function (event) {
                if (!header.contains(event.target)) closePanels(false);
              });

              document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') closePanels(false);
              });

              var lastScrollY = window.scrollY;
              window.addEventListener('scroll', function () {
                var currentScrollY = window.scrollY;
                var scrollingDown = currentScrollY > lastScrollY;
                if (scrollingDown) {
                  closePanels(false);
                }
                if (window.matchMedia('(max-width: 768px)').matches && scrollingDown && currentScrollY > 80) {
                  header.classList.add('header-hidden');
                } else if (currentScrollY <= 20 || !scrollingDown) {
                  header.classList.remove('header-hidden');
                }
                lastScrollY = currentScrollY;
              }, { passive: true });
            })();
          `,
        }}
      />
    </header>
  );
};
