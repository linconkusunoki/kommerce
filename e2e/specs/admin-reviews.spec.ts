import { expect, test } from "../fixtures/test.ts";
import { adminConfigured } from "../fixtures/test.ts";
import { uniqueText } from "../fixtures/data.ts";

/**
 * Admin reviews are deleted again afterwards; the shared target database has no
 * customer-facing way to remove them.
 */
async function createAdminReview(
  adminPage: import("@playwright/test").Page,
  body: string,
): Promise<{ row: import("@playwright/test").Locator }> {
  await adminPage.goto("/admin/reviews/new");
  const productId = await adminPage.locator("#product_id option").nth(1).getAttribute("value");
  await adminPage.selectOption("#product_id", productId!);
  await adminPage.selectOption("#rating", "4");
  await adminPage.fill("#text", body);
  await adminPage.getByRole("button", { name: "Publish Review" }).click();
  await expect(adminPage).toHaveURL(/\/admin\/reviews$/);
  return { row: adminPage.locator("tr", { hasText: body }) };
}

test.describe("admin review management", { tag: "@destructive" }, () => {
  test.skip(!adminConfigured, "Set E2E_ADMIN_PASSWORD");

  let createdRows: string[] = [];

  test.afterEach(async ({ adminPage }) => {
    for (const body of createdRows) {
      await adminPage.goto("/admin/reviews");
      const row = adminPage.locator("tr", { hasText: body });
      if (await row.count()) {
        await row.locator('form[action$="/delete"] button').click();
        await expect(adminPage).toHaveURL(/\/admin\/reviews$/);
      }
    }
    createdRows = [];
  });

  test("publishes an admin review", async ({ adminPage }) => {
    const body = uniqueText("Admin review");
    const { row } = await createAdminReview(adminPage, body);
    createdRows.push(body);

    await expect(row).toBeVisible();
    await expect(row.locator("small")).toHaveText("Admin");
    await expect(row.locator("td").nth(2)).toHaveText("4 / 5");
    await expect(row.locator("td").nth(4)).toHaveText("Visible");
  });

  test("hides a review and restores it", async ({ adminPage }) => {
    const body = uniqueText("Moderated");
    const { row } = await createAdminReview(adminPage, body);
    createdRows.push(body);

    await row.getByRole("button", { name: "Hide" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/reviews$/);
    await expect(adminPage.locator("tr", { hasText: body }).locator("td").nth(4)).toHaveText("Hidden");

    await adminPage.locator("tr", { hasText: body }).getByRole("button", { name: "Show" }).click();
    await expect(adminPage.locator("tr", { hasText: body }).locator("td").nth(4)).toHaveText("Visible");
  });

  test("deletes a review", async ({ adminPage }) => {
    const body = uniqueText("Disposable");
    const { row } = await createAdminReview(adminPage, body);

    await row.getByRole("button", { name: "Delete" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/reviews$/);
    await expect(adminPage.locator("tr", { hasText: body })).toHaveCount(0);
  });

  test("rejects an admin review with no product", async ({ adminPage }) => {
    await adminPage.goto("/admin/reviews/new");
    // Both selects are required, so bypass the browser check to reach the server rule.
    await adminPage
      .locator('form[action="/admin/reviews/new"]')
      .evaluate((form) => form.setAttribute("novalidate", "novalidate"));
    await adminPage.selectOption("#rating", "3");
    await adminPage.fill("#text", "No product selected.");
    await adminPage.getByRole("button", { name: "Publish Review" }).click();

    await expect(adminPage.locator("div.alert.alert-error")).toHaveText("Select a valid product and rating");
    await expect(adminPage).toHaveURL(/\/admin\/reviews\/new/);
  });

  test("filters reviews by visibility", async ({ adminPage }) => {
    const body = uniqueText("Filterable");
    const { row } = await createAdminReview(adminPage, body);
    createdRows.push(body);

    await row.getByRole("button", { name: "Hide" }).click();

    await adminPage.goto("/admin/reviews?visibility=visible");
    await expect(adminPage.locator("tr", { hasText: body })).toHaveCount(0);

    await adminPage.goto("/admin/reviews?visibility=hidden");
    await expect(adminPage.locator("tr", { hasText: body })).toHaveCount(1);

    await adminPage.goto("/admin/reviews?visibility=all");
    await expect(adminPage.locator("tr", { hasText: body })).toHaveCount(1);
  });

  test("a hidden review is absent from the storefront", async ({ adminPage }) => {
    const body = uniqueText("Hidden from shoppers");
    const { row } = await createAdminReview(adminPage, body);
    createdRows.push(body);

    await expect(row.locator("td").nth(4)).toHaveText("Visible");

    // The row links to the product the review belongs to.
    const href = await row.locator("td a").first().getAttribute("href");
    expect(href).toMatch(/^\/products\//);

    await adminPage.goto(href!);
    await expect(adminPage.locator("article.review-card").filter({ hasText: body })).toBeVisible();

    await adminPage.goto("/admin/reviews");
    await adminPage.locator("tr", { hasText: body }).getByRole("button", { name: "Hide" }).click();

    await adminPage.goto(href!);
    await expect(adminPage.locator("article.review-card").filter({ hasText: body })).toHaveCount(0);
  });
});
