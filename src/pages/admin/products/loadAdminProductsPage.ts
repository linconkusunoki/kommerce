import type { CategoryService } from "../../../services/CategoryService.ts";
import type { ProductService } from "../../../services/ProductService.ts";

export async function loadAdminProductsPage(services: { productService: ProductService }) {
  return { products: await services.productService.getAll() };
}

export async function loadAdminProductForm(
  services: { categoryService: CategoryService; productService: ProductService },
  productId?: string,
) {
  const categories = await services.categoryService.getAll();
  if (!productId) return { categories, product: undefined, variants: undefined };

  const product = await services.productService.getById(productId);
  if (!product) return null;

  return {
    categories,
    product,
    variants: await services.productService.getVariants(productId),
  };
}
