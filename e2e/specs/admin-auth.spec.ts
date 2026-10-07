import { expect, test } from "../fixtures/test.ts";
import { adminConfigured } from "../fixtures/test.ts";
import { admin as adminCreds, baseURL } from "../fixtures/env.ts";
import { loginAsAdmin, registerCustomer } from "../fixtures/flows.ts";
import { testPassword, uniqueEmail } from "../fixtures/data.ts";

test.describe("admin authentication", () => {
  test.skip(!adminConfigured, "Set E2E_ADMIN_PASSWORD");

  test("signs in with valid credentials", async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(page.locator("nav.admin-nav")).toBeVisible();
  });

  test("rejects an incorrect password", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("#username", adminCreds.username);
    await page.fill("#password", "definitely-not-the-password");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page.locator("div.alert.alert-error")).toHaveText("Invalid credentials");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("rejects an unknown username", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("#username", "no-such-admin");
    await page.fill("#password", adminCreds.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page.locator("div.alert.alert-error")).toHaveText("Invalid credentials");
  });

  test("signing out ends the admin session", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin");
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("the login page links back to the store", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("link", { name: "← Back to store" })).toHaveAttribute("href", "/");
  });
});

test.describe("admin route guards", () => {
  const protectedPaths = [
    "/admin",
    "/admin/products",
    "/admin/products/new",
    "/admin/categories",
    "/admin/categories/new",
    "/admin/orders",
    "/admin/reviews",
    "/admin/reviews/new",
  ];

  for (const path of protectedPaths) {
    test(`${path} redirects a signed-out visitor to the admin login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByRole("heading", { level: 1, name: "Admin Login" })).toBeVisible();
    });
  }

  test("a signed-in customer session does not grant admin access", async ({ browser }) => {
    // A throwaway customer, so this guard runs without any configured credentials.
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await registerCustomer(page, {
      email: uniqueEmail("notadmin"),
      password: testPassword(),
      displayName: "E2E Not Admin",
    });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/admin\/login/);
    await context.close();
  });
});

test.describe("admin dashboard", () => {
  test.skip(!adminConfigured, "Set E2E_ADMIN_PASSWORD");

  test("shows every statistic card", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    for (const label of [
      "Products",
      "Categories",
      "Orders",
      "Pending Orders",
      "Total Revenue",
      "Revenue This Month",
      "Avg Order Value",
    ]) {
      const card = adminPage.locator("div.stat-card", { has: adminPage.locator(`.stat-label:text-is("${label}")`) });
      await expect(card).toBeVisible();
      await expect(card.locator(".stat-number")).not.toBeEmpty();
    }
  });

  test("the sidebar links to every admin section", async ({ adminPage }) => {
    await adminPage.goto("/admin");
    const nav = adminPage.locator("nav.admin-nav");

    for (const [link, path] of [
      ["Orders", "/admin/orders"],
      ["Reviews", "/admin/reviews"],
      ["Products", "/admin/products"],
      ["Categories", "/admin/categories"],
      ["Dashboard", "/admin"],
    ] as const) {
      await expect(nav.getByRole("link", { name: link })).toHaveAttribute("href", path);
    }
  });
});
