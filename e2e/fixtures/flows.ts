import { expect, type Page } from "@playwright/test";
import { admin as adminCreds, customer as customerCreds } from "./env.ts";
import { guestOrderDetails, type OrderDetails, uniqueName } from "./data.ts";

/* -------------------------------------------------------------------------- */
/* Sign in                                                                    */
/* -------------------------------------------------------------------------- */

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.fill("#username", adminCreds.username);
  await page.fill("#password", adminCreds.password);
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

export async function registerCustomer(
  page: Page,
  details: { email: string; password: string; displayName: string },
): Promise<void> {
  await page.goto("/account/register");
  await page.fill("#display_name", details.displayName);
  await page.fill("#email", details.email);
  await page.fill("#password", details.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account\/profile/);
}

export async function loginAsCustomer(page: Page): Promise<void> {
  await page.goto("/account/login");
  await page.fill("#email", customerCreds.email);
  await page.fill("#password", customerCreds.password);
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/profile/);
}

/**
 * Picks a seeded product that has stock, spread across the catalog.
 *
 * Always using one product would deplete it: seeded stock is only 5-24 units and
 * every checkout decrements it. A random seeded category, then a random product
 * inside it, keeps the load spread over the whole catalogue.
 */
export async function firstProductSlug(page: Page, options: { minStock?: number } = {}): Promise<string> {
  const minStock = options.minStock ?? 1;
  const response = await page.request.get("/api/categories");
  const categories = (await response.json()) as { name: string; slug: string }[];
  const seeded = categories.filter((category) => !category.name.startsWith("E2E "));
  if (seeded.length === 0) throw new Error("No seeded categories found; is the target database seeded?");

  for (let attempt = 0; attempt < 6; attempt++) {
    const category = seeded[Math.floor(Math.random() * seeded.length)]!;
    await page.goto(`/categories/${category.slug}`);

    const hrefs = await page
      .locator("a.product-card")
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href") ?? ""));

    for (const href of hrefs.filter(Boolean).sort(() => Math.random() - 0.5)) {
      await page.goto(href);
      if ((await stockedVariant(page, minStock)) !== null) {
        return href.replace("/products/", "");
      }
    }
  }
  throw new Error("No product with stock found; is the target database seeded?");
}

/**
 * Reads the variant picker for a stocked variant.
 *
 * The form embeds the full variant list as JSON, which is the only place stock
 * levels are exposed to the storefront.
 */
export async function stockedVariant(page: Page, minStock = 1): Promise<{ size: string; color: string } | null> {
  const raw = await page
    .locator('form.product-form input[name="variants"]')
    .inputValue()
    .catch(() => "");
  if (!raw) return null;

  const variants = JSON.parse(raw) as { size: string; color: string; stock: number }[];
  const available = variants.find((variant) => variant.stock >= minStock);
  return available ? { size: available.size, color: available.color } : null;
}

export type AdminCategory = { id: string; name: string };

/** Extracts the record id from an admin edit link such as /admin/categories/12/edit. */
export function idFromEditHref(href: string | null): string {
  return href?.match(/\/(\d+)\/edit$/)?.[1] ?? "";
}

/**
 * Returns the lowest-id category.
 *
 * Picking the first *row* is not safe: categories are ordered by sort_order and
 * e2e fixtures are created with 0, so they can sort above the seeded ones while
 * other workers are running. Ids are monotonic, so the lowest is always seeded.
 */
export async function firstAdminCategory(page: Page): Promise<AdminCategory> {
  await page.goto("/admin/categories");
  const rows = page.locator("tr", { has: page.getByRole("link", { name: "Edit" }) });
  const count = await rows.count();
  if (count === 0) throw new Error("No categories found in admin; is the target database seeded?");

  const candidates: AdminCategory[] = [];
  for (let index = 0; index < count; index++) {
    const row = rows.nth(index);
    const id = idFromEditHref(await row.getByRole("link", { name: "Edit" }).getAttribute("href"));
    if (!id) continue;
    candidates.push({ id, name: (await row.locator("td").nth(1).innerText()).trim() });
  }
  if (candidates.length === 0) throw new Error("No categories found in admin; is the target database seeded?");

  return candidates.reduce((lowest, current) => (Number(current.id) < Number(lowest.id) ? current : lowest));
}

/* -------------------------------------------------------------------------- */
/* Cart and checkout                                                          */
/* -------------------------------------------------------------------------- */

export type AddToCartOptions = { size?: string; color?: string; quantity?: string };

/**
 * Selects a size or colour chip.
 *
 * The radio itself is styled away and its label span intercepts pointer events,
 * so the chip label is clicked instead, which is what a user actually does.
 */
export async function selectVariant(page: Page, group: "size" | "color", value: string): Promise<void> {
  await page.locator(`form.product-form .chip:has(input[name="${group}"][value="${value}"])`).click();
}

/** Selects whatever the first size and colour chips are. */
export async function selectFirstVariant(page: Page): Promise<void> {
  const form = page.locator("form.product-form");
  await form.locator('.option-chips:has(input[name="size"]) .chip').first().click();
  await form.locator('.option-chips:has(input[name="color"]) .chip').first().click();
}

/**
 * Adds a stocked variant of a product to the cart. Size and colour come from the
 * page rather than being assumed, since both are per-product.
 */
export async function addToCart(page: Page, productSlug: string, options: AddToCartOptions = {}): Promise<void> {
  await page.goto(`/products/${productSlug}`);
  const form = page.locator("form.product-form");
  await expect(form).toBeVisible();

  const available = await stockedVariant(page, Number(options.quantity ?? 1));
  if (!available) throw new Error(`Product "${productSlug}" has no variant with enough stock`);

  await selectVariant(page, "size", options.size ?? available.size);
  await selectVariant(page, "color", options.color ?? available.color);
  // The server clamps to available stock, so the picker must not offer more.
  const maxQuantity = await form.locator("#quantity option").last().getAttribute("value");
  const requested = Number(options.quantity ?? 1);
  await form.locator("#quantity").selectOption(String(Math.min(requested, Number(maxQuantity ?? requested))));
  await form.getByRole("button", { name: "Add to Cart" }).click();

  await expect(page).toHaveURL(new RegExp(`/products/${productSlug}\\?added=1$`));
  await expect(page.getByText("Added to cart!")).toBeVisible();
}

/** Places a guest order and returns the generated order number. */
export async function placeGuestOrder(
  page: Page,
  productSlug: string,
  details?: Partial<OrderDetails>,
): Promise<string> {
  const order = { ...guestOrderDetails(), ...details };
  await addToCart(page, productSlug);

  await page.goto("/checkout");
  await page.fill("#email", order.email);
  await page.fill("#name", order.name);
  await page.fill("#address", order.address);
  await page.fill("#city", order.city);
  await page.fill("#postal_code", order.postalCode);
  if (order.country) await page.fill("#country", order.country);
  if (order.phone) await page.fill("#phone", order.phone);
  if (order.notes) await page.fill("#notes", order.notes);

  await page.getByRole("button", { name: /Place Order/ }).click();
  await expect(page).toHaveURL(/\/order\/KOM-/);

  const orderNumber = new URL(page.url()).pathname.split("/").pop() ?? "";
  await expect(page.getByRole("heading", { name: "Order Confirmed!" })).toBeVisible();
  return orderNumber;
}

/* -------------------------------------------------------------------------- */
/* Admin catalog CRUD helpers                                                 */
/* -------------------------------------------------------------------------- */

export async function createProductAsAdmin(
  page: Page,
  options: { name?: string; categoryName: string; price?: string; description?: string; featured?: boolean },
): Promise<{ id: string; slug: string; name: string }> {
  const name = options.name ?? uniqueName("Product");
  await page.goto("/admin/products/new");
  await page.fill("#name", name);
  await page.fill("#description", options.description ?? "Created by the end-to-end suite.");
  await page.fill("#price", options.price ?? "19.99");
  await page.selectOption("#category_id", { label: options.categoryName });
  if (options.featured) await page.locator('input[name="featured"]').check();
  await page.getByRole("button", { name: "Create Product" }).click();

  // Creation redirects to the edit page for the new id.
  await expect(page).toHaveURL(/\/admin\/products\/\d+\/edit$/);
  const id = new URL(page.url()).pathname.split("/")[3] ?? "";
  return {
    id,
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
  };
}

export async function addVariantAsAdmin(
  page: Page,
  productId: string,
  variant: { size: string; color: string; stock: number; sku?: string },
): Promise<void> {
  await page.goto(`/admin/products/${productId}/edit`);
  await page.fill("#v_size", variant.size);
  await page.fill("#v_color", variant.color);
  await page.fill("#v_stock", String(variant.stock));
  if (variant.sku) await page.fill("#v_sku", variant.sku);
  await page.getByRole("button", { name: "Add Variant" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/products/${productId}/edit$`));
}

/** Product delete lives on the list page, scoped to the row, not on the form. */
export async function deleteProductAsAdmin(page: Page, product: { id: string; name: string }): Promise<void> {
  await page.goto("/admin/products");
  await page.locator("tr", { hasText: product.name }).locator('form[action$="/delete"] button').click();
  await expect(page).toHaveURL(/\/admin\/products$/);
}
