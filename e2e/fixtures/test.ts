import { test as base, expect, type Page } from "@playwright/test";
import { adminConfigured, customerConfigured } from "./env.ts";
import { loginAsAdmin, loginAsCustomer } from "./flows.ts";

/**
 * Admin delete actions call `confirm()`, which Playwright would otherwise
 * dismiss and silently skip the deletion. Registering twice would make the
 * second accept() throw, so this is applied once per page.
 */
const dialogPages = new WeakSet<Page>();

function autoAcceptConfirms(page: Page): void {
  if (dialogPages.has(page)) return;
  dialogPages.add(page);
  page.on("dialog", (dialog) => {
    if (dialog.type() === "confirm") void dialog.accept();
  });
}

type Fixtures = {
  /** A page already signed in as the configured Admin. */
  adminPage: Page;
  /** A page already signed in as the configured Customer. */
  customerPage: Page;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    autoAcceptConfirms(page);
    await use(page);
  },

  // These skip from inside the fixture: fixture setup happens before a test body
  // runs, so a skip guard written in the test body would be too late.
  adminPage: async ({ page }, use) => {
    base.skip(!adminConfigured, 'Set E2E_ADMIN_PASSWORD (and E2E_ADMIN_USERNAME, default "admin")');
    autoAcceptConfirms(page);
    await loginAsAdmin(page);
    await use(page);
  },

  customerPage: async ({ page }, use) => {
    base.skip(!customerConfigured, "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    autoAcceptConfirms(page);
    await loginAsCustomer(page);
    await use(page);
  },
});

export { expect, adminConfigured, customerConfigured };
