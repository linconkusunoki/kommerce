import type { ICustomerAuthRepository } from "../repositories/interfaces.ts";
import type { Customer } from "../types/index.ts";

export class CustomerAuthService {
  constructor(private repo: ICustomerAuthRepository) {}

  async register(email: string, password: string, displayName: string): Promise<string | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = displayName.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return null;
    if (password.length < 8 || normalizedName.length < 1 || normalizedName.length > 80) return null;
    if (await this.repo.findCustomerByEmail(normalizedEmail)) return null;

    const passwordHash = await Bun.password.hash(password);
    const customerId = await this.repo.createCustomer(normalizedEmail, passwordHash, normalizedName);
    return (await this.repo.createCustomerSession(customerId)).sessionId;
  }

  async login(email: string, password: string): Promise<string | null> {
    const customer = await this.repo.findCustomerByEmail(email.trim().toLowerCase());
    if (!customer || !(await Bun.password.verify(password, customer.password_hash))) return null;
    return (await this.repo.createCustomerSession(customer.id)).sessionId;
  }

  getSession(sessionId: string) {
    return this.repo.findCustomerSession(sessionId);
  }

  async updateDisplayName(customerId: number, displayName: string): Promise<boolean> {
    const normalizedName = displayName.trim();
    if (normalizedName.length < 1 || normalizedName.length > 80) return false;
    await this.repo.updateCustomerDisplayName(customerId, normalizedName);
    return true;
  }

  async logout(sessionId: string): Promise<void> {
    await this.repo.deleteCustomerSession(sessionId);
  }
}
