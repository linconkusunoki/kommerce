import { Hono } from "hono";
import { ProductForm } from "../../pages/admin/products/ProductForm.tsx";
import { ProductListPage } from "../../pages/admin/products/ProductListPage.tsx";
import { loadAdminProductForm, loadAdminProductsPage } from "../../pages/admin/products/loadAdminProductsPage.ts";
import type { Services } from "../../lib/container.ts";
import { slugify } from "../../lib/utils.ts";
import type { AppEnv } from "../../types/context.ts";
import type { ObjectStorage } from "../../services/ObjectStorage.ts";

export function createAdminProducts(services: Services, storage: ObjectStorage) {
  const products = new Hono<AppEnv>();

  products.get("/", (c) => {
    const { products: allProducts } = loadAdminProductsPage(services);
    return c.html(<ProductListPage products={allProducts} />);
  });

  products.get("/new", (c) => {
    const page = loadAdminProductForm(services);
    if (!page) return c.notFound();
    return c.html(<ProductForm categories={page.categories} />);
  });

  products.post("/new", async (c) => {
    const body = await c.req.parseBody();
    const categories = services.categoryService.getAll();
    const name = (body["name"] as string).trim();

    let uploadedUrl: string | null = null;
    try {
      const image = body["image"] instanceof File && body["image"].size > 0 ? body["image"] : null;
      uploadedUrl = image ? await storage.upload(image) : null;
      const id = services.productService.create({
        name,
        slug: slugify(name),
        description: (body["description"] as string) ?? "",
        price: parseFloat(body["price"] as string),
        compare_at_price: body["compare_at_price"] ? parseFloat(body["compare_at_price"] as string) : null,
        category_id: parseInt(body["category_id"] as string),
        image_url: uploadedUrl ?? ((body["image_url"] as string) || null),
        image_alt_text: (body["image_alt_text"] as string) || null,
        featured: !!body["featured"],
      });
      return c.redirect(`/admin/products/${id}/edit`);
    } catch (e: any) {
      if (uploadedUrl) await storage.delete(uploadedUrl);
      return c.html(<ProductForm categories={categories} error={e.message} />);
    }
  });

  products.get("/:id/edit", (c) => {
    const page = loadAdminProductForm(services, c.req.param("id"));
    if (!page || !page.product) return c.notFound();
    return c.html(<ProductForm {...page} />);
  });

  products.post("/:id/edit", async (c) => {
    const body = await c.req.parseBody();
    const id = c.req.param("id");
    const categories = services.categoryService.getAll();
    const name = (body["name"] as string).trim();
    const product = services.productService.getById(id);
    if (!product) return c.notFound();
    const previousImageUrl = product.image_url;

    let uploadedUrl: string | null = null;
    let imageUrl: string | null = null;
    try {
      const image = body["image"] instanceof File && body["image"].size > 0 ? body["image"] : null;
      uploadedUrl = image ? await storage.upload(image) : null;
      imageUrl = uploadedUrl ?? ((body["image_url"] as string) || null);
      services.productService.update(id, {
        name,
        slug: slugify(name),
        description: (body["description"] as string) ?? "",
        price: parseFloat(body["price"] as string),
        compare_at_price: body["compare_at_price"] ? parseFloat(body["compare_at_price"] as string) : null,
        category_id: parseInt(body["category_id"] as string),
        image_url: imageUrl,
        image_alt_text: (body["image_alt_text"] as string) || null,
        featured: !!body["featured"],
      });
    } catch (e: any) {
      if (uploadedUrl) await storage.delete(uploadedUrl);
      const page = loadAdminProductForm(services, id);
      return c.html(
        <ProductForm product={page?.product} categories={categories} variants={page?.variants} error={e.message} />,
      );
    }
    if (previousImageUrl !== imageUrl) await storage.delete(previousImageUrl ?? "");
    return c.redirect("/admin/products");
  });

  products.post("/:id/variants/add", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.parseBody();

    const product = services.productService.getById(id);
    if (!product) return c.notFound();

    const size = (body["size"] as string).trim();
    const color = (body["color"] as string).trim();
    const stock = parseInt(body["stock"] as string) || 0;
    const sku = (body["sku"] as string)?.trim() || `${product.slug}-${slugify(size)}-${slugify(color)}`;

    services.productService.addVariant(id, { size, color, stock, sku });
    return c.redirect(`/admin/products/${id}/edit`);
  });

  products.post("/:id/variants/:variantId/delete", (c) => {
    const id = c.req.param("id");
    const variantId = c.req.param("variantId");
    services.productService.deleteVariant(variantId, id);
    return c.redirect(`/admin/products/${id}/edit`);
  });

  products.post("/:id/delete", (c) => {
    const id = c.req.param("id");
    const product = services.productService.getById(id);
    services.productService.delete(id);
    if (product?.image_url) void storage.delete(product.image_url);
    return c.redirect("/admin/products");
  });

  return products;
}
