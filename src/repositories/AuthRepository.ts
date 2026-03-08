import type { Database } from "bun:sqlite";
import type { AdminUser, AdminUserWithHash } from "../types/index.ts";
import type { IAuthRepository } from "./interfaces.ts";

export class SqliteAuthRepository implements IAuthRepository {
  constructor(private db: Database) {}

  findUserByUsername(username: string): AdminUserWithHash | null {
    return this.db
      .query("SELECT * FROM admin_users WHERE username = ?")
      .get(username) as AdminUserWithHash | null;
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
}
