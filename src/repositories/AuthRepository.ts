import type { SQL } from "bun";
import type { AdminUser, AdminUserWithHash, Customer, CustomerWithHash } from "../types/index.ts";
import type { IAdminAuthRepository, ICustomerAuthRepository } from "./interfaces.ts";

export class PostgresAuthRepository implements IAdminAuthRepository, ICustomerAuthRepository {
  constructor(private db: SQL) {}
  async findUserByUsername(username: string) {
    return ((await this.db`SELECT * FROM admin_users WHERE username = ${username}`)[0] as AdminUserWithHash) ?? null;
  }
  async createSession(userId: number) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    await this.db`INSERT INTO sessions (id, admin_user_id, expires_at) VALUES (${sessionId}, ${userId}, ${expiresAt})`;
    return { sessionId, expiresAt };
  }
  async findSession(sessionId: string) {
    return (
      ((
        await this
          .db`SELECT a.id, a.username, s.expires_at FROM sessions s JOIN admin_users a ON s.admin_user_id = a.id WHERE s.id = ${sessionId} AND s.expires_at > to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
      )[0] as AdminUser & { expires_at: string }) ?? null
    );
  }
  async deleteSession(sessionId: string) {
    await this.db`DELETE FROM sessions WHERE id = ${sessionId}`;
  }
  async findCustomerByEmail(email: string) {
    return (
      ((
        await this.db`SELECT id, email, password_hash, display_name FROM customer_users WHERE email = ${email}`
      )[0] as CustomerWithHash) ?? null
    );
  }
  async createCustomer(email: string, passwordHash: string, displayName: string) {
    const [row] = await this
      .db`INSERT INTO customer_users (email, password_hash, display_name) VALUES (${email}, ${passwordHash}, ${displayName}) RETURNING id`;
    return Number(row.id);
  }
  async createCustomerSession(customerId: number) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    await this
      .db`INSERT INTO customer_sessions (id, customer_id, expires_at) VALUES (${sessionId}, ${customerId}, ${expiresAt})`;
    return { sessionId, expiresAt };
  }
  async findCustomerSession(sessionId: string) {
    return (
      ((
        await this
          .db`SELECT c.id, c.email, c.display_name, s.expires_at FROM customer_sessions s JOIN customer_users c ON s.customer_id = c.id WHERE s.id = ${sessionId} AND s.expires_at > to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
      )[0] as Customer & { expires_at: string }) ?? null
    );
  }
  async updateCustomerDisplayName(customerId: number, displayName: string) {
    await this.db`UPDATE customer_users SET display_name = ${displayName} WHERE id = ${customerId}`;
  }
  async deleteCustomerSession(sessionId: string) {
    await this.db`DELETE FROM customer_sessions WHERE id = ${sessionId}`;
  }
}
