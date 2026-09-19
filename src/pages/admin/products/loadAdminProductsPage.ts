import type { Services } from "../../../lib/container.ts";

export function loadAdminProductsPage(services: Services) {
  return { products: services.productService.getAll() };
}

export function loadAdminProductForm(services: Services, productId?: string) {
  const categories = services.categoryService.getAll();
  if (!productId) return { categories, product: undefined, variants: undefined };

  const product = services.productService.getById(productId);
  if (!product) return null;

  return {
    categories,
    product,
    variants: services.productService.getVariants(productId),
  };
}
