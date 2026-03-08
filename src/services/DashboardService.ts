import type { IDashboardRepository } from "../repositories/interfaces.ts";
import type { DashboardStats } from "../types/index.ts";

export class DashboardService {
  constructor(private repo: IDashboardRepository) {}

  getStats(): DashboardStats {
    return this.repo.getStats();
  }
}
