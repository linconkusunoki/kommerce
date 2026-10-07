import { expect, test } from "../fixtures/test.ts";

/**
 * The mobile header fetches categories client-side, a code path the desktop
 * viewport never reaches.
 */
test.describe("mobile navigation", () => {
  test("opens and closes the menu and search panels", async ({ page }) => {
    await page.goto("/");

    // Only the search panel has a close button; the rest toggle from the header.
    const menuToggle = page.locator('[data-panel-toggle="menu-panel"]');
    await menuToggle.click();
    const menu = page.locator("#menu-panel");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");

    await menuToggle.click();
    await expect(menu).toBeHidden();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");

    await page.locator('[data-panel-toggle="search-panel"]').click();
    const search = page.locator("#search-panel");
    await expect(search).toBeVisible();
    await expect(search.locator("input[name='q']")).toBeVisible();

    await page.getByRole("button", { name: "Close search" }).click();
    await expect(search).toBeHidden();
  });

  test("loads the categories panel from the API", async ({ page }) => {
    await page.goto("/cart");
    // Pages other than the home page do not server-render the category list.
    await expect(page.locator("#categories-panel")).toContainText("Loading categories...");

    await page.getByRole("button", { name: "Open categories" }).click();
    const panel = page.locator("#categories-panel");
    await expect(panel.locator("nav.panel-links a").first()).toBeVisible();

    const href = await panel.locator("nav.panel-links a").first().getAttribute("href");
    await panel.locator("nav.panel-links a").first().click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator("h1.section-title")).toBeVisible();
  });

  test("searches from the mobile panel", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open search" }).click();
    await page.fill("#mobile-search", "cap");
    await page.locator("#search-panel input[name='q']").press("Enter");

    await expect(page).toHaveURL(/\/search\?q=cap/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
