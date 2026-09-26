import type { ProductService } from "../../../services/ProductService.ts";
import type { ReviewService } from "../../../services/ReviewService.ts";

export async function loadAdminReviewsPage(
  services: { reviewService: ReviewService; productService: ProductService },
  input: { visibility: "all" | "visible" | "hidden"; productId?: number },
) {
  return {
    reviews: await services.reviewService.getAdminReviews(input.visibility, input.productId),
    products: await services.productService.getAll(),
  };
}

export async function loadAdminReviewForm(services: { productService: ProductService }) {
  return { products: await services.productService.getAll() };
}
