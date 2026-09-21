import { describe, expect, mock, test } from "bun:test";
import { ReviewService } from "../../services/ReviewService.ts";
import type { IReviewRepository } from "../../repositories/interfaces.ts";

function mockReviewRepo(overrides: Partial<IReviewRepository> = {}): IReviewRepository {
  return {
    findByCustomer: mock(() => []),
    findAllForAdmin: mock(() => []),
    findVisibleByProduct: mock(() => ({ reviews: [], page: 1, totalPages: 1, totalCount: 0 })),
    getRatingSummary: mock(() => ({ average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })),
    findCustomerReview: mock(() => null),
    createCustomerReview: mock(() => 1),
    updateCustomerReview: mock(() => {}),
    deleteCustomerReview: mock(() => {}),
    setVisibility: mock(() => {}),
    deleteReview: mock(() => {}),
    createAdminReview: mock(() => 2),
    ...overrides,
  };
}

describe("ReviewService.createCustomerReview", () => {
  test("normalizes valid input", () => {
    const create = mock(() => 9);
    const service = new ReviewService(mockReviewRepo({ createCustomerReview: create }));

    expect(service.createCustomerReview({ productId: 3, customerId: 4, rating: 5, text: "  Great fit  " })).toEqual({
      ok: true,
      id: 9,
    });
    expect(create).toHaveBeenCalledWith({ productId: 3, customerId: 4, rating: 5, text: "Great fit" });
  });

  test("rejects invalid ratings and overlong text", () => {
    const create = mock(() => 1);
    const service = new ReviewService(mockReviewRepo({ createCustomerReview: create }));

    expect(service.createCustomerReview({ productId: 3, customerId: 4, rating: 6, text: null })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(service.createCustomerReview({ productId: 3, customerId: 4, rating: 1, text: "x".repeat(2001) })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("ReviewService.getCustomerReviews", () => {
  test("returns reviews for a customer", () => {
    const customerReviews = [{ id: 1, product_name: "Shirt" }] as any;
    const service = new ReviewService(mockReviewRepo({ findByCustomer: mock(() => customerReviews) }));

    expect(service.getCustomerReviews(4)).toEqual(customerReviews);
  });
});

describe("ReviewService.updateCustomerReview", () => {
  test("updates only the customer's own review", () => {
    const update = mock(() => {});
    const service = new ReviewService(
      mockReviewRepo({
        findCustomerReview: mock(() => ({ id: 8, product_id: 3 }) as any),
        updateCustomerReview: update,
      }),
    );

    expect(service.updateCustomerReview(8, 3, 4, 4, "Updated")).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith(8, 4, 4, "Updated");
    expect(service.updateCustomerReview(7, 3, 4, 4, "Updated")).toEqual({ ok: false, reason: "not_owned" });
  });
});

describe("ReviewService public policy", () => {
  test("normalizes public page requests and reads visible Rating data", () => {
    const findVisibleByProduct = mock(() => ({ reviews: [], page: 1, totalPages: 1, totalCount: 0 }));
    const getRatingSummary = mock(() => ({ average: 5, total: 1, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } }));
    const service = new ReviewService(mockReviewRepo({ findVisibleByProduct, getRatingSummary }));

    expect(service.getVisiblePage(3, 0)).toMatchObject({ page: 1 });
    expect(service.getRatingSummary(3)).toEqual(getRatingSummary());
    expect(findVisibleByProduct).toHaveBeenCalledWith(3, 1, 10);
  });
});

describe("ReviewService Customer seam", () => {
  test("rejects duplicate reviews before persistence", () => {
    const create = mock(() => 9);
    const service = new ReviewService(
      mockReviewRepo({
        findCustomerReview: mock(() => ({ id: 8 }) as any),
        createCustomerReview: create,
      }),
    );

    expect(service.createCustomerReview({ productId: 3, customerId: 4, rating: 5, text: "Great" })).toEqual({
      ok: false,
      reason: "duplicate",
    });
    expect(create).not.toHaveBeenCalled();
  });

  test("preserves hidden visibility when a Customer edits a review", () => {
    const update = mock(() => {});
    const service = new ReviewService(
      mockReviewRepo({
        findCustomerReview: mock(() => ({ id: 8, visible: false }) as any),
        updateCustomerReview: update,
      }),
    );

    expect(service.updateCustomerReview(8, 3, 4, 4, "Updated")).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith(8, 4, 4, "Updated");
  });
});

describe("ReviewService Admin policy", () => {
  test("exposes explicit hide and show operations", () => {
    const setVisibility = mock(() => {});
    const service = new ReviewService(mockReviewRepo({ setVisibility }));

    service.hideReview(8);
    service.showReview(8);

    expect(setVisibility).toHaveBeenNthCalledWith(1, 8, false);
    expect(setVisibility).toHaveBeenNthCalledWith(2, 8, true);
  });
});
