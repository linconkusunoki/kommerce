import { Database } from "bun:sqlite";
import { MIGRATION_SQL } from "../../db/migrations.ts";

export function createTestDb(): Database {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(MIGRATION_SQL);
  return db;
}

export function seedCategory(db: Database, overrides: Partial<{ name: string; slug: string }> = {}) {
  const name = overrides.name ?? "Test Category";
  const slug = overrides.slug ?? "test-category";
  const result = db
    .prepare("INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, 0)")
    .run(name, slug);
  return Number(result.lastInsertRowid);
}

export function seedProduct(
  db: Database,
  categoryId: number,
  overrides: Partial<{ name: string; slug: string; price: number; featured: number }> = {},
) {
  const name = overrides.name ?? "Test Product";
  const slug = overrides.slug ?? "test-product";
  const price = overrides.price ?? 29.99;
  const featured = overrides.featured ?? 0;
  const result = db
    .prepare(
      "INSERT INTO products (name, slug, description, price, category_id, featured) VALUES (?, ?, '', ?, ?, ?)",
    )
    .run(name, slug, price, categoryId, featured);
  return Number(result.lastInsertRowid);
}

export function seedVariant(
  db: Database,
  productId: number,
  overrides: Partial<{ size: string; color: string; stock: number; sku: string }> = {},
) {
  const size = overrides.size ?? "M";
  const color = overrides.color ?? "Black";
  const stock = overrides.stock ?? 10;
  const sku = overrides.sku ?? `sku-${Math.random().toString(36).slice(2)}`;
  const result = db
    .prepare("INSERT INTO product_variants (product_id, size, color, stock, sku) VALUES (?, ?, ?, ?, ?)")
    .run(productId, size, color, stock, sku);
  return Number(result.lastInsertRowid);
}

export function seedVisitorSession(db: Database, sessionId = "test-session") {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO visitor_sessions (id, expires_at) VALUES (?, ?)").run(sessionId, expiresAt);
  return sessionId;
}
