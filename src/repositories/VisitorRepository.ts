import type { Database } from "bun:sqlite";
import type { IVisitorRepository } from "./interfaces.ts";

export class SqliteVisitorRepository implements IVisitorRepository {
  constructor(private db: Database) {}

  findSession(sessionId: string): { id: string } | null {
    return this.db
      .query("SELECT id FROM visitor_sessions WHERE id = ? AND expires_at > datetime('now')")
      .get(sessionId) as { id: string } | null;
  }

  createSession(): { id: string; expiresAt: string } {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.db.query("INSERT INTO visitor_sessions (id, expires_at) VALUES (?, ?)").run(id, expiresAt);
    return { id, expiresAt };
  }
}
