import { SQL } from "bun";

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const { DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD } = process.env;
  if (!DATABASE_HOST || !DATABASE_PORT || !DATABASE_NAME || !DATABASE_USER || !DATABASE_PASSWORD) return undefined;

  return `postgres://${encodeURIComponent(DATABASE_USER)}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT}/${encodeURIComponent(DATABASE_NAME)}?sslmode=require`;
}

export const db = new SQL(getDatabaseUrl() ?? "postgres://localhost/kommerce");
