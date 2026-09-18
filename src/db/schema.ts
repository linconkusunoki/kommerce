import { Database } from "bun:sqlite";
import { join } from "path";
import { MIGRATION_SQL } from "./migrations.ts";

const DB_PATH = join(import.meta.dir, "../../kommerce.db");

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.exec("PRAGMA journal_mode = WAL");
    _db.exec("PRAGMA foreign_keys = ON");
  }
  return _db;
}

export function migrate() {
  const db = getDb();
  db.exec(MIGRATION_SQL);
  const columns = db.query("PRAGMA table_info(orders)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "customer_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customer_users(id) ON DELETE SET NULL");
  }
  const productColumns = db.query("PRAGMA table_info(products)").all() as { name: string }[];
  if (!productColumns.some((column) => column.name === "image_alt_text")) {
    db.exec("ALTER TABLE products ADD COLUMN image_alt_text TEXT");
  }
}
