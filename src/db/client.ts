import { SQL } from "bun";

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
}

export const db = new SQL(getDatabaseUrl() ?? "postgres://localhost/kommerce");
