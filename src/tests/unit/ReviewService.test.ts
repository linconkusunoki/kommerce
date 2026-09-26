import { describe, expect, mock, test } from "bun:test";
import { ReviewService, type ReviewRepositories } from "../../services/ReviewService.ts";

type ReviewRepositoryOverrides = {
  publicReviews?: Partial<ReviewRepositories["publicReviews"]>;
  customerReviews?: Partial<ReviewRepositories["customerReviews"]>;
  adminReviews?: Partial<ReviewRepositories["adminReviews"]>;
};

function mockReviewRepos(overrides: ReviewRepositoryOverrides = {}): ReviewRepositories {
  return {
    publicReviews: {
      findVisibleByProduct: mock(async () => ({ reviews: [], page: 1, totalPages: 1, totalCount: 0 })),
      getRatingSummary: mock(async () => ({ average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })),
      ...overrides.publicReviews,
    },
    customerReviews: {
      findByCustomer: mock(async () => []),
      findCustomerReview: mock(async () => null),
      createCustomerReview: mock(async () => 1),
      updateCustomerReview: mock(async () => {}),
      deleteCustomerReview: mock(async () => {}),
      ...overrides.customerReviews,
    },
    adminReviews: {
      findAllForAdmin: mock(async () => []),
      setVisibility: mock(async () => {}),
      deleteReview: mock(async () => {}),
      createAdminReview: mock(async () => 2),
      ...overrides.adminReviews,
    },
  };
}

describe("ReviewService.createCustomerReview", () => {
  test("normalizes valid input", async () => {
    const create = mock(async () => 9);
    const service = new ReviewService(
      mockReviewRepos({
        customerReviews: {
          createCustomerReview: create,
        },
      }),
    );

    expect(
      await service.createCustomerReview({ productId: 3, customerId: 4, rating: 5, text: "  Great fit  " }),
    ).toEqual({
      ok: true,
      id: 9,
    });
    expect(create).toHaveBeenCalledWith({ productId: 3, customerId: 4, rating: 5, text: "Great fit" });
  });

  test("rejects invalid ratings and overlong text", async () => {
    const create = mock(async () => 1);
    const service = new ReviewService(
      mockReviewRepos({
        customerReviews: {
          createCustomerReview: create,
        },
      }),
    );

    expect(await service.createCustomerReview({ productId: 3, customerId: 4, rating: 6, text: null })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(
      await service.createCustomerReview({ productId: 3, customerId: 4, rating: 1, text: "x".repeat(2001) }),
    ).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("ReviewService.getCustomerReviews", () => {
  test("returns reviews for a customer", async () => {
    const customerReviews = [{ id: 1, product_name: "Shirt" }] as any;
    const service = new ReviewService(
      mockReviewRepos({
        customerReviews: {
          findByCustomer: mock(async () => customerReviews),
        },
      }),
    );

    expect(await service.getCustomerReviews(4)).toEqual(customerReviews);
  });
});

describe("ReviewService.updateCustomerReview", () => {
  test("updates only the customer's own review", async () => {
    const update = mock(async () => {});
    const service = new ReviewService(
      mockReviewRepos({
        customerReviews: {
          findCustomerReview: mock(async () => ({ id: 8, product_id: 3 }) as any),
          updateCustomerReview: update,
        },
      }),
    );

    expect(await service.updateCustomerReview(8, 3, 4, 4, "Updated")).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith(8, 4, 4, "Updated");
    expect(await service.updateCustomerReview(7, 3, 4, 4, "Updated")).toEqual({ ok: false, reason: "not_owned" });
  });
});

describe("ReviewService public policy", () => {
  test("normalizes public page requests and reads visible Rating data", async () => {
    const findVisibleByProduct = mock(async () => ({ reviews: [], page: 1, totalPages: 1, totalCount: 0 }));
    const getRatingSummary = mock(async () => ({
      average: 5,
      total: 1,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
    }));
    const service = new ReviewService(mockReviewRepos({ publicReviews: { findVisibleByProduct, getRatingSummary } }));

    expect(await service.getVisiblePage(3, 0)).toMatchObject({ page: 1 });
    expect(await service.getRatingSummary(3)).toEqual(await getRatingSummary());
    expect(findVisibleByProduct).toHaveBeenCalledWith(3, 1, 10);
  });
});

describe("ReviewService Customer seam", () => {
  test("rejects duplicate reviews before persistence", async () => {
    const create = mock(async () => 9);
    const service = new ReviewService(
      mockReviewRepos({
        customerReviews: {
          findCustomerReview: mock(async () => ({ id: 8 }) as any),
          createCustomerReview: create,
        },
      }),
    );

    expect(await service.createCustomerReview({ productId: 3, customerId: 4, rating: 5, text: "Great" })).toEqual({
      ok: false,
      reason: "duplicate",
    });
    expect(create).not.toHaveBeenCalled();
  });

  test("preserves hidden visibility when a Customer edits a review", async () => {
    const update = mock(async () => {});
    const service = new ReviewService(
      mockReviewRepos({
        customerReviews: {
          findCustomerReview: mock(async () => ({ id: 8, visible: false }) as any),
          updateCustomerReview: update,
        },
      }),
    );

    expect(await service.updateCustomerReview(8, 3, 4, 4, "Updated")).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith(8, 4, 4, "Updated");
  });
});

describe("ReviewService Admin policy", () => {
  test("exposes explicit hide and show operations", async () => {
    const setVisibility = mock(async () => {});
    const service = new ReviewService(
      mockReviewRepos({
        adminReviews: {
          setVisibility,
        },
      }),
    );

    await service.hideReview(8);
    await service.showReview(8);

    expect(setVisibility).toHaveBeenNthCalledWith(1, 8, false);
    expect(setVisibility).toHaveBeenNthCalledWith(2, 8, true);
  });
});
