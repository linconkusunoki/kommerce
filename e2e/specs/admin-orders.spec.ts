import { expect, test } from "../fixtures/test.ts";
import { adminConfigured } from "../fixtures/test.ts";
import { firstProductSlug, placeGuestOrder } from "../fixtures/flows.ts";

const ALL_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"] as const;

test.describe("admin order management", { tag: "@destructive" }, () => {
  test.skip(!adminConfigured, "Set E2E_ADMIN_PASSWORD");

  test("lists a newly placed order and links to its detail page", async ({ page, adminPage }) => {
    const slug = await firstProductSlug(page);
    const orderNumber = await placeGuestOrder(page, slug);

    await adminPage.goto("/admin/orders");
    const row = adminPage.locator("tr", { hasText: orderNumber });
    await expect(row).toBeVisible();
    await expect(row.locator("span.status-badge")).toHaveText("Pending");
    await expect(row.getByRole("link", { name: "View" })).toBeVisible();

    await row.getByRole("link", { name: "View" }).click();
    await expect(adminPage.getByRole("heading", { level: 1, name: `Order ${orderNumber}` })).toBeVisible();
  });

  test("the order detail shows the customer and the items", async ({ page, adminPage }) => {
    const slug = await firstProductSlug(page);
    const orderNumber = await placeGuestOrder(page, slug, { name: "E2E Detail Buyer" });

    await adminPage.goto("/admin/orders");
    await adminPage.locator("tr", { hasText: orderNumber }).getByRole("link", { name: "View" }).click();

    await expect(adminPage.getByRole("heading", { name: "Order Items" })).toBeVisible();
    await expect(adminPage.getByRole("heading", { name: "Customer" })).toBeVisible();
    await expect(adminPage.getByRole("heading", { name: "Shipping Address" })).toBeVisible();
    await expect(adminPage.getByText("E2E Detail Buyer")).toBeVisible();
    await expect(adminPage.locator("div.order-totals-row.order-totals-final")).toContainText("Total");

    // The order item links back to the product.
    await expect(adminPage.locator("div.order-admin-main a").first()).toHaveAttribute("href", `/products/${slug}`);
  });

  test("moves an order through every fulfilment status", async ({ page, adminPage }) => {
    const slug = await firstProductSlug(page);
    const orderNumber = await placeGuestOrder(page, slug);

    await adminPage.goto("/admin/orders");
    await adminPage.locator("tr", { hasText: orderNumber }).getByRole("link", { name: "View" }).click();

    const statusForm = adminPage.locator('form[action$="/status"]');
    for (const status of ALL_STATUSES) {
      await statusForm.locator('select[name="status"]').selectOption(status.toLowerCase());
      await statusForm.getByRole("button", { name: "Update Status" }).click();
      await expect(adminPage).toHaveURL(/\/admin\/orders\/\d+$/);

      await statusForm.locator('select[name="status"]').selectOption(status.toLowerCase());
      await expect(statusForm.locator('select[name="status"]')).toHaveValue(status.toLowerCase());
    }

    await adminPage.goto("/admin/orders");
    await expect(adminPage.locator("tr", { hasText: orderNumber }).locator("span.status-badge")).toHaveText(
      "Delivered",
    );
  });

  test("an order can be cancelled", async ({ page, adminPage }) => {
    const slug = await firstProductSlug(page);
    const orderNumber = await placeGuestOrder(page, slug);

    await adminPage.goto("/admin/orders");
    await adminPage.locator("tr", { hasText: orderNumber }).getByRole("link", { name: "View" }).click();

    const statusForm = adminPage.locator('form[action$="/status"]');
    await statusForm.locator('select[name="status"]').selectOption("cancelled");
    await statusForm.getByRole("button", { name: "Update Status" }).click();

    await adminPage.goto("/admin/orders");
    await expect(adminPage.locator("tr", { hasText: orderNumber }).locator("span.status-badge")).toHaveText(
      "Cancelled",
    );
  });

  test("an unknown status is ignored", async ({ page, adminPage }) => {
    const slug = await firstProductSlug(page);
    const orderNumber = await placeGuestOrder(page, slug);

    await adminPage.goto("/admin/orders");
    await adminPage.locator("tr", { hasText: orderNumber }).getByRole("link", { name: "View" }).click();
    const detailUrl = adminPage.url();

    // The status form only offers valid values, so inject one to exercise the guard.
    const status = adminPage.locator('form[action$="/status"] select[name="status"]');
    await status.evaluate((el) => {
      const select = el as HTMLSelectElement;
      select.insertAdjacentHTML("beforeend", '<option value="teleported">Teleported</option>');
      select.value = "teleported";
    });
    await adminPage.locator('form[action$="/status"]').getByRole("button", { name: "Update Status" }).click();

    await expect(adminPage).toHaveURL(detailUrl);
    await adminPage.goto("/admin/orders");
    await expect(adminPage.locator("tr", { hasText: orderNumber }).locator("span.status-badge")).toHaveText("Pending");
  });

  test("filters the list by status", async ({ page, adminPage }) => {
    const slug = await firstProductSlug(page);
    const orderNumber = await placeGuestOrder(page, slug);

    await adminPage.goto("/admin/orders?status=pending");
    await expect(adminPage.locator("tr", { hasText: orderNumber })).toBeVisible();

    await adminPage.goto("/admin/orders?status=delivered");
    await expect(adminPage.locator("tr", { hasText: orderNumber })).toHaveCount(0);

    // Pending always renders a link even when the count is zero.
    await expect(adminPage.getByRole("link", { name: /^Pending \(\d+\)$/ })).toBeVisible();
  });

  test("an unknown order id returns 404", async ({ adminPage }) => {
    const response = await adminPage.goto("/admin/orders/999999");
    expect(response?.status()).toBe(404);
  });
});
