import { expect, test } from "../fixtures/test.ts";
import { adminConfigured } from "../fixtures/test.ts";
import {
  addVariantAsAdmin,
  createProductAsAdmin,
  deleteProductAsAdmin,
  firstAdminCategory,
  idFromEditHref,
  selectVariant,
} from "../fixtures/flows.ts";
import { uniqueName } from "../fixtures/data.ts";

/**
 * Categories and products created here are deleted again so the shared target
 * database is left as found. Products cascade to their variants; categories
 * cascade to their products.
 */
/** Reads a category's slug from the admin list, which renders slug in the third column. */
async function categorySlugFor(adminPage: import("@playwright/test").Page, name: string): Promise<string> {
  await adminPage.goto("/admin/categories");
  const slug = (await adminPage.locator("tr", { hasText: name }).locator("td").nth(2).innerText()).trim();
  expect(slug).not.toBe("");
  return slug;
}

test.describe("admin category management", { tag: "@destructive" }, () => {
  test.skip(!adminConfigured, "Set E2E_ADMIN_PASSWORD");

  let createdCategoryId: string | undefined;

  test.afterEach(async ({ adminPage }) => {
    if (!createdCategoryId) return;
    await adminPage.goto("/admin/categories");
    await adminPage.locator(`form[action="/admin/categories/${createdCategoryId}/delete"] button`).click();
    await expect(adminPage).toHaveURL(/\/admin\/categories$/);
    createdCategoryId = undefined;
  });

  async function createAndLocateCategory(adminPage: import("@playwright/test").Page, name: string): Promise<string> {
    await adminPage.goto("/admin/categories/new");
    await adminPage.fill("#name", name);
    await adminPage.getByRole("button", { name: "Create Category" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/categories$/);

    const row = adminPage.locator("tr", { hasText: name });
    const href = await row.getByRole("link", { name: "Edit" }).getAttribute("href");
    createdCategoryId = idFromEditHref(href);
    expect(createdCategoryId).not.toBe("");
    return createdCategoryId!;
  }

  test("creates a category that appears on the storefront", async ({ adminPage }) => {
    const name = uniqueName("Category");
    await createAndLocateCategory(adminPage, name);

    const row = adminPage.locator("tr", { hasText: name });
    await expect(row).toBeVisible();

    const slug = await row.locator("td").nth(2).innerText();
    expect(slug.trim()).toBe(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    );

    await adminPage.goto(`/categories/${slug.trim()}`);
    await expect(adminPage.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(adminPage.getByText("No products in this category yet.")).toBeVisible();
  });

  test("rejects a duplicate category name", async ({ adminPage }) => {
    const name = uniqueName("Duplicate");
    await createAndLocateCategory(adminPage, name);

    await adminPage.goto("/admin/categories/new");
    await adminPage.fill("#name", name);
    await adminPage.getByRole("button", { name: "Create Category" }).click();

    // The unique-slug violation surfaces as a message on the form.
    await expect(adminPage.locator("div.alert.alert-error")).toBeVisible();
    await expect(adminPage).toHaveURL(/\/admin\/categories\/new$/);
  });

  test("edits a category and regenerates its slug", async ({ adminPage }) => {
    const name = uniqueName("Editable");
    const id = await createAndLocateCategory(adminPage, name);

    const renamed = `${name} Renamed`;
    await adminPage.goto(`/admin/categories/${id}/edit`);
    await expect(adminPage.getByRole("heading", { level: 1, name: "Edit Category" })).toBeVisible();
    await adminPage.fill("#name", renamed);
    await adminPage.fill("#description", "Updated by the end-to-end suite.");
    await adminPage.fill("#sort_order", "42");
    await adminPage.getByRole("button", { name: "Update Category" }).click();

    await expect(adminPage).toHaveURL(/\/admin\/categories$/);
    const row = adminPage.locator("tr", { hasText: renamed });
    await expect(row).toBeVisible();
    await expect(row.locator("td").nth(3)).toHaveText("0");

    const slug = (await row.locator("td").nth(2).innerText()).trim();
    expect(slug).toContain("renamed");
  });

  test("an unknown category id returns 404", async ({ adminPage }) => {
    const response = await adminPage.goto("/admin/categories/999999/edit");
    expect(response?.status()).toBe(404);
  });
});

test.describe("admin product management", { tag: "@destructive" }, () => {
  test.skip(!adminConfigured, "Set E2E_ADMIN_PASSWORD");

  let created: { id: string; name: string } | undefined;

  test.afterEach(async ({ adminPage }) => {
    if (!created) return;
    await deleteProductAsAdmin(adminPage, created);
    created = undefined;
  });

  test("creates a product and lands on its edit page", async ({ adminPage }) => {
    const category = await firstAdminCategory(adminPage);
    const name = uniqueName("Product");

    const product = await createProductAsAdmin(adminPage, {
      name,
      categoryName: category.name,
      price: "42.50",
      description: "Created by the end-to-end suite.",
    });
    created = { id: product.id, name: product.name };

    await expect(adminPage.getByRole("heading", { level: 1, name: "Edit Product" })).toBeVisible();
    await expect(adminPage.locator("#name")).toHaveValue(name);
    await expect(adminPage.locator("#price")).toHaveValue("42.5");

    await adminPage.goto("/admin/products");
    const row = adminPage.locator("tr", { hasText: name });
    await expect(row).toBeVisible();
    await expect(row.locator("td").nth(1)).toHaveText(category.name);
    await expect(row.locator("td").nth(2)).toHaveText("$42.50");

    await adminPage.goto(`/products/${product.slug}`);
    await expect(adminPage.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(adminPage.locator("span.price-lg").first()).toHaveText("$42.50");
  });

  test("a new product appears in its category on the storefront", async ({ adminPage }) => {
    const category = await firstAdminCategory(adminPage);
    const name = uniqueName("Categorised");
    const product = await createProductAsAdmin(adminPage, { name, categoryName: category.name });
    created = { id: product.id, name: product.name };

    const categorySlug = await categorySlugFor(adminPage, category.name);
    await adminPage.goto(`/categories/${categorySlug}`);
    await expect(adminPage.locator("a.product-card").filter({ hasText: name })).toBeVisible();
  });

  test("edits a product's name and price", async ({ adminPage }) => {
    const category = await firstAdminCategory(adminPage);
    const name = uniqueName("Editable");
    const product = await createProductAsAdmin(adminPage, { name, categoryName: category.name, price: "10.00" });
    created = { id: product.id, name: product.name };

    const renamed = `${name} Updated`;
    await adminPage.goto(`/admin/products/${product.id}/edit`);
    await adminPage.fill("#name", renamed);
    await adminPage.fill("#price", "77.25");
    await adminPage.fill("#compare_at_price", "99.00");
    await adminPage.getByRole("button", { name: "Update Product" }).click();

    await expect(adminPage).toHaveURL(/\/admin\/products$/);
    // Cleanup targets the list row, which now carries the new name.
    created = { id: product.id, name: renamed };

    await adminPage.goto(`/admin/products/${product.id}/edit`);
    await expect(adminPage.locator("#name")).toHaveValue(renamed);
    await expect(adminPage.locator("#price")).toHaveValue("77.25");

    // Renaming regenerates the slug, so the storefront moves with it.
    const slug = renamed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    await adminPage.goto(`/products/${slug}`);
    await expect(adminPage.getByRole("heading", { level: 1, name: renamed })).toBeVisible();
    await expect(adminPage.locator("span.badge.badge-sale")).toHaveText("Sale");
  });

  test("rejects a duplicate product name", async ({ adminPage }) => {
    const category = await firstAdminCategory(adminPage);
    const name = uniqueName("Duplicate");
    const product = await createProductAsAdmin(adminPage, { name, categoryName: category.name });
    created = { id: product.id, name: product.name };

    await adminPage.goto("/admin/products/new");
    await adminPage.fill("#name", name);
    await adminPage.fill("#price", "12.00");
    await adminPage.selectOption("#category_id", { label: category.name });
    await adminPage.getByRole("button", { name: "Create Product" }).click();

    await expect(adminPage.locator("div.alert.alert-error")).toBeVisible();
  });

  test("an unknown product id returns 404", async ({ adminPage }) => {
    const response = await adminPage.goto("/admin/products/999999/edit");
    expect(response?.status()).toBe(404);
  });
});

test.describe("admin product variants", { tag: "@destructive" }, () => {
  test.skip(!adminConfigured, "Set E2E_ADMIN_PASSWORD");

  let created: { id: string; name: string } | undefined;

  test.afterEach(async ({ adminPage }) => {
    if (!created) return;
    await deleteProductAsAdmin(adminPage, created);
    created = undefined;
  });

  test("a new product starts with no variants", async ({ adminPage }) => {
    const category = await firstAdminCategory(adminPage);
    const product = await createProductAsAdmin(adminPage, {
      name: uniqueName("NoVariants"),
      categoryName: category.name,
    });
    created = { id: product.id, name: product.name };

    await expect(adminPage.getByText("No variants yet.")).toBeVisible();
  });

  test("adds a variant that becomes purchasable", async ({ adminPage }) => {
    const category = await firstAdminCategory(adminPage);
    const product = await createProductAsAdmin(adminPage, {
      name: uniqueName("WithVariants"),
      categoryName: category.name,
    });
    created = { id: product.id, name: product.name };

    await addVariantAsAdmin(adminPage, product.id, { size: "M", color: "Black", stock: 7 });

    const row = adminPage.locator("table.admin-table tr", { hasText: "M" }).filter({ hasText: "Black" });
    await expect(row).toBeVisible();
    await expect(row.locator("td").nth(2)).toHaveText("7");

    // A blank SKU is generated from the slug, size and colour.
    const sku = (await row.locator("td").nth(3).innerText()).trim();
    expect(sku).toContain("m");
    expect(sku).toContain("black");

    // The variant is now offered on the storefront.
    await adminPage.goto(`/products/${product.slug}`);
    await expect(adminPage.locator("form.product-form input[name='size'][value='M']")).toBeVisible();
    await expect(adminPage.locator("form.product-form input[name='color'][value='Black']")).toBeVisible();

    await selectVariant(adminPage, "size", "M");
    await selectVariant(adminPage, "color", "Black");
    await adminPage.getByRole("button", { name: "Add to Cart" }).click();
    await expect(adminPage).toHaveURL(new RegExp(`/products/${product.slug}\\?added=1$`));
  });

  test("deletes a variant", async ({ adminPage }) => {
    const category = await firstAdminCategory(adminPage);
    const product = await createProductAsAdmin(adminPage, {
      name: uniqueName("DelVariants"),
      categoryName: category.name,
    });
    created = { id: product.id, name: product.name };

    await addVariantAsAdmin(adminPage, product.id, {
      size: "L",
      color: "Navy",
      stock: 3,
      sku: `e2e-${product.slug}-l-navy`,
    });
    await expect(adminPage.getByText("No variants yet.")).toHaveCount(0);

    await adminPage
      .locator(`form[action^="/admin/products/${product.id}/variants/"][action$="/delete"] button`)
      .click();
    await expect(adminPage).toHaveURL(new RegExp(`/admin/products/${product.id}/edit$`));
    await expect(adminPage.getByText("No variants yet.")).toBeVisible();
  });
});
