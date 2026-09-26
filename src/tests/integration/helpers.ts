import { SQL } from "bun";
import { migrate } from "../../db/schema.ts";

const baseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

export const postgresAvailable = await canConnect();

async function canConnect() {
  if (!baseUrl) {
    console.warn("Skipping PostgreSQL integration tests: set DATABASE_URL or TEST_DATABASE_URL");
    return false;
  }

  const database = new SQL(baseUrl);
  try {
    await database`SELECT 1`;
    return true;
  } catch (error) {
    console.warn(`Skipping PostgreSQL integration tests: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  } finally {
    await database.close({ timeout: 1 }).catch(() => {});
  }
}

function schemaUrl(schema: string) {
  const separator = baseUrl!.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}options=-csearch_path%3D${schema}`;
}

export async function createTestDb() {
  if (!baseUrl) throw new Error("PostgreSQL integration tests require DATABASE_URL or TEST_DATABASE_URL");

  const schema = `test_${crypto.randomUUID().replaceAll("-", "")}`;
  const admin = new SQL({ url: baseUrl, max: 1, idleTimeout: 1 });
  await admin.unsafe(`CREATE SCHEMA "${schema}"`);
  await admin.close({ timeout: 1 });

  const database = new SQL({ url: schemaUrl(schema), max: 1, idleTimeout: 1 });
  await migrate(database);
  return database;
}

export async function seedCategory(db: SQL, overrides: Partial<{ name: string; slug: string }> = {}) {
  const name = overrides.name ?? "Test Category";
  const slug = overrides.slug ?? "test-category";
  const [row] = await db`INSERT INTO categories (name, slug, sort_order) VALUES (${name}, ${slug}, 0) RETURNING id`;
  return Number(row.id);
}

export async function seedProduct(
  db: SQL,
  categoryId: number,
  overrides: Partial<{ name: string; slug: string; price: number; featured: boolean }> = {},
) {
  const name = overrides.name ?? "Test Product";
  const slug = overrides.slug ?? "test-product";
  const price = overrides.price ?? 29.99;
  const featured = overrides.featured ?? false;
  const [row] = await db`INSERT INTO products (name, slug, description, price, category_id, featured)
    VALUES (${name}, ${slug}, '', ${price}, ${categoryId}, ${featured}) RETURNING id`;
  return Number(row.id);
}

export async function seedVariant(
  db: SQL,
  productId: number,
  overrides: Partial<{ size: string; color: string; stock: number; sku: string }> = {},
) {
  const size = overrides.size ?? "M";
  const color = overrides.color ?? "Black";
  const stock = overrides.stock ?? 10;
  const sku = overrides.sku ?? `sku-${crypto.randomUUID()}`;
  const [row] = await db`INSERT INTO product_variants (product_id, size, color, stock, sku)
    VALUES (${productId}, ${size}, ${color}, ${stock}, ${sku}) RETURNING id`;
  return Number(row.id);
}

export async function seedVisitorSession(db: SQL, sessionId = `test-session-${crypto.randomUUID()}`) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db`INSERT INTO visitor_sessions (id, expires_at) VALUES (${sessionId}, ${expiresAt})`;
  return sessionId;
}
