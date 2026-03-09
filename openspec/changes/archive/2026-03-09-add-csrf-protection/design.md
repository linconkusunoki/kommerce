## Context

Kommerce is a Hono + Bun e-commerce application with server-rendered JSX. It uses cookie-based session authentication (`session_id`, `HttpOnly`, `SameSite=Lax`) for the admin area, and visitor sessions for public cart/checkout flows. All state-mutating operations happen via HTML form POST submissions. There is currently no CSRF protection; the existing `SameSite=Lax` cookie attribute provides partial protection for cross-site navigations but not for same-site or same-origin attacks initiated via subresource injection.

## Goals / Non-Goals

**Goals:**
- Block CSRF attacks on all POST/PUT/PATCH/DELETE routes
- Integrate with minimal code changes — no external packages
- Work transparently with existing server-rendered HTML forms
- Provide a token endpoint for any fetch-based requests (checkout)

**Non-Goals:**
- SPA-style token management (no localStorage, no refresh logic)
- Per-resource token rotation (one token per session is sufficient)
- Protection of GET/HEAD requests (they MUST be idempotent)

## Decisions

### Decision 1: Use Hono's built-in `csrf` middleware (origin-checking mode)

Hono v4 ships `hono/csrf` which validates the `Origin` or `Referer` header against the request host. This is the simplest and most reliable approach for a server-rendered app — no token storage, no hidden fields needed for most flows.

**Alternative considered**: Double-submit cookie pattern (generate a random token, store in cookie and embed in every form, compare on POST). This gives stronger defense in depth but requires more code: token generation, cookie management, form helpers, and template changes for every form.

**Choice**: Use origin-checking as the primary defense (Hono built-in). Additionally add a lightweight token helper for the checkout route which uses `fetch()`, so the origin header is always present and the check naturally passes for same-origin XHR while blocking cross-origin requests.

**Why not double-submit too?** The app uses `SameSite=Lax` cookies. Combined with origin-checking, this already defeats all known practical CSRF vectors. The complexity of injecting tokens into every JSX form is not justified for this threat model.

### Decision 2: Apply middleware at the app level, excluding the `GET /csrf-token` endpoint

The `csrf` middleware is mounted globally via `app.use("*", csrf())`. The `GET /csrf-token` endpoint is a read-only route and is exempt by the middleware's own method filtering.

### Decision 3: `GET /csrf-token` returns `Origin` header value for fetch clients

For JavaScript fetch calls (e.g., checkout), the browser automatically includes the `Origin` header, so no token is strictly needed. The endpoint is provided as a no-op compatibility shim — it returns `{ ok: true }` — ensuring future JS clients have a hook to integrate without architectural changes.

## Risks / Trade-offs

- **Reverse proxy stripping Origin header** → Mitigation: Document that the app must be deployed behind a reverse proxy that preserves `Origin`/`Referer` headers (standard behavior for nginx/caddy).
- **Hono's `csrf` middleware rejects requests with no Origin/Referer** → Mitigation: This is acceptable; all browser-initiated POST requests include one of these headers. Non-browser API clients can be exempted via the `origin` option if needed in the future.
- **SameSite=Lax does not protect subresource POST** → Mitigation: Origin-checking covers this gap.

## Migration Plan

1. Install middleware in `src/index.tsx` before route registration.
2. Verify all POST routes respond correctly in development with a browser.
3. Deploy — no database migrations or cookie changes required.
4. Rollback: remove the `csrf()` middleware call from `src/index.tsx`.

## Open Questions

- None. Hono's built-in middleware is the accepted pattern for this stack.
