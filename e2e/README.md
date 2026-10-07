# End-to-end tests

Playwright specs covering the storefront, customer account, and admin use cases.

The same command runs the suite locally and against production — one variable
(`E2E_TARGET=prod`) is the only difference, and no separate setup is needed.

```sh
bun run test:e2e          # local, starts the dev server itself
bun run test:e2e:prod     # production
```

Both run every spec, including the ones that create and delete products,
categories and orders. This project is a portfolio demo, so the target database
is expected to absorb that.

## Target and credentials

`E2E_BASE_URL` wins if set, otherwise `E2E_TARGET=prod` selects production and
anything else means local on `E2E_PORT` (default `3100`, chosen so the suite
never fights another process for port 3000).

The suite loads `.env` itself, so the admin password comes from
`ADMIN_INITIAL_PASSWORD` with no extra setup. Override with `E2E_ADMIN_PASSWORD`
if a target's admin password differs.

For production specifically, no server is started, the suite runs single-worker
because every spec shares one database, timeouts double, and `global-setup`
warms the target first — a Render free-plan instance spins down when idle and
takes roughly a minute to boot.

Prerequisites for local runs: Postgres reachable (`docker compose up -d`) and
the schema migrated and seeded (`bun run db:migrate`, `ADMIN_INITIAL_PASSWORD=... bun run db:seed`).

## Useful variations

```sh
bun run test:e2e:smoke          # skip the @destructive specs
bun run test:e2e:prod:smoke     # the same, against production
bun run test:e2e:ui             # Playwright inspector
bun run test:e2e e2e/specs/cart.spec.ts   # a single file
bun run test:e2e --retries=1   # reruns failures with a trace for debugging
```

Specs that need to sign in as the same Customer twice read `E2E_CUSTOMER_EMAIL`
and `E2E_CUSTOMER_PASSWORD`; those two specs skip when unset, since every other
spec registers its own throwaway Customer.

## What leaves residue

Specs delete the products, categories, variants and reviews they create. Two
things cannot be cleaned up, because the app has no way to remove them:

- **Customers.** Each spec registers a throwaway Customer, leaving a row with an
  `e2e-*@example.test` address.
- **Orders.** Guest checkouts and the Admin order specs leave real orders behind.

Seeded stock is finite, so repeated runs do slowly draw down inventory. Specs
spread their picks across the catalogue and prefer variants with stock, so this
takes many runs to matter.

## Layout

```text
e2e/
  playwright.config.ts   # projects, dev server, timeouts
  global-setup.ts        # warms a cold remote target
  fixtures/
    env.ts               # target and credential resolution
    data.ts              # unique fixture names and emails
    flows.ts             # shared journeys (sign in, cart, checkout, admin CRUD)
    test.ts              # extended test, pre-authenticated pages
  specs/                # one file per area of the app
```

`fixtures/test.ts` provides an `adminPage` and a `customerPage` that are already
signed in, and accepts `confirm()` dialogs on every page, which Admin delete
actions depend on.

Specs that create or delete catalog records carry the `@destructive` tag, which
is what `test:e2e:smoke` filters out.
