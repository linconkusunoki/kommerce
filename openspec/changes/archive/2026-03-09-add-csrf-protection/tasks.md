## 1. Middleware Registration

- [x] 1.1 Import `csrf` from `hono/csrf` in `src/index.tsx`
- [x] 1.2 Mount `app.use("*", csrf())` before all route registrations in `src/index.tsx`
- [x] 1.3 Add `GET /csrf-token` endpoint in `src/index.tsx` returning `{ ok: true }`

## 2. Verification

- [x] 2.1 Manually test that a same-origin form POST (e.g., admin login) still works correctly
- [x] 2.2 Verify that a cross-origin POST (via curl with a mismatched Origin header) returns HTTP 403
- [x] 2.3 Verify `GET /csrf-token` returns `{ "ok": true }` with HTTP 200
