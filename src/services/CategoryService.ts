import type { ICategoryRepository } from "../repositories/interfaces.ts";
import type { CreateCategoryInput, UpdateCategoryInput } from "../types/index.ts";

export class CategoryService {
  constructor(private repo: ICategoryRepository) {}

  getAll() {
    return this.repo.findAll();
  }

  getBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  getById(id: number | string) {
    return this.repo.findById(id);
  }

  getAllWithCount() {
    return this.repo.findAllWithCount();
  }

  create(data: CreateCategoryInput): void {
    this.repo.create(data);
  }

  update(id: number | string, data: UpdateCategoryInput): void {
    this.repo.update(id, data);
  }

  delete(id: number | string): void {
    this.repo.delete(id);
  }
}
