import { expect, test } from "../fixtures/test.ts";
import type { Page } from "@playwright/test";
import { firstProductSlug, registerCustomer } from "../fixtures/flows.ts";
import { testPassword, uniqueEmail, uniqueText } from "../fixtures/data.ts";
import { baseURL } from "../fixtures/env.ts";

/** Registers a fresh customer so each test owns its own review slot. */
async function signedInCustomer(page: Page): Promise<void> {
  await registerCustomer(page, {
    email: uniqueEmail("reviewer"),
    password: testPassword(),
    displayName: "E2E Reviewer",
  });
}

/** Removes a review this test created so the shared database is left as found. */
async function cleanupOwnReview(page: Page, slug: string): Promise<void> {
  await page.goto(`/products/${slug}`);
  const deleteButton = page.getByRole("button", { name: "Delete review" });
  if (await deleteButton.isVisible()) {
    await deleteButton.click();
    await page.waitForURL(new RegExp(`/products/${slug}$`));
  }
}

test.describe("customer reviews", { tag: "@destructive" }, () => {
  let slug: string;

  test.beforeEach(async ({ page }) => {
    slug = await firstProductSlug(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupOwnReview(page, slug);
  });

  test("posts a review that appears on the product and in the account", async ({ page }) => {
    const body = uniqueText("Runs true to size");
    await signedInCustomer(page);
    await page.goto(`/products/${slug}`);
    await expect(page.getByRole("heading", { name: "Review this product" })).toBeVisible();

    await page.selectOption("#review-rating", "4");
    await page.fill("#review-text", body);
    await page.getByRole("button", { name: "Post review" }).click();

    await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));
    await expect(page.locator("article.review-card").filter({ hasText: body })).toBeVisible();

    await page.goto("/account/reviews");
    await expect(page.locator("article.profile-review", { hasText: body })).toBeVisible();
    await expect(page.locator("span.profile-email")).toContainText("1 review");
    await expect(page.locator("a.profile-review-product")).toHaveAttribute("href", `/products/${slug}`);
    await expect(page.locator("article.profile-review .review-status")).toHaveText("Visible");
  });

  test("the rating summary reflects the review", async ({ page }) => {
    const summaryBody = uniqueText("Excellent quality");
    await signedInCustomer(page);
    await page.goto(`/products/${slug}`);

    const before = await page.locator("div.rating-summary span.rating-count").innerText();
    await page.selectOption("#review-rating", "5");
    await page.fill("#review-text", summaryBody);
    await page.getByRole("button", { name: "Post review" }).click();

    const after = await page.locator("div.rating-summary span.rating-count").innerText();
    expect(after).not.toBe(before);
    await expect(page.locator("article.review-card").filter({ hasText: summaryBody })).toBeVisible();
  });

  test("a customer may only review a product once", async ({ page }) => {
    await signedInCustomer(page);
    await page.goto(`/products/${slug}`);
    await page.selectOption("#review-rating", "3");
    await page.getByRole("button", { name: "Post review" }).click();
    await expect(page.getByRole("heading", { name: "Edit your review" })).toBeVisible();

    // The UI now only offers edit, so replay the create endpoint directly.
    // page.request shares the browser context's cookies; the `request` fixture would not.
    const response = await page.request.post(`/products/${slug}/reviews`, {
      headers: { "sec-fetch-site": "same-origin", origin: baseURL },
      form: { rating: "5", text: "Trying to review twice." },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe(`/products/${slug}?review_error=You+already+reviewed+this+product`);

    // The error query value is decoded before rendering.
    await page.goto(response.headers().location!);
    await expect(page.locator("div.alert.alert-error")).toHaveText("You already reviewed this product");
  });

  test("a customer can edit their review", async ({ page }) => {
    const initialBody = uniqueText("Initial verdict");
    const revisedBody = uniqueText("Revised verdict");
    await signedInCustomer(page);
    await page.goto(`/products/${slug}`);
    await page.selectOption("#review-rating", "2");
    await page.fill("#review-text", initialBody);
    await page.getByRole("button", { name: "Post review" }).click();

    await expect(page.getByRole("heading", { name: "Edit your review" })).toBeVisible();
    await page.selectOption("#review-rating", "5");
    await page.fill("#review-text", revisedBody);
    await page.getByRole("button", { name: "Update review" }).click();

    await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));
    const card = page.locator("article.review-card").filter({ hasText: revisedBody });
    await expect(card).toBeVisible();
    await expect(card.locator('[role="img"]')).toHaveAttribute("aria-label", "5 out of 5 stars");
    await expect(page.locator("article.review-card", { hasText: initialBody })).toHaveCount(0);
  });

  test("a customer can delete their review", async ({ page }) => {
    const removingBody = uniqueText("Removing in a moment");
    await signedInCustomer(page);
    await page.goto(`/products/${slug}`);
    await page.selectOption("#review-rating", "1");
    await page.fill("#review-text", removingBody);
    await page.getByRole("button", { name: "Post review" }).click();
    await expect(page.getByRole("heading", { name: "Edit your review" })).toBeVisible();

    await page.getByRole("button", { name: "Delete review" }).click();

    await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));
    await expect(page.getByRole("heading", { name: "Review this product" })).toBeVisible();
    await expect(page.locator("article.review-card", { hasText: removingBody })).toHaveCount(0);
  });

  test("a deleted review disappears from the account too", async ({ page }) => {
    const shortLivedBody = uniqueText("Short lived review");
    await signedInCustomer(page);
    await page.goto(`/products/${slug}`);
    await page.selectOption("#review-rating", "5");
    await page.fill("#review-text", shortLivedBody);
    await page.getByRole("button", { name: "Post review" }).click();

    await page.goto("/account/reviews");
    await expect(page.locator("article.profile-review", { hasText: shortLivedBody })).toBeVisible();

    await page.goto(`/products/${slug}`);
    await page.getByRole("button", { name: "Delete review" }).click();

    await page.goto("/account/reviews");
    await expect(page.getByText("You have not written any reviews yet.")).toBeVisible();
  });

  test("rejects review text longer than two thousand characters", async ({ page }) => {
    await signedInCustomer(page);
    await page.goto(`/products/${slug}`);
    // maxlength=2000 caps fill(), so set the value directly to exercise the server rule.
    await page.locator("#review-text").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "a".repeat(2001);
    });
    await page.selectOption("#review-rating", "3");
    await page.getByRole("button", { name: "Post review" }).click();

    await expect(page.locator("div.alert.alert-error")).toHaveText(
      "Rating must be 1 to 5 and text must be under 2000 characters",
    );
  });

  test("posting a review while signed out redirects to sign in", async ({ request }) => {
    const response = await request.post(`/products/${slug}/reviews`, {
      headers: { "sec-fetch-site": "same-origin", origin: baseURL },
      form: { rating: "5", text: "Anonymous attempt." },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("/account/login");
  });

  test("a signed-out visitor is shown the sign-in prompt instead of the form", async ({ page }) => {
    await page.goto(`/products/${slug}`);

    await expect(page.getByText("Sign in or create an account to write a review.")).toBeVisible();
    await expect(page.locator("form.review-form")).toHaveCount(0);
  });

  test("a customer cannot edit or delete a review owned by somebody else", async ({ page, browser }) => {
    const ownedBody = uniqueText("Owned by customer A");
    await signedInCustomer(page);
    await page.goto(`/products/${slug}`);
    await page.selectOption("#review-rating", "4");
    await page.fill("#review-text", ownedBody);
    await page.getByRole("button", { name: "Post review" }).click();
    await expect(page.getByRole("heading", { name: "Edit your review" })).toBeVisible();

    // The edit form's action carries the real review id.
    const action = await page.locator("form.review-form").getAttribute("action");
    const reviewId = action?.match(/reviews\/(\d+)\/edit/)?.[1];
    expect(reviewId).toBeDefined();

    const otherContext = await browser.newContext({ baseURL });
    const otherPage = await otherContext.newPage();
    await registerCustomer(otherPage, {
      email: uniqueEmail("intruder"),
      password: testPassword(),
      displayName: "E2E Intruder",
    });

    const editResponse = await otherContext.request.post(`/products/${slug}/reviews/${reviewId}/edit`, {
      headers: { "sec-fetch-site": "same-origin", origin: baseURL },
      form: { rating: "1", text: "Tampered." },
      maxRedirects: 0,
    });
    expect(editResponse.status()).toBe(302);
    expect(editResponse.headers().location).toBe(`/products/${slug}?review_error=Review+could+not+be+updated`);

    await otherPage.goto(editResponse.headers().location!);
    await expect(otherPage.locator("div.alert.alert-error")).toHaveText("Review could not be updated");

    const deleteResponse = await otherContext.request.post(`/products/${slug}/reviews/${reviewId}/delete`, {
      headers: { "sec-fetch-site": "same-origin", origin: baseURL },
      maxRedirects: 0,
    });
    expect(deleteResponse.status()).toBe(302);

    // Customer A's review survives, unmodified.
    await page.goto(`/products/${slug}`);
    await expect(page.locator("article.review-card", { hasText: ownedBody })).toBeVisible();
    await expect(page.locator("article.review-card", { hasText: "Tampered." })).toHaveCount(0);
    await otherContext.close();
  });
});
