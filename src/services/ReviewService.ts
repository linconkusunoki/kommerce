import type { IReviewRepository } from "../repositories/interfaces.ts";
import type { CreateAdminReviewInput, CreateCustomerReviewInput } from "../types/index.ts";

export const REVIEW_PAGE_SIZE = 10;

function normalizeReview(rating: number, text: string | null): { rating: number; text: string | null } | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  const normalizedText = text?.trim() ?? "";
  if (normalizedText.length > 2000) return null;
  return { rating, text: normalizedText || null };
}

export class ReviewService {
  constructor(private repo: IReviewRepository) {}

  getVisiblePage(productId: number, page: number) {
    return this.repo.findVisibleByProduct(productId, Number.isInteger(page) ? page : 1, REVIEW_PAGE_SIZE);
  }

  getAdminReviews(visibility: "all" | "visible" | "hidden", productId?: number) {
    return this.repo.findAllForAdmin(visibility, productId);
  }

  getCustomerReviews(customerId: number) {
    return this.repo.findByCustomer(customerId);
  }

  getRatingSummary(productId: number) {
    return this.repo.getRatingSummary(productId);
  }

  getCustomerReview(productId: number, customerId: number) {
    return this.repo.findCustomerReview(productId, customerId);
  }

  createCustomerReview(input: CreateCustomerReviewInput): number | null {
    const normalized = normalizeReview(input.rating, input.text);
    if (!normalized) return null;
    return this.repo.createCustomerReview({ ...input, ...normalized });
  }

  updateCustomerReview(
    id: number,
    productId: number,
    customerId: number,
    rating: number,
    text: string | null,
  ): boolean {
    const normalized = normalizeReview(rating, text);
    const existing = this.repo.findCustomerReview(productId, customerId);
    if (!normalized || !existing || existing.id !== id) return false;
    this.repo.updateCustomerReview(id, customerId, normalized.rating, normalized.text);
    return true;
  }

  deleteCustomerReview(id: number, customerId: number): void {
    this.repo.deleteCustomerReview(id, customerId);
  }

  setVisibility(id: number, visible: boolean): void {
    this.repo.setVisibility(id, visible);
  }

  deleteReview(id: number): void {
    this.repo.deleteReview(id);
  }

  createAdminReview(input: CreateAdminReviewInput): number | null {
    const normalized = normalizeReview(input.rating, input.text);
    if (!normalized) return null;
    return this.repo.createAdminReview({ ...input, ...normalized });
  }
}
