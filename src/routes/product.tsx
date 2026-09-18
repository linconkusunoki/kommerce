import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { Layout } from "../components/Layout.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { requireCustomerAuth } from "../middleware/customerAuth.ts";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

export function createProduct(services: Services) {
  const product = new Hono<AppEnv>();

  product.get("/products/:slug", (c) => {
    c.header("Cache-Control", "private, no-store");
    const slug = c.req.param("slug");
    const visitorId = c.get("visitorId");
    const cartCount = services.cartService.getCount(visitorId);
    const added = c.req.query("added");
    const reviewError = c.req.query("review_error");
    const requestedPage = Number.parseInt(c.req.query("page") ?? "1", 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const p = services.productService.getBySlug(slug);

    if (!p) {
      return c.html(
        <Layout title="Not Found" styles={["/styles/pages/product-detail.css"]}>
          <Header cartCount={cartCount} />
          <main class="section">
            <div class="container" style="text-align: center; padding: 4rem 0;">
              <h1>Product not found</h1>
              <p style="color: var(--color-text-muted); margin: 1rem 0;">The product you're looking for doesn't exist.</p>
              <a href="/" class="btn btn-primary">Back to Home</a>
            </div>
          </main>
          <Footer />
        </Layout>,
        404,
      );
    }

    const variants = services.productService.getVariants(p.id);
    const sizes = [...new Set(variants.map((v) => v.size))];
    const colors = [...new Set(variants.map((v) => v.color))];
    const onSale = p.compare_at_price != null && p.compare_at_price > p.price;
    const reviewPage = services.reviewService.getVisiblePage(p.id, page);
    const ratingSummary = services.reviewService.getRatingSummary(p.id);
    const customerSessionId = getCookie(c, "customer_session_id");
    const customer = customerSessionId ? services.authService.getCustomerSession(customerSessionId) : null;
    const customerReview = customer ? services.reviewService.getCustomerReview(p.id, customer.id) : null;

    if (page > reviewPage.totalPages) return c.redirect(`/products/${p.slug}?page=${reviewPage.totalPages}`);

    return c.html(
      <Layout title={p.name} styles={["/styles/pages/product-detail.css"]}>
        <Header cartCount={cartCount} />
        <main>
          <div class="container">
            <nav class="breadcrumb">
              <a href="/">Home</a>
              <span class="breadcrumb-sep">/</span>
              <span>{p.category_name}</span>
              <span class="breadcrumb-sep">/</span>
              <span>{p.name}</span>
            </nav>

            {added && (
              <div class="alert alert-success">
                Added to cart! <a href="/cart" style="font-weight: 600; text-decoration: underline;">View cart</a>
              </div>
            )}
            {reviewError && <div class="alert alert-error">{reviewError}</div>}

            <div class="product-detail">
              <div class="product-detail-image">
                {p.image_url ? <img src={p.image_url} alt={p.image_alt_text || p.name} /> : <div class="product-detail-placeholder" />}
                {onSale && <span class="badge badge-sale">Sale</span>}
              </div>

              <div class="product-detail-info">
                <span class="product-detail-category">{p.category_name}</span>
                <h1 class="product-detail-title">{p.name}</h1>
                <div class="product-detail-price">
                  <span class={onSale ? "price-lg price-sale" : "price-lg"}>${p.price.toFixed(2)}</span>
                  {onSale && <span class="price-lg price-compare">${p.compare_at_price!.toFixed(2)}</span>}
                </div>
                {p.description && <p class="product-detail-desc">{p.description}</p>}

                <form method="post" action="/cart/add" class="product-form">
                  <input type="hidden" name="product_id" value={String(p.id)} />
                  <div class="product-option">
                    <label class="product-option-label">Size</label>
                    <div class="option-chips">
                      {sizes.map((size, i) => (
                        <label class="chip">
                          <input type="radio" name="size" value={size} checked={i === 0} />
                          <span class="chip-label">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div class="product-option">
                    <label class="product-option-label">Color</label>
                    <div class="option-chips">
                      {colors.map((color, i) => (
                        <label class="chip">
                          <input type="radio" name="color" value={color} checked={i === 0} />
                          <span class="chip-label">{color}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div class="product-option">
                    <label class="product-option-label">Quantity</label>
                    <select name="quantity" class="quantity-select">
                      {[1, 2, 3, 4, 5].map((n) => <option value={String(n)}>{n}</option>)}
                    </select>
                  </div>
                  <input
                    type="hidden"
                    name="variants"
                    value={JSON.stringify(variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock })))}
                  />
                  <button type="submit" class="btn btn-primary btn-lg btn-block">Add to Cart</button>
                </form>
              </div>
            </div>

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
                    <span class="review-stars" aria-label={`${ratingSummary.average.toFixed(1)} out of 5 stars`}>
                      <span aria-hidden="true">{"\u2605".repeat(Math.round(ratingSummary.average))}{"\u2606".repeat(5 - Math.round(ratingSummary.average))}</span>
                    </span>
                    <span>out of 5</span>
                    <span class="rating-count">{ratingSummary.total} global {ratingSummary.total === 1 ? "rating" : "ratings"}</span>
                  </div>

                  <div class="rating-distribution" aria-label="Rating distribution">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div class="rating-distribution-row">
                        <span>{rating} stars</span>
                        <span class="rating-bar"><span style={`width: ${ratingSummary.total ? (ratingSummary.distribution[rating as 1 | 2 | 3 | 4 | 5] / ratingSummary.total) * 100 : 0}%`} /></span>
                        <span>{ratingSummary.distribution[rating as 1 | 2 | 3 | 4 | 5]}</span>
                      </div>
                    ))}
                  </div>

                  {customer ? (
                    <form
                      method="post"
                      action={customerReview ? `/products/${p.slug}/reviews/${customerReview.id}/edit` : `/products/${p.slug}/reviews`}
                      class="review-form"
                    >
                      <h3>{customerReview ? "Edit your review" : "Review this product"}</h3>
                      <div class="form-group">
                        <label for="review-rating">Rating</label>
                        <select id="review-rating" name="rating" required>
                          {[1, 2, 3, 4, 5].map((rating) => <option value={rating} selected={customerReview?.rating === rating}>{rating} / 5</option>)}
                        </select>
                      </div>
                      <div class="form-group">
                        <label for="review-text">Review text <span class="form-hint">(optional)</span></label>
                        <textarea id="review-text" name="text" maxlength="2000" rows={4}>{customerReview?.text ?? ""}</textarea>
                      </div>
                      <div class="review-form-actions">
                        <button type="submit" class="btn btn-primary">{customerReview ? "Update review" : "Post review"}</button>
                        {customerReview && <button type="submit" formAction={`/products/${p.slug}/reviews/${customerReview.id}/delete`} class="btn btn-outline">Delete review</button>}
                      </div>
                    </form>
                  ) : (
                    <p class="review-sign-in"><a href="/account/login">Sign in</a> or <a href="/account/register">create an account</a> to write a review.</p>
                  )}
                </aside>

                <div class="reviews-content">
                  <div class="reviews-content-header">
                    <strong>Top reviews</strong>
                    {reviewPage.totalPages > 1 && <span>Page {reviewPage.page} of {reviewPage.totalPages}</span>}
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
                          <div class="review-rating" aria-label={`${review.rating} out of 5 stars`}>
                            <span aria-hidden="true">{"\u2605".repeat(review.rating)}{"\u2606".repeat(5 - review.rating)}</span>
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
                        <a class={reviewPageNumber === reviewPage.page ? "active" : ""} href={`/products/${p.slug}?page=${reviewPageNumber}`} aria-current={reviewPageNumber === reviewPage.page ? "page" : undefined}>
                          {reviewPageNumber}
                        </a>
                      ))}
                    </nav>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </Layout>
    );
  });

  product.post("/products/:slug/reviews", requireCustomerAuth, async (c) => {
    const product = services.productService.getBySlug(c.req.param("slug"));
    if (!product) return c.notFound();
    const customer = c.get("customer");
    const existing = services.reviewService.getCustomerReview(product.id, customer.id);
    if (existing) return c.redirect(`/products/${product.slug}?review_error=You+already+reviewed+this+product`);
    const body = await c.req.parseBody();
    const reviewId = services.reviewService.createCustomerReview({
      productId: product.id,
      customerId: customer.id,
      rating: Number.parseInt(String(body.rating ?? ""), 10),
      text: String(body.text ?? ""),
    });
    if (!reviewId) return c.redirect(`/products/${product.slug}?review_error=Rating+must+be+1+to+5+and+text+must+be+under+2000+characters`);
    return c.redirect(`/products/${product.slug}`);
  });

  product.post("/products/:slug/reviews/:reviewId/edit", requireCustomerAuth, async (c) => {
    const product = services.productService.getBySlug(c.req.param("slug"));
    if (!product) return c.notFound();
    const customer = c.get("customer");
    const body = await c.req.parseBody();
    const updated = services.reviewService.updateCustomerReview(
      Number.parseInt(c.req.param("reviewId"), 10),
      product.id,
      customer.id,
      Number.parseInt(String(body.rating ?? ""), 10),
      String(body.text ?? ""),
    );
    if (!updated) return c.redirect(`/products/${product.slug}?review_error=Review+could+not+be+updated`);
    return c.redirect(`/products/${product.slug}`);
  });

  product.post("/products/:slug/reviews/:reviewId/delete", requireCustomerAuth, (c) => {
    const product = services.productService.getBySlug(c.req.param("slug"));
    if (!product) return c.notFound();
    services.reviewService.deleteCustomerReview(Number.parseInt(c.req.param("reviewId"), 10), c.get("customer").id);
    return c.redirect(`/products/${product.slug}`);
  });

  return product;
}
