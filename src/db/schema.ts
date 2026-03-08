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
  getDb().exec(MIGRATION_SQL);
}
