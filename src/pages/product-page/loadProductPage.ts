import type { Services } from "../../lib/container.ts";

export function loadProductPage(
  services: Services,
  input: { slug: string; visitorId: string; page: number; customerSessionId?: string },
) {
  const product = services.productService.getBySlug(input.slug);
  if (!product) return null;

  const variants = services.productService.getVariants(product.id);
  const customer = input.customerSessionId ? services.authService.getCustomerSession(input.customerSessionId) : null;

  const reviewPage = services.reviewService.getVisiblePage(product.id, input.page);
  const ratingSummary = services.reviewService.getRatingSummary(product.id);

  return {
    product,
    variants,
    sizes: [...new Set(variants.map((variant) => variant.size))],
    colors: [...new Set(variants.map((variant) => variant.color))],
    onSale: product.compare_at_price != null && product.compare_at_price > product.price,
    reviewPage,
    ratingSummary,
    customerReview: customer ? services.reviewService.getCustomerReview(product.id, customer.id) : null,
    customer,
    cartCount: services.cartService.getCount(input.visitorId),
  };
}

export type ProductPageData = NonNullable<ReturnType<typeof loadProductPage>>;
