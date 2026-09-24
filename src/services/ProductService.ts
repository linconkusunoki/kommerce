import type { IProductRepository, IVariantRepository } from "../repositories/interfaces.ts";
import type { ObjectStorage } from "./ObjectStorage.ts";
import type { CreateProductInput, CreateVariantInput, UpdateProductInput } from "../types/index.ts";

export class ProductService {
  constructor(
    private repo: IProductRepository,
    private variantRepo: IVariantRepository,
    private storage: ObjectStorage,
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

  async createWithImage(data: CreateProductInput, image: File | null): Promise<number> {
    const uploadedUrl = image ? await this.storage.upload(image) : null;
    try {
      return this.repo.create({ ...data, image_url: uploadedUrl ?? data.image_url });
    } catch (error) {
      if (uploadedUrl) await this.storage.delete(uploadedUrl);
      throw error;
    }
  }

  update(id: number | string, data: UpdateProductInput): void {
    this.repo.update(id, data);
  }

  async updateWithImage(id: number | string, data: UpdateProductInput, image: File | null): Promise<void> {
    const product = this.repo.findById(id);
    if (!product) throw new Error("Product not found");

    const uploadedUrl = image ? await this.storage.upload(image) : null;
    const imageUrl = uploadedUrl ?? data.image_url;
    try {
      this.repo.update(id, { ...data, image_url: imageUrl });
    } catch (error) {
      if (uploadedUrl) await this.storage.delete(uploadedUrl);
      throw error;
    }
    if (product.image_url !== imageUrl) await this.storage.delete(product.image_url ?? "");
  }

  delete(id: number | string): void {
    this.repo.delete(id);
  }

  async deleteWithImage(id: number | string): Promise<void> {
    const product = this.repo.findById(id);
    if (!product) return;
    this.repo.delete(id);
    await this.storage.delete(product.image_url ?? "");
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
