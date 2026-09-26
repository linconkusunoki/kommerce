import type { CartService } from "../../services/CartService.ts";
import type { CustomerAuthService } from "../../services/CustomerAuthService.ts";
import type { ProductService } from "../../services/ProductService.ts";
import type { ReviewService } from "../../services/ReviewService.ts";

export async function loadProductPage(
  services: {
    productService: ProductService;
    customerAuthService: CustomerAuthService;
    reviewService: ReviewService;
    cartService: CartService;
  },
  input: { slug: string; visitorId: string; page: number; customerSessionId?: string },
) {
  const product = await services.productService.getBySlug(input.slug);
  if (!product) return null;

  const variants = await services.productService.getVariants(product.id);
  const customer = input.customerSessionId
    ? await services.customerAuthService.getSession(input.customerSessionId)
    : null;

  const reviewPage = await services.reviewService.getVisiblePage(product.id, input.page);
  const ratingSummary = await services.reviewService.getRatingSummary(product.id);

  return {
    product,
    variants,
    sizes: [...new Set(variants.map((variant) => variant.size))],
    colors: [...new Set(variants.map((variant) => variant.color))],
    onSale: product.compare_at_price != null && product.compare_at_price > product.price,
    reviewPage,
    ratingSummary,
    customerReview: customer ? await services.reviewService.getCustomerReview(product.id, customer.id) : null,
    customer,
    cartCount: await services.cartService.getCount(input.visitorId),
  };
}

export type ProductPageData = NonNullable<Awaited<ReturnType<typeof loadProductPage>>>;
