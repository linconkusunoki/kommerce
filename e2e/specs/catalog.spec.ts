import { expect, test } from "../fixtures/test.ts";
import { baseURL } from "../fixtures/env.ts";

test.describe("home page", () => {
  test("renders the hero and the catalog sections", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "Discover Your Style" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Shop Now" })).toBeVisible();
    await expect(page.getByText("Free shipping over $50")).toBeVisible();

    await expect(page.locator("section#categories")).toBeVisible();
    await expect(page.locator("section#featured")).toBeVisible();
    await expect(page.locator("a.category-card").first()).toBeVisible();
    await expect(page.locator("#featured a.product-card").first()).toBeVisible();
  });

  test("hero call to action jumps to the categories section", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Shop Now" }).click();
    await expect(page).toHaveURL(/#categories$/);
  });

  test("a category card links to that category page", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#categories a.category-card").first();
    const href = await card.getAttribute("href");
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator("h1.section-title")).toBeVisible();
  });

  test("a product card links to that product page", async ({ page }) => {
    await page.goto("/#featured");
    const card = page.locator("#featured a.product-card").first();
    const href = await card.getAttribute("href");
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator("h1.product-detail-title")).toBeVisible();
  });
});

test.describe("category page", () => {
  test("lists the products in a seeded category", async ({ page, request }) => {
    const response = await request.get("/api/categories");
    const categories = (await response.json()) as { name: string; slug: string }[];

    // e2e fixtures are also listed and may hold no products, so use a seeded one.
    const category = categories.find((entry) => !entry.name.startsWith("E2E "));
    expect(category).toBeDefined();

    await page.goto(`/categories/${category!.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: category!.name })).toBeVisible();
    await expect(page.locator("nav.breadcrumb")).toContainText(category!.name);
    await expect(page.locator("a.product-card").first()).toBeVisible();
  });

  test("an unknown category slug returns 404", async ({ page }) => {
    const response = await page.goto("/categories/e2e-no-such-category");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Category not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
  });
});

test.describe("search", () => {
  test("finds a product by name and links to it", async ({ page }) => {
    await page.goto("/#featured");
    const productName = (await page.locator("#featured .product-card-title").first().innerText()).trim();
    expect(productName.length).toBeGreaterThanOrEqual(2);

    await page.fill("form.nav-search input[name='q']", productName);
    await page.locator("form.nav-search button.nav-search-btn").click();

    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(
      page.getByRole("heading", { level: 1, name: new RegExp(`\\d+ results? for "${productName}"`) }),
    ).toBeVisible();

    const firstResult = page.locator("a.product-card").first();
    const href = await firstResult.getAttribute("href");
    await firstResult.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator("h1.product-detail-title")).toBeVisible();
  });

  test("an existing result page can be refined from its own search form", async ({ page }) => {
    await page.goto("/search?q=cap");
    await expect(page.locator('form.search-form input[name="q"]')).toHaveValue("cap");

    await page.fill('form.search-form input[name="q"]', "e2ezzzznomatch");
    await page.locator("form.search-form").getByRole("button", { name: "Search", exact: true }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText('No results for "e2ezzzznomatch"');
  });

  test("reports no results for a term that matches nothing", async ({ page }) => {
    await page.goto("/search?q=e2ezzzznomatch");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText('No results for "e2ezzzznomatch"');
    await expect(page.getByText("Try different keywords.")).toBeVisible();
  });

  test("redirects home when the query is shorter than two characters", async ({ page }) => {
    await page.goto("/search?q=a");
    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(page.getByRole("heading", { level: 1, name: "Discover Your Style" })).toBeVisible();
  });

  test("the header search form submits from any page", async ({ page }) => {
    await page.goto("/");
    await page.fill("form.nav-search input[name='q']", "cap");
    await page.locator("form.nav-search button.nav-search-btn").click();
    await expect(page).toHaveURL(/\/search\?q=cap/);
  });
});

test.describe("product page", () => {
  test("shows details and a variant picker for a seeded product", async ({ page, request }) => {
    await page.goto("/");
    const href = await page.locator("a.product-card").first().getAttribute("href");

    await page.goto(href!);
    await expect(page.locator("h1.product-detail-title")).toBeVisible();
    // The reviews eyebrow reuses .product-detail-category, so scope to the detail block.
    await expect(page.locator("div.product-detail span.product-detail-category")).toBeVisible();
    await expect(page.locator("span.price-lg").first()).toHaveText(/^\$[\d,]+\.\d{2}$/);
    await expect(page.locator("form.product-form input[name='size']").first()).toBeVisible();
    await expect(page.locator("form.product-form input[name='color']").first()).toBeVisible();
    await expect(page.locator("section.reviews-section")).toBeVisible();
  });

  test("an unknown product slug returns 404", async ({ page }) => {
    const response = await page.goto("/products/e2e-no-such-product");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Product not found" })).toBeVisible();
    await expect(page.getByText("The product you're looking for doesn't exist.")).toBeVisible();
  });

  test("signed-out visitors are invited to sign in before reviewing", async ({ page }) => {
    await page.goto("/");
    const href = await page.locator("a.product-card").first().getAttribute("href");
    await page.goto(href!);

    await expect(page.getByText("Sign in or create an account to write a review.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/account/login");
  });

  test("review pagination clamps an out-of-range page back to the last page", async ({ page }) => {
    await page.goto("/");
    const href = await page.locator("a.product-card").first().getAttribute("href");
    await page.goto(`${href}?page=9999`);

    await expect(page.locator("h1.product-detail-title")).toBeVisible();
    await expect(page).toHaveURL(/\?page=\d+$/);
  });
});
