### Requirement: Block cross-origin state-mutating requests
The system SHALL reject POST, PUT, PATCH, and DELETE requests whose `Origin` or `Referer` header does not match the request host, returning HTTP 403.

#### Scenario: Same-origin POST is accepted
- **WHEN** a browser submits a form POST from the same origin (e.g., `http://localhost:3000`)
- **THEN** the server processes the request normally

#### Scenario: Cross-origin POST is rejected
- **WHEN** a third-party site triggers a POST to any route with a mismatched `Origin` header
- **THEN** the server returns HTTP 403 and does not process the request

#### Scenario: GET requests are not affected
- **WHEN** a browser or crawler makes a GET request from any origin
- **THEN** the CSRF middleware does not interfere and the response is returned normally

### Requirement: CSRF middleware applied globally before routes
The system SHALL mount the CSRF middleware on all routes at application startup, before any route handlers are registered.

#### Scenario: Middleware is registered app-wide
- **WHEN** the server starts
- **THEN** the `csrf()` middleware from `hono/csrf` is registered via `app.use("*", csrf())` before route registration

### Requirement: CSRF token endpoint available for JS clients
The system SHALL expose `GET /csrf-token` that returns a JSON response `{ ok: true }` for JavaScript fetch clients to call before submitting state-mutating requests.

#### Scenario: Fetch client requests token
- **WHEN** a JavaScript client sends `GET /csrf-token`
- **THEN** the server responds with HTTP 200 and `{ "ok": true }`

#### Scenario: Token endpoint does not require authentication
- **WHEN** an unauthenticated client requests `GET /csrf-token`
- **THEN** the server responds with HTTP 200 and `{ "ok": true }`
