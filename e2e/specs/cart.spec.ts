import { expect, test } from "../fixtures/test.ts";
import { addToCart, firstProductSlug } from "../fixtures/flows.ts";
import { baseURL } from "../fixtures/env.ts";

test.describe("cart", () => {
  test("starts empty for a new visitor", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByRole("heading", { level: 1, name: "Your Cart" })).toBeVisible();
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
    await expect(page.locator("div.cart-empty").getByRole("link", { name: "Continue Shopping" })).toBeVisible();
  });

  test("adding a product shows the item and updates the header count", async ({ page }) => {
    const slug = await firstProductSlug(page);
    await addToCart(page, slug);

    await page.goto("/cart");
    await expect(page.locator("div.cart-item")).toHaveCount(1);
    await expect(page.locator("div.cart-summary-row", { hasText: "Subtotal" })).toContainText("(1 items)");
    await expect(page.locator("div.cart-summary-row.cart-summary-total")).toContainText("Total");
  });

  test("the header cart badge reflects the number of items", async ({ page }) => {
    const slug = await firstProductSlug(page, { minStock: 2 });
    await addToCart(page, slug, { quantity: "2" });

    // The badge is hydrated by an inline script that fetches /api/cart/count.
    await expect(page.locator("#cart-badge")).toHaveText("2");
    await expect(page.locator("nav#site-nav a.nav-cart")).toHaveAttribute("href", "/cart");
  });

  test("quantities can be changed from the cart page", async ({ page }) => {
    const slug = await firstProductSlug(page, { minStock: 3 });
    await addToCart(page, slug);

    await page.goto("/cart");
    // The select auto-submits its form on change.
    await page.locator("form.cart-qty-form select[name='quantity']").selectOption("3");

    await expect(page.locator("div.cart-summary-row", { hasText: "Subtotal" })).toContainText("(3 items)");
    await expect(page.locator("div.cart-item")).toHaveCount(1);
  });

  test("items can be removed", async ({ page }) => {
    const slug = await firstProductSlug(page);
    await addToCart(page, slug);

    await page.goto("/cart");
    await page.getByRole("button", { name: "Remove" }).click();

    await expect(page.getByText("Your cart is empty.")).toBeVisible();
  });

  test("several line items of one variant can coexist and the totals add up", async ({ page }) => {
    const slug = await firstProductSlug(page, { minStock: 3 });

    await addToCart(page, slug);
    await addToCart(page, slug, { quantity: "2" });

    await page.goto("/cart");
    const unitPrice = (await page.locator("div.cart-item").first().locator("p.cart-item-price").innerText()).trim();
    const lineTotal = (await page.locator("div.cart-item").first().locator("div.cart-item-total").innerText()).trim();

    const unit = Number(unitPrice.replace(/[$,]/g, ""));
    expect(lineTotal.replace(/[$,]/g, "")).toBe((unit * 3).toFixed(2));

    await expect(page.locator("div.cart-summary-row", { hasText: "Subtotal" })).toContainText("(3 items)");
    await expect(page.locator("div.cart-summary-row.cart-summary-total")).toContainText(
      (unit * 3).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    );
  });

  test("adding the same variant twice merges into one line", async ({ page }) => {
    const slug = await firstProductSlug(page, { minStock: 2 });

    await addToCart(page, slug);
    await addToCart(page, slug);

    await page.goto("/cart");
    await expect(page.locator("div.cart-item")).toHaveCount(1);
    await expect(page.locator("div.cart-summary-row", { hasText: "Subtotal" })).toContainText("(2 items)");
  });

  test("a cart persists across page loads for the same visitor", async ({ page }) => {
    const slug = await firstProductSlug(page);
    await addToCart(page, slug);

    await page.goto("/");
    await expect(page.locator("#cart-badge")).toHaveText("1");
    await page.goto("/cart");
    await expect(page.locator("div.cart-item")).toHaveCount(1);
  });

  test("checkout is unreachable while the cart is empty", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
  });

  test("a variant that does not exist falls back to the home page", async ({ request }) => {
    // Same-origin header satisfies the CSRF middleware for this form post.
    const response = await request.post("/cart/add", {
      headers: { "sec-fetch-site": "same-origin", origin: baseURL },
      form: { product_id: "999999", size: "M", color: "Black", quantity: "1" },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("/");
  });

  test("cart state is scoped to the visitor, not shared globally", async ({ page, browser }) => {
    const slug = await firstProductSlug(page);
    await addToCart(page, slug);

    const otherContext = await browser.newContext({ baseURL });
    const otherPage = await otherContext.newPage();
    await otherPage.goto("/cart");
    await expect(otherPage.getByText("Your cart is empty.")).toBeVisible();
    await otherContext.close();
  });
});
