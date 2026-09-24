import type { ProductService } from "../../../services/ProductService.ts";
import type { ReviewService } from "../../../services/ReviewService.ts";

export function loadAdminReviewsPage(
  services: { reviewService: ReviewService; productService: ProductService },
  input: { visibility: "all" | "visible" | "hidden"; productId?: number },
) {
  return {
    reviews: services.reviewService.getAdminReviews(input.visibility, input.productId),
    products: services.productService.getAll(),
  };
}

export function loadAdminReviewForm(services: { productService: ProductService }) {
  return { products: services.productService.getAll() };
}
