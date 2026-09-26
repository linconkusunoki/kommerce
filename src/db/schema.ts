import { db, getDatabaseUrl } from "./client.ts";
import { MIGRATIONS } from "./migrations.ts";
import type { SQL } from "bun";

export async function migrate(database: SQL = db) {
  await database.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtext('kommerce:migrations'))`;
    await tx`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))`;
    for (const migration of MIGRATIONS) {
      const [applied] = await tx`SELECT 1 FROM schema_migrations WHERE id = ${migration.id}`;
      if (!applied) {
        await tx.unsafe(migration.sql);
        await tx`INSERT INTO schema_migrations (id) VALUES (${migration.id})`;
      }
    }
  });
}

export function getDb() {
  if (!getDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL or DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, and DATABASE_PASSWORD are required",
    );
  }
  return db;
}
