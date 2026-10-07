import { expect, test } from "../fixtures/test.ts";
import { registerCustomer, selectFirstVariant } from "../fixtures/flows.ts";
import { testPassword, uniqueEmail } from "../fixtures/data.ts";

test.describe("customer registration", () => {
  test("creates an account and signs the customer in", async ({ page }) => {
    const email = uniqueEmail("register");
    await registerCustomer(page, { email, password: testPassword(), displayName: "E2E Newcomer" });

    await expect(page.getByRole("heading", { name: "Your Account" })).toBeVisible();
    await expect(page.locator("span.profile-email")).toHaveText(email);
  });

  test("rejects a duplicate email", async ({ page }) => {
    const email = uniqueEmail("duplicate");
    const password = testPassword();
    await registerCustomer(page, { email, password, displayName: "First" });

    await page.context().clearCookies();
    await page.goto("/account/register");
    await page.fill("#display_name", "Second");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.locator("div.alert.alert-error")).toHaveText("Invalid or duplicate account details");
    await expect(page).toHaveURL(/\/account\/register/);
  });

  test("rejects a password shorter than eight characters", async ({ page }) => {
    await page.goto("/account/register");
    // The form carries minlength=8, so bypass the browser check to reach the server rule.
    await page
      .locator('form[action="/account/register"]')
      .evaluate((form) => form.setAttribute("novalidate", "novalidate"));
    await page.fill("#display_name", "Shorty");
    await page.fill("#email", uniqueEmail("short"));
    await page.fill("#password", "short12");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/account\/register/);
    await expect(page.locator("div.alert.alert-error")).toHaveText("Invalid or duplicate account details");
  });
});

test.describe("customer authentication", () => {
  test("signs in with valid credentials", async ({ page }) => {
    const email = uniqueEmail("login");
    const password = testPassword();
    await registerCustomer(page, { email, password, displayName: "E2E Returning" });

    await page.goto("/account/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page).toHaveURL(/\/account\/profile/);
    await expect(page.locator("span.profile-email")).toHaveText(email);
  });

  test("rejects an incorrect password", async ({ page }) => {
    const email = uniqueEmail("wrongpass");
    await registerCustomer(page, { email, password: testPassword(), displayName: "E2E Wrong" });

    await page.goto("/account/login");
    await page.fill("#email", email);
    await page.fill("#password", "definitely-not-the-password");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page.locator("div.alert.alert-error")).toHaveText("Invalid credentials");
    await expect(page).toHaveURL(/\/account\/login/);
  });

  test("signing out clears the session", async ({ page }) => {
    const email = uniqueEmail("logout");
    await registerCustomer(page, { email, password: testPassword(), displayName: "E2E Out" });

    await page.goto("/account/profile");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/account\/login/);

    await page.goto("/account/profile");
    await expect(page).toHaveURL(/\/account\/login/);
  });
});

test.describe("customer account guards", () => {
  for (const path of ["/account/profile", "/account/reviews", "/account/orders"]) {
    test(`${path} redirects a signed-out visitor to sign in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/account\/login/);
    });
  }

  test("/account redirects to the profile page", async ({ page }) => {
    await registerCustomer(page, {
      email: uniqueEmail("root"),
      password: testPassword(),
      displayName: "E2E Root",
    });
    await page.goto("/account");
    await expect(page).toHaveURL(/\/account\/profile/);
  });
});

test.describe("customer profile", () => {
  test("updates the display name", async ({ page }) => {
    await registerCustomer(page, {
      email: uniqueEmail("profile"),
      password: testPassword(),
      displayName: "E2E Before",
    });

    await page.goto("/account/profile");
    await page.fill("#display_name", "E2E After");
    await page.getByRole("button", { name: "Save name" }).click();

    await expect(page).toHaveURL(/\/account\/profile/);
    await expect(page.locator("#display_name")).toHaveValue("E2E After");
  });

  test("rejects a display name longer than eighty characters", async ({ page }) => {
    await registerCustomer(page, {
      email: uniqueEmail("longname"),
      password: testPassword(),
      displayName: "E2E Short",
    });

    await page.goto("/account/profile");
    // maxlength=80 caps fill(), so set the value directly to exceed the server limit.
    await page.locator("#display_name").evaluate((input) => {
      (input as HTMLInputElement).value = "x".repeat(81);
    });
    await page.getByRole("button", { name: "Save name" }).click();

    await expect(page.locator("div.alert.alert-error")).toHaveText("Display name must be 1 to 80 characters");
  });

  test("navigates between profile, reviews and orders", async ({ page }) => {
    await registerCustomer(page, {
      email: uniqueEmail("nav"),
      password: testPassword(),
      displayName: "E2E Navigator",
    });

    const nav = page.locator("nav.account-nav");
    await nav.getByRole("link", { name: "Reviews" }).click();
    await expect(page).toHaveURL(/\/account\/reviews/);
    await expect(page.getByRole("heading", { name: "Your Reviews" })).toBeVisible();

    await nav.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/account\/orders/);
    await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible();
  });

  test("a new customer sees empty review and order states", async ({ page }) => {
    await registerCustomer(page, {
      email: uniqueEmail("empty"),
      password: testPassword(),
      displayName: "E2E Empty",
    });

    await page.goto("/account/reviews");
    await expect(page.getByText("You have not written any reviews yet.")).toBeVisible();

    await page.goto("/account/orders");
    await expect(page.getByText("You have not placed any orders yet.")).toBeVisible();
  });
});

test.describe("reusable customer session", () => {
  test("a configured customer can sign back in", async ({ customerPage }) => {
    await expect(customerPage.getByRole("heading", { name: "Your Account" })).toBeVisible();
  });
});

test.describe("customer orders", { tag: "@destructive" }, () => {
  test("a signed-in customer's order is listed and readable", async ({ customerPage }) => {
    // Place an order as this customer, then confirm it is visible to them.
    await customerPage.goto("/");
    const href = await customerPage.locator("a.product-card").first().getAttribute("href");
    await customerPage.goto(href!);
    await selectFirstVariant(customerPage);
    await customerPage.getByRole("button", { name: "Add to Cart" }).click();

    await customerPage.goto("/checkout");
    await customerPage.fill("#name", "E2E Customer Order");
    await customerPage.fill("#address", "2 Test Avenue");
    await customerPage.fill("#city", "Testtown");
    await customerPage.fill("#postal_code", "20002");
    await customerPage.getByRole("button", { name: /Place Order/ }).click();
    await expect(customerPage).toHaveURL(/\/order\/KOM-/);
    const orderNumber = new URL(customerPage.url()).pathname.split("/").pop() ?? "";

    await customerPage.goto("/account/orders");
    await expect(customerPage.locator("a.account-order", { hasText: orderNumber })).toBeVisible();
  });
});
