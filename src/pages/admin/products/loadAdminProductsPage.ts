import type { CategoryService } from "../../../services/CategoryService.ts";
import type { ProductService } from "../../../services/ProductService.ts";

export function loadAdminProductsPage(services: { productService: ProductService }) {
  return { products: services.productService.getAll() };
}

export function loadAdminProductForm(
  services: { categoryService: CategoryService; productService: ProductService },
  productId?: string,
) {
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
