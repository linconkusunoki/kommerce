import type { CartService } from "../../services/CartService.ts";
import type { CategoryService } from "../../services/CategoryService.ts";
import type { ProductService } from "../../services/ProductService.ts";

export async function loadHomePage(
  services: { cartService: CartService; categoryService: CategoryService; productService: ProductService },
  visitorId: string,
) {
  const [cartCount, categories, featured] = await Promise.all([
    services.cartService.getCount(visitorId),
    services.categoryService.getAll(),
    services.productService.getFeatured(),
  ]);

  return {
    cartCount,
    categories,
    featured,
  };
}

export type HomePageData = Awaited<ReturnType<typeof loadHomePage>>;
