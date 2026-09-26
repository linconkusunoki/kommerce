import type { CartService } from "../../services/CartService.ts";
import type { CategoryService } from "../../services/CategoryService.ts";
import type { ProductService } from "../../services/ProductService.ts";

export async function loadHomePage(
  services: { cartService: CartService; categoryService: CategoryService; productService: ProductService },
  visitorId: string,
) {
  return {
    cartCount: await services.cartService.getCount(visitorId),
    categories: await services.categoryService.getAll(),
    featured: await services.productService.getFeatured(),
  };
}

export type HomePageData = Awaited<ReturnType<typeof loadHomePage>>;
