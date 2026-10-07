import { expect, test } from "../fixtures/test.ts";
import { addToCart, firstProductSlug, placeGuestOrder } from "../fixtures/flows.ts";
import { uniqueEmail } from "../fixtures/data.ts";
import { baseURL } from "../fixtures/env.ts";

test.describe("guest checkout", { tag: "@destructive" }, () => {
  test("places an order and shows a confirmation", async ({ page }) => {
    const slug = await firstProductSlug(page);
    const orderNumber = await placeGuestOrder(page, slug);

    expect(orderNumber).toMatch(/^KOM-/);
    await expect(page.getByRole("heading", { level: 1, name: "Order Confirmed!" })).toBeVisible();
    await expect(page.locator("div.order-confirmation")).toContainText(orderNumber);
    await expect(page.getByRole("heading", { name: "Shipping Address" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Order Summary" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue Shopping" })).toHaveAttribute("href", "/");
  });

  test("empties the cart once the order is placed", async ({ page }) => {
    const slug = await firstProductSlug(page);
    await placeGuestOrder(page, slug);

    await page.goto("/cart");
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
    await page.goto("/");
    // The badge stays in the DOM but is hidden while the count is zero.
    await expect(page.locator("#cart-badge")).toBeHidden();
  });

  test("rejects an order that is missing required fields", async ({ page }) => {
    const slug = await firstProductSlug(page);
    await addToCart(page, slug);

    await page.goto("/checkout");
    // Bypass the browser's own required-field validation to reach the server check.
    await page.locator("form.checkout-form").evaluate((form) => form.setAttribute("novalidate", "novalidate"));
    await page.fill("#email", uniqueEmail("incomplete"));
    await page.fill("#name", "");
    await page.getByRole("button", { name: /Place Order/ }).click();

    await expect(page).toHaveURL(/\/checkout\?error=/);
    await expect(page.locator("div.alert.alert-error")).toHaveText("Please fill in all required fields");
  });

  test("shows the order summary before submitting", async ({ page }) => {
    const slug = await firstProductSlug(page, { minStock: 2 });
    await addToCart(page, slug, { quantity: "2" });

    await page.goto("/checkout");
    await expect(page.locator("div.checkout-item")).toHaveCount(1);
    await expect(page.locator("span.checkout-item-qty")).toHaveText("2");
    await expect(page.getByRole("button", { name: /Place Order/ })).toBeVisible();
  });
});

test.describe("order confirmation", { tag: "@destructive" }, () => {
  test("an unknown order number returns 404", async ({ page }) => {
    const response = await page.goto("/order/KOM-DOESNOTEXIST");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Order not found" })).toBeVisible();
  });

  test("another visitor cannot read a guest order", async ({ page, browser }) => {
    const slug = await firstProductSlug(page);
    const orderNumber = await placeGuestOrder(page, slug);

    const otherContext = await browser.newContext({ baseURL });
    const otherPage = await otherContext.newPage();
    const response = await otherPage.goto(`/order/${orderNumber}`);

    expect(response?.status()).toBe(404);
    await expect(otherPage.getByRole("heading", { level: 1, name: "Order not found" })).toBeVisible();
    await otherContext.close();
  });

  test("an order submitted with an empty cart is not created", async ({ page, request }) => {
    const response = await request.post("/checkout", {
      headers: { "sec-fetch-site": "same-origin", origin: baseURL },
      form: {
        email: uniqueEmail("empty"),
        name: "E2E Guest",
        address: "1 Test Street",
        city: "Testville",
        postal_code: "10001",
        country: "",
        phone: "",
        notes: "",
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("/cart");
  });
});
