import type { ProductPageData } from "./loadProductPage.ts";

export function ProductReviews({ data }: { data: ProductPageData }) {
  const { product, ratingSummary, reviewPage, customer, customerReview } = data;

  return (
    <section class="reviews-section" aria-labelledby="reviews-heading">
      <div class="reviews-heading">
        <span class="product-detail-category">Customer feedback</span>
        <h2 id="reviews-heading">Customer reviews</h2>
        <p>See what customers think about this product.</p>
      </div>

      <div class="reviews-layout">
        <aside class="reviews-sidebar">
          <div class="rating-summary">
            <strong>{ratingSummary.average.toFixed(1)}</strong>
            <span class="review-stars" role="img" aria-label={`${ratingSummary.average.toFixed(1)} out of 5 stars`}>
              <span aria-hidden="true">
                {"\u2605".repeat(Math.round(ratingSummary.average))}
                {"\u2606".repeat(5 - Math.round(ratingSummary.average))}
              </span>
            </span>
            <span>out of 5</span>
            <span class="rating-count">
              {ratingSummary.total} global {ratingSummary.total === 1 ? "rating" : "ratings"}
            </span>
          </div>

          <div class="rating-distribution" aria-label="Rating distribution">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div class="rating-distribution-row">
                <span>{rating} stars</span>
                <span class="rating-bar">
                  <span
                    style={`width: ${ratingSummary.total ? (ratingSummary.distribution[rating as 1 | 2 | 3 | 4 | 5] / ratingSummary.total) * 100 : 0}%`}
                  />
                </span>
                <span>{ratingSummary.distribution[rating as 1 | 2 | 3 | 4 | 5]}</span>
              </div>
            ))}
          </div>

          {customer ? (
            <form
              method="post"
              action={
                customerReview
                  ? `/products/${product.slug}/reviews/${customerReview.id}/edit`
                  : `/products/${product.slug}/reviews`
              }
              class="review-form"
            >
              <h3>{customerReview ? "Edit your review" : "Review this product"}</h3>
              <div class="form-group">
                <label for="review-rating">Rating</label>
                <select id="review-rating" name="rating" required>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option value={rating} selected={customerReview?.rating === rating}>
                      {rating} / 5
                    </option>
                  ))}
                </select>
              </div>
              <div class="form-group">
                <label for="review-text">
                  Review text <span class="form-hint">(optional)</span>
                </label>
                <textarea id="review-text" name="text" maxlength={2000} rows={4}>
                  {customerReview?.text ?? ""}
                </textarea>
              </div>
              <div class="review-form-actions">
                <button type="submit" class="btn btn-primary">
                  {customerReview ? "Update review" : "Post review"}
                </button>
                {customerReview && (
                  <button
                    type="submit"
                    formAction={`/products/${product.slug}/reviews/${customerReview.id}/delete`}
                    class="btn btn-outline"
                  >
                    Delete review
                  </button>
                )}
              </div>
            </form>
          ) : (
            <p class="review-sign-in">
              <a href="/account/login">Sign in</a> or <a href="/account/register">create an account</a> to write a
              review.
            </p>
          )}
        </aside>

        <div class="reviews-content">
          <div class="reviews-content-header">
            <strong>Top reviews</strong>
            {reviewPage.totalPages > 1 && (
              <span>
                Page {reviewPage.page} of {reviewPage.totalPages}
              </span>
            )}
          </div>
          {reviewPage.reviews.length > 0 ? (
            <div class="review-list">
              {reviewPage.reviews.map((review) => (
                <article class="review-card">
                  <div class="review-card-header">
                    <div>
                      <strong>{review.author_name}</strong>
                      <span class="review-author-type">{review.is_admin ? "Admin" : "Customer"}</span>
                    </div>
                    <time datetime={review.created_at}>{review.created_at}</time>
                  </div>
                  <div class="review-rating" role="img" aria-label={`${review.rating} out of 5 stars`}>
                    <span aria-hidden="true">
                      {"\u2605".repeat(review.rating)}
                      {"\u2606".repeat(5 - review.rating)}
                    </span>
                    <span class="sr-only">{review.rating} out of 5 stars</span>
                  </div>
                  {review.text && <p>{review.text}</p>}
                </article>
              ))}
            </div>
          ) : (
            <p class="reviews-empty">No reviews yet.</p>
          )}
          {reviewPage.totalPages > 1 && (
            <nav class="review-pagination" aria-label="Review pages">
              {Array.from({ length: reviewPage.totalPages }, (_, index) => index + 1).map((reviewPageNumber) => (
                <a
                  class={reviewPageNumber === reviewPage.page ? "active" : ""}
                  href={`/products/${product.slug}?page=${reviewPageNumber}`}
                  aria-current={reviewPageNumber === reviewPage.page ? "page" : undefined}
                >
                  {reviewPageNumber}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
