/**
 * Environment resolution for the e2e suite.
 *
 * One switch decides the target: E2E_TARGET=prod, which the `test:e2e:prod`
 * scripts set. Everything else behaves identically either way, so the same
 * command runs the suite locally and against production.
 */

import { config as loadEnv } from "dotenv";

// `bun run <script>` does not pass .env to the process it spawns, so load it
// here. Real environment variables win, matching Bun's own precedence.
loadEnv({ path: [".env.local", ".env"], quiet: true });

const LOCAL_HOST = /^https?:\/\/(localhost|127\.0\.0\.1)/;

const PROD_BASE_URL = "https://kommerce-ilye.onrender.com";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** A dedicated port keeps the suite off whatever else is listening on 3000. */
export const localPort = readEnv("E2E_PORT") ?? "3100";

const target = readEnv("E2E_TARGET");

export const baseURL = readEnv("E2E_BASE_URL") ?? (target === "prod" ? PROD_BASE_URL : `http://localhost:${localPort}`);
export const isLocalTarget = LOCAL_HOST.test(baseURL);

export const admin = {
  username: readEnv("E2E_ADMIN_USERNAME") ?? "admin",
  // ADMIN_INITIAL_PASSWORD seeded the admin and is already in .env, so the suite
  // needs no extra setup. Override with E2E_ADMIN_PASSWORD if a target's admin
  // password differs.
  password: readEnv("E2E_ADMIN_PASSWORD") ?? readEnv("ADMIN_INITIAL_PASSWORD") ?? "",
};

export const customer = {
  email: readEnv("E2E_CUSTOMER_EMAIL") ?? "",
  password: readEnv("E2E_CUSTOMER_PASSWORD") ?? "",
};

/** Admin routes need a password, which the suite cannot invent. */
export const adminConfigured = admin.password.length > 0;

/** A reusable customer login, if one was configured. */
export const customerConfigured = customer.email.length > 0 && customer.password.length > 0;
