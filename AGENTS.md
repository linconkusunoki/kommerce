# Route Structure

Keep route files as HTTP adapters:

- Read params, query values, cookies, and form data.
- Call application functions or services.
- Return HTML, redirects, or status codes.
- Do not put large JSX trees or multi-step data orchestration in route handlers.

Separate responsibilities by layer:

- Routes own HTTP concerns.
- Page loaders own page-specific data assembly and view models.
- Components own JSX presentation.
- Services own business operations.

Use page-specific modules instead of generic controller or service abstractions:

```text
src/
  routes/
    product.ts              # Hono route registration
  pages/
    product/
      loadProductPage.ts    # service orchestration and view model
      ProductPage.tsx       # page JSX
      ProductNotFound.tsx
      ProductReviews.tsx
```

For POST routes, parse the form in the route, pass validated input to an action or service, then redirect or render an error. Do not create generic `BaseController`, `PageService`, or universal loader abstractions.

Apply this structure when a route becomes difficult to navigate. Leave small routes unchanged.

## Agent skills

### Issue tracker

Issues and specs use local Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout with root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
