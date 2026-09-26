import { Hono } from "hono";
import { ProductForm } from "../../pages/admin/products/ProductForm.tsx";
import { ProductListPage } from "../../pages/admin/products/ProductListPage.tsx";
import { loadAdminProductForm, loadAdminProductsPage } from "../../pages/admin/products/loadAdminProductsPage.ts";
import type { Services } from "../../lib/container.ts";
import { slugify } from "../../lib/utils.ts";
import type { AppEnv } from "../../types/context.ts";

export function createAdminProducts(services: Services) {
  const products = new Hono<AppEnv>();

  products.get("/", async (c) => {
    const { products: allProducts } = await loadAdminProductsPage({ productService: services.productService });
    return c.html(<ProductListPage products={allProducts} />);
  });

  products.get("/new", async (c) => {
    const page = await loadAdminProductForm({
      categoryService: services.categoryService,
      productService: services.productService,
    });
    if (!page) return c.notFound();
    return c.html(<ProductForm categories={page.categories} />);
  });

  products.post("/new", async (c) => {
    const body = await c.req.parseBody();
    const categories = await services.categoryService.getAll();
    const name = (body["name"] as string).trim();

    try {
      const image = body["image"] instanceof File && body["image"].size > 0 ? body["image"] : null;
      const id = await services.productService.createWithImage(
        {
          name,
          slug: slugify(name),
          description: (body["description"] as string) ?? "",
          price: parseFloat(body["price"] as string),
          compare_at_price: body["compare_at_price"] ? parseFloat(body["compare_at_price"] as string) : null,
          category_id: parseInt(body["category_id"] as string),
          image_url: (body["image_url"] as string) || null,
          image_alt_text: (body["image_alt_text"] as string) || null,
          featured: !!body["featured"],
        },
        image,
      );
      return c.redirect(`/admin/products/${id}/edit`);
    } catch (e: any) {
      return c.html(<ProductForm categories={categories} error={e.message} />);
    }
  });

  products.get("/:id/edit", async (c) => {
    const page = await loadAdminProductForm(
      { categoryService: services.categoryService, productService: services.productService },
      c.req.param("id"),
    );
    if (!page || !page.product) return c.notFound();
    return c.html(<ProductForm {...page} />);
  });

  products.post("/:id/edit", async (c) => {
    const body = await c.req.parseBody();
    const id = c.req.param("id");
    const categories = await services.categoryService.getAll();
    const name = (body["name"] as string).trim();
    const product = await services.productService.getById(id);
    if (!product) return c.notFound();
    try {
      const image = body["image"] instanceof File && body["image"].size > 0 ? body["image"] : null;
      await services.productService.updateWithImage(
        id,
        {
          name,
          slug: slugify(name),
          description: (body["description"] as string) ?? "",
          price: parseFloat(body["price"] as string),
          compare_at_price: body["compare_at_price"] ? parseFloat(body["compare_at_price"] as string) : null,
          category_id: parseInt(body["category_id"] as string),
          image_url: (body["image_url"] as string) || null,
          image_alt_text: (body["image_alt_text"] as string) || null,
          featured: !!body["featured"],
        },
        image,
      );
    } catch (e: any) {
      const page = await loadAdminProductForm(
        { categoryService: services.categoryService, productService: services.productService },
        id,
      );
      return c.html(
        <ProductForm product={page?.product} categories={categories} variants={page?.variants} error={e.message} />,
      );
    }
    return c.redirect("/admin/products");
  });

  products.post("/:id/variants/add", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.parseBody();

    const product = await services.productService.getById(id);
    if (!product) return c.notFound();

    const size = (body["size"] as string).trim();
    const color = (body["color"] as string).trim();
    const stock = parseInt(body["stock"] as string) || 0;
    const sku = (body["sku"] as string)?.trim() || `${product.slug}-${slugify(size)}-${slugify(color)}`;

    await services.productService.addVariant(id, { size, color, stock, sku });
    return c.redirect(`/admin/products/${id}/edit`);
  });

  products.post("/:id/variants/:variantId/delete", async (c) => {
    const id = c.req.param("id");
    const variantId = c.req.param("variantId");
    await services.productService.deleteVariant(variantId, id);
    return c.redirect(`/admin/products/${id}/edit`);
  });

  products.post("/:id/delete", async (c) => {
    const id = c.req.param("id");
    await services.productService.deleteWithImage(id);
    return c.redirect("/admin/products");
  });

  return products;
}
