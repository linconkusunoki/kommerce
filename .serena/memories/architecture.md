# Kommerce Architecture

## Layer Structure
```
src/
  types/index.ts          ← all shared TypeScript types
  repositories/
    interfaces.ts         ← I* interfaces for all repos
    CartRepository.ts     ← SqliteCartRepository
    ProductRepository.ts  ← SqliteProductRepository
    CategoryRepository.ts ← SqliteCategoryRepository
    OrderRepository.ts    ← SqliteOrderRepository
    VariantRepository.ts  ← SqliteVariantRepository
    AuthRepository.ts     ← SqliteAuthRepository
    VisitorRepository.ts  ← SqliteVisitorRepository
    DashboardRepository.ts← SqliteDashboardRepository
  services/
    CartService.ts        ← depends on ICartRepository + IVariantRepository
    ProductService.ts     ← depends on IProductRepository + IVariantRepository
    CategoryService.ts    ← depends on ICategoryRepository
    OrderService.ts       ← depends on IOrderRepository + ICartRepository
    AuthService.ts        ← depends on IAuthRepository
    DashboardService.ts   ← depends on IDashboardRepository
  db/
    schema.ts             ← getDb() singleton + migrate()
    migrations.ts         ← MIGRATION_SQL constant (used by schema + tests)
  lib/
    utils.ts              ← slugify(), generateOrderNumber()
    email.ts              ← sendOrderConfirmation()
  middleware/
    auth.ts               ← uses SqliteAuthRepository
    visitor.ts            ← uses SqliteVisitorRepository
  routes/                 ← thin HTTP adapters, instantiate services at module level
  tests/
    unit/                 ← service tests with mock repos (no DB)
    integration/          ← repo tests with in-memory SQLite DB
      helpers.ts          ← createTestDb(), seed helpers
```

## Key Patterns
- Repos take `Database` in constructor → injectable for tests
- Routes instantiate repos/services at module level using `getDb()` singleton
- Integration tests use `new Database(":memory:")` + MIGRATION_SQL
- Unit tests use `mock()` from bun:test for repo interfaces
- OrderRepository.create() handles the full transaction: insert order + items + decrement stock + clear cart (atomically)

## Running Tests
```bash
bun test src/tests          # all tests
bun test src/tests/unit     # unit only
bun test src/tests/integration  # integration only
```
Results: 66 tests, 0 failures
