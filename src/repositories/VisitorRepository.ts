import type { SQL } from "bun";
import type { IVisitorRepository } from "./interfaces.ts";

export class PostgresVisitorRepository implements IVisitorRepository {
  constructor(private db: SQL) {}
  async findSession(sessionId: string) {
    return (
      ((
        await this
          .db`SELECT id FROM visitor_sessions WHERE id = ${sessionId} AND expires_at > to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
      )[0] as { id: string }) ?? null
    );
  }
  async createSession() {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    await this.db`INSERT INTO visitor_sessions (id, expires_at) VALUES (${id}, ${expiresAt})`;
    return { id, expiresAt };
  }
  async deleteExpiredSessions() {
    await this
      .db`DELETE FROM visitor_sessions WHERE expires_at <= to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
  }
}
