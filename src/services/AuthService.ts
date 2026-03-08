import type { IAuthRepository } from "../repositories/interfaces.ts";
import type { AdminUser } from "../types/index.ts";

export class AuthService {
  constructor(private repo: IAuthRepository) {}

  async login(username: string, password: string): Promise<string | null> {
    const user = this.repo.findUserByUsername(username);
    if (!user) return null;
    const valid = await Bun.password.verify(password, user.password_hash);
    if (!valid) return null;
    const { sessionId } = this.repo.createSession(user.id);
    return sessionId;
  }

  getSession(sessionId: string): (AdminUser & { expires_at: string }) | null {
    return this.repo.findSession(sessionId);
  }

  logout(sessionId: string): void {
    this.repo.deleteSession(sessionId);
  }
}
