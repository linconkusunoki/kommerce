import type {
  IReviewAdminRepository,
  IReviewCustomerRepository,
  IReviewPublicRepository,
} from "../repositories/interfaces.ts";
import type { CreateAdminReviewInput, CreateCustomerReviewInput } from "../types/index.ts";

export const REVIEW_PAGE_SIZE = 10;

export type ReviewCommandResult =
  { ok: true; id?: number } | { ok: false; reason: "invalid" | "duplicate" | "not_found" | "not_owned" };

export type ReviewRepositories = {
  publicReviews: IReviewPublicRepository;
  customerReviews: IReviewCustomerRepository;
  adminReviews: IReviewAdminRepository;
};

function normalizeReview(rating: number, text: string | null): { rating: number; text: string | null } | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  const normalizedText = text?.trim() ?? "";
  if (normalizedText.length > 2000) return null;
  return { rating, text: normalizedText || null };
}

export class ReviewService {
  constructor(private repos: ReviewRepositories) {}

  getVisiblePage(productId: number, page: number) {
    return this.repos.publicReviews.findVisibleByProduct(
      productId,
      Number.isInteger(page) && page > 0 ? page : 1,
      REVIEW_PAGE_SIZE,
    );
  }

  getAdminReviews(visibility: "all" | "visible" | "hidden", productId?: number) {
    return this.repos.adminReviews.findAllForAdmin(visibility, productId);
  }

  getCustomerReviews(customerId: number) {
    return this.repos.customerReviews.findByCustomer(customerId);
  }

  getRatingSummary(productId: number) {
    return this.repos.publicReviews.getRatingSummary(productId);
  }

  getCustomerReview(productId: number, customerId: number) {
    return this.repos.customerReviews.findCustomerReview(productId, customerId);
  }

  async createCustomerReview(input: CreateCustomerReviewInput): Promise<ReviewCommandResult> {
    const normalized = normalizeReview(input.rating, input.text);
    if (!normalized) return { ok: false, reason: "invalid" };
    if (await this.repos.customerReviews.findCustomerReview(input.productId, input.customerId)) {
      return { ok: false, reason: "duplicate" };
    }
    try {
      return { ok: true, id: await this.repos.customerReviews.createCustomerReview({ ...input, ...normalized }) };
    } catch (error) {
      if (await this.repos.customerReviews.findCustomerReview(input.productId, input.customerId)) {
        return { ok: false, reason: "duplicate" };
      }
      throw error;
    }
  }

  async updateCustomerReview(
    id: number,
    productId: number,
    customerId: number,
    rating: number,
    text: string | null,
  ): Promise<ReviewCommandResult> {
    const normalized = normalizeReview(rating, text);
    const existing = await this.repos.customerReviews.findCustomerReview(productId, customerId);
    if (!normalized) return { ok: false, reason: "invalid" };
    if (!existing) return { ok: false, reason: "not_found" };
    if (existing.id !== id) return { ok: false, reason: "not_owned" };
    await this.repos.customerReviews.updateCustomerReview(id, customerId, normalized.rating, normalized.text);
    return { ok: true };
  }

  async deleteCustomerReview(id: number, customerId: number): Promise<void> {
    await this.repos.customerReviews.deleteCustomerReview(id, customerId);
  }

  async hideReview(id: number): Promise<void> {
    await this.repos.adminReviews.setVisibility(id, false);
  }

  async showReview(id: number): Promise<void> {
    await this.repos.adminReviews.setVisibility(id, true);
  }

  async deleteReview(id: number): Promise<void> {
    await this.repos.adminReviews.deleteReview(id);
  }

  async createAdminReview(input: CreateAdminReviewInput): Promise<number | null> {
    const normalized = normalizeReview(input.rating, input.text);
    if (!normalized) return null;
    return this.repos.adminReviews.createAdminReview({ ...input, ...normalized });
  }
}
