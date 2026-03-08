import type { IProductRepository, IVariantRepository } from "../repositories/interfaces.ts";
import type {
  CreateProductInput,
  CreateVariantInput,
  UpdateProductInput,
} from "../types/index.ts";

export class ProductService {
  constructor(
    private repo: IProductRepository,
    private variantRepo: IVariantRepository,
  ) {}

  getBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  getFeatured() {
    return this.repo.findFeatured();
  }

  getByCategory(categoryId: number) {
    return this.repo.findByCategory(categoryId);
  }

  search(query: string) {
    return this.repo.search(query);
  }

  getAll() {
    return this.repo.findAll();
  }

  getById(id: number | string) {
    return this.repo.findById(id);
  }

  create(data: CreateProductInput): number {
    return this.repo.create(data);
  }

  update(id: number | string, data: UpdateProductInput): void {
    this.repo.update(id, data);
  }

  delete(id: number | string): void {
    this.repo.delete(id);
  }

  getVariants(productId: number | string) {
    return this.variantRepo.findByProduct(productId);
  }

  addVariant(productId: number | string, data: CreateVariantInput): void {
    this.variantRepo.add(productId, data);
  }

  deleteVariant(variantId: number | string, productId: number | string): void {
    this.variantRepo.delete(variantId, productId);
  }
}
