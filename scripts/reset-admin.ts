import { db } from "../src/db/client.ts";
import { getDb } from "../src/db/schema.ts";

/**
 * Resets the initial admin's password.
 *
 * `db:seed` creates the admin only when none exists, so a lost
 * ADMIN_INITIAL_PASSWORD cannot be recovered by re-seeding. This rewrites the
 * stored hash for every admin, matching how scripts/seed.ts creates it.
 */
const password = process.argv[2];
if (!password) {
  throw new Error("Usage: bun run db:reset-admin <new-password>");
}

getDb();
const hash = await Bun.password.hash(password, { algorithm: "bcrypt" });
const admins = await db`UPDATE admin_users SET password_hash = ${hash} RETURNING username`;

if (admins.length === 0) {
  throw new Error("No admin user exists yet. Run bun run db:seed first.");
}

for (const admin of admins) {
  console.log(`Reset password for "${admin.username}"`);
}

await db.close();
