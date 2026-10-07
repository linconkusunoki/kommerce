import { expect, test } from "../fixtures/test.ts";

test.describe("health and public APIs", () => {
  test("GET /health reports a reachable database", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("GET /csrf-token responds for JS clients", async ({ request }) => {
    const response = await request.get("/csrf-token");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("GET /api/categories returns name and slug for every category", async ({ request }) => {
    const response = await request.get("/api/categories");
    expect(response.status()).toBe(200);

    const categories = (await response.json()) as { name: string; slug: string }[];
    expect(categories.length).toBeGreaterThan(0);
    for (const category of categories) {
      expect(Object.keys(category).sort()).toEqual(["name", "slug"]);
    }
  });

  test("GET /api/cart/count starts at zero for a fresh visitor", async ({ request }) => {
    const response = await request.get("/api/cart/count");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ count: 0 });
  });

  test("POST /api/chat rejects a missing messages array", async ({ request }) => {
    const response = await request.post("/api/chat", { data: {} });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "messages array is required" });
  });

  test("every HTML response is a complete document", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toContain("text/html");
    // Layout prepends the doctype after the handler runs.
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Kommerce - Clothing Store");
  });
});
