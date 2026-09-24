import type { CartService } from "../../services/CartService.ts";
import type { CategoryService } from "../../services/CategoryService.ts";
import type { ProductService } from "../../services/ProductService.ts";

export function loadHomePage(
  services: { cartService: CartService; categoryService: CategoryService; productService: ProductService },
  visitorId: string,
) {
  return {
    cartCount: services.cartService.getCount(visitorId),
    categories: services.categoryService.getAll(),
    featured: services.productService.getFeatured(),
  };
}

export type HomePageData = ReturnType<typeof loadHomePage>;
