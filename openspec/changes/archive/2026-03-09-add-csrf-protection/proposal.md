## Why

The application exposes state-mutating POST endpoints (login, logout, cart, checkout, and all admin operations) without CSRF protection, making it vulnerable to Cross-Site Request Forgery attacks where malicious third-party sites can trigger authenticated actions on behalf of users. Hono v4 ships a built-in `csrf` middleware, so the fix is low-cost and high-impact.

## What Changes

- Add Hono's built-in `csrf` middleware to validate the `Origin`/`Referer` header on all non-GET requests
- Expose a `GET /csrf-token` endpoint that returns a signed token for JavaScript clients that need it (checkout fetch calls)
- Embed a hidden `_csrf` token field in every server-rendered HTML form (login, cart, checkout, admin create/update/delete/logout forms)
- Update `AppEnv` context type to carry the CSRF token for use in JSX templates

## Capabilities

### New Capabilities

- `csrf-protection`: CSRF middleware setup, token generation helper, and form integration across all state-mutating routes

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- **Files affected**: `src/index.tsx` (middleware registration), `src/middleware/csrf.ts` (new), `src/types/context.ts` (AppEnv update), all form-bearing routes and components (`src/routes/admin/auth.tsx`, `src/routes/admin/products.tsx`, `src/routes/admin/categories.tsx`, `src/routes/admin/orders.tsx`, `src/routes/cart.tsx`, `src/routes/checkout.tsx`)
- **Dependencies**: `hono/csrf` (built-in, no new packages needed)
- **APIs**: New `GET /csrf-token` endpoint for JS clients
- **Breaking**: None — existing form-based flows continue to work, tokens are added transparently
