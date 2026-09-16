import type { IAuthRepository } from "../repositories/interfaces.ts";
import type { AdminUser, Customer } from "../types/index.ts";

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

  async registerCustomer(email: string, password: string, displayName: string): Promise<string | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = displayName.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return null;
    if (password.length < 8 || normalizedName.length < 1 || normalizedName.length > 80) return null;
    if (this.repo.findCustomerByEmail(normalizedEmail)) return null;

    const passwordHash = await Bun.password.hash(password);
    const customerId = this.repo.createCustomer(normalizedEmail, passwordHash, normalizedName);
    return this.repo.createCustomerSession(customerId).sessionId;
  }

  async loginCustomer(email: string, password: string): Promise<string | null> {
    const customer = this.repo.findCustomerByEmail(email.trim().toLowerCase());
    if (!customer || !(await Bun.password.verify(password, customer.password_hash))) return null;
    return this.repo.createCustomerSession(customer.id).sessionId;
  }

  getCustomerSession(sessionId: string): (Customer & { expires_at: string }) | null {
    return this.repo.findCustomerSession(sessionId);
  }

  updateCustomerDisplayName(customerId: number, displayName: string): boolean {
    const normalizedName = displayName.trim();
    if (normalizedName.length < 1 || normalizedName.length > 80) return false;
    this.repo.updateCustomerDisplayName(customerId, normalizedName);
    return true;
  }

  logoutCustomer(sessionId: string): void {
    this.repo.deleteCustomerSession(sessionId);
  }
}
