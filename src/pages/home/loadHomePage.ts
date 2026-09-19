import type { Services } from "../../lib/container.ts";

export function loadHomePage(services: Services, visitorId: string) {
  return {
    cartCount: services.cartService.getCount(visitorId),
    categories: services.categoryService.getAll(),
    featured: services.productService.getFeatured(),
  };
}

export type HomePageData = ReturnType<typeof loadHomePage>;
