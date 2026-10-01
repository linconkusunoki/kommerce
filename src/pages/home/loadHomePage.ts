import type { CartService } from "../../services/CartService.ts";
import type { CategoryService } from "../../services/CategoryService.ts";
import type { ProductService } from "../../services/ProductService.ts";

export async function loadHomePage(
  services: { cartService: CartService; categoryService: CategoryService; productService: ProductService },
  visitorId: string,
) {
  const [cartCount, categories, featured, recent] = await Promise.all([
    services.cartService.getCount(visitorId),
    services.categoryService.getAll(),
    services.productService.getFeatured(),
    services.productService.getRecent(3),
  ]);

  return {
    cartCount,
    categories,
    featured,
    recent,
  };
}

export type HomePageData = Awaited<ReturnType<typeof loadHomePage>>;
