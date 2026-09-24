import type { IAdminAuthRepository } from "../repositories/interfaces.ts";
import type { AdminUser } from "../types/index.ts";

export class AdminAuthService {
  constructor(private repo: IAdminAuthRepository) {}

  async login(username: string, password: string): Promise<string | null> {
    const user = this.repo.findUserByUsername(username);
    if (!user || !(await Bun.password.verify(password, user.password_hash))) return null;
    return this.repo.createSession(user.id).sessionId;
  }

  getSession(sessionId: string): (AdminUser & { expires_at: string }) | null {
    return this.repo.findSession(sessionId);
  }

  logout(sessionId: string): void {
    this.repo.deleteSession(sessionId);
  }
}
