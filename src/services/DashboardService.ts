import type { IDashboardRepository } from "../repositories/interfaces.ts";
import type { DashboardStats } from "../types/index.ts";

export class DashboardService {
  constructor(private repo: IDashboardRepository) {}

  async getStats(): Promise<DashboardStats> {
    return this.repo.getStats();
  }
}
