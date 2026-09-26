import type { IAdminAuthRepository } from "../repositories/interfaces.ts";
import type { AdminUser } from "../types/index.ts";

export class AdminAuthService {
  constructor(private repo: IAdminAuthRepository) {}

  async login(username: string, password: string): Promise<string | null> {
    const user = await this.repo.findUserByUsername(username);
    if (!user || !(await Bun.password.verify(password, user.password_hash))) return null;
    return (await this.repo.createSession(user.id)).sessionId;
  }

  getSession(sessionId: string) {
    return this.repo.findSession(sessionId);
  }

  async logout(sessionId: string): Promise<void> {
    await this.repo.deleteSession(sessionId);
  }
}
