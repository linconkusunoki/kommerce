import type { ICategoryRepository } from "../repositories/interfaces.ts";
import type { CreateCategoryInput, UpdateCategoryInput } from "../types/index.ts";

export class CategoryService {
  constructor(private repo: ICategoryRepository) {}

  async getAll() {
    return this.repo.findAll();
  }

  async getBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  async getById(id: number | string) {
    return this.repo.findById(id);
  }

  async getAllWithCount() {
    return this.repo.findAllWithCount();
  }

  async create(data: CreateCategoryInput) {
    await this.repo.create(data);
  }

  async update(id: number | string, data: UpdateCategoryInput) {
    await this.repo.update(id, data);
  }

  async delete(id: number | string) {
    await this.repo.delete(id);
  }
}
