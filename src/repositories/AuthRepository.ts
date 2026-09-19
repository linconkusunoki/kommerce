import type { Database } from "bun:sqlite";
import type { AdminUser, AdminUserWithHash, Customer, CustomerWithHash } from "../types/index.ts";
import type { IAuthRepository } from "./interfaces.ts";

export class SqliteAuthRepository implements IAuthRepository {
  constructor(private db: Database) {}

  findUserByUsername(username: string): AdminUserWithHash | null {
    return this.db.query("SELECT * FROM admin_users WHERE username = ?").get(username) as AdminUserWithHash | null;
  }

  createSession(userId: number): { sessionId: string; expiresAt: string } {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.db
      .prepare("INSERT INTO sessions (id, admin_user_id, expires_at) VALUES (?, ?, ?)")
      .run(sessionId, userId, expiresAt);
    return { sessionId, expiresAt };
  }

  findSession(sessionId: string): (AdminUser & { expires_at: string }) | null {
    return this.db
      .query(
        `SELECT a.id, a.username, s.expires_at
         FROM sessions s
         JOIN admin_users a ON s.admin_user_id = a.id
         WHERE s.id = ? AND s.expires_at > datetime('now')`,
      )
      .get(sessionId) as (AdminUser & { expires_at: string }) | null;
  }

  deleteSession(sessionId: string): void {
    this.db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  }

  findCustomerByEmail(email: string): CustomerWithHash | null {
    return this.db
      .query("SELECT id, email, password_hash, display_name FROM customer_users WHERE email = ?")
      .get(email) as CustomerWithHash | null;
  }

  createCustomer(email: string, passwordHash: string, displayName: string): number {
    const result = this.db
      .prepare("INSERT INTO customer_users (email, password_hash, display_name) VALUES (?, ?, ?)")
      .run(email, passwordHash, displayName);
    return Number(result.lastInsertRowid);
  }

  createCustomerSession(customerId: number): { sessionId: string; expiresAt: string } {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.db
      .prepare("INSERT INTO customer_sessions (id, customer_id, expires_at) VALUES (?, ?, ?)")
      .run(sessionId, customerId, expiresAt);
    return { sessionId, expiresAt };
  }

  findCustomerSession(sessionId: string): (Customer & { expires_at: string }) | null {
    return this.db
      .query(
        `SELECT c.id, c.email, c.display_name, s.expires_at
         FROM customer_sessions s
         JOIN customer_users c ON s.customer_id = c.id
         WHERE s.id = ? AND s.expires_at > datetime('now')`,
      )
      .get(sessionId) as (Customer & { expires_at: string }) | null;
  }

  updateCustomerDisplayName(customerId: number, displayName: string): void {
    this.db.prepare("UPDATE customer_users SET display_name = ? WHERE id = ?").run(displayName, customerId);
  }

  deleteCustomerSession(sessionId: string): void {
    this.db.prepare("DELETE FROM customer_sessions WHERE id = ?").run(sessionId);
  }
}
