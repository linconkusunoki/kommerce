import type { Services } from "../../../lib/container.ts";

export function loadAdminReviewsPage(
  services: Services,
  input: { visibility: "all" | "visible" | "hidden"; productId?: number },
) {
  return {
    reviews: services.reviewService.getAdminReviews(input.visibility, input.productId),
    products: services.productService.getAll(),
  };
}

export function loadAdminReviewForm(services: Services) {
  return { products: services.productService.getAll() };
}
