import type { IProductRepository, IVariantRepository } from "../repositories/interfaces.ts";
import type { ObjectStorage } from "./ObjectStorage.ts";
import type { CreateProductInput, CreateVariantInput, UpdateProductInput } from "../types/index.ts";

export class ProductService {
  constructor(
    private repo: IProductRepository,
    private variantRepo: IVariantRepository,
    private storage: ObjectStorage,
  ) {}

  async getBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  async getFeatured() {
    return this.repo.findFeatured();
  }

  async getRecent(limit: number) {
    return this.repo.findRecent(limit);
  }

  async getByCategory(categoryId: number) {
    return this.repo.findByCategory(categoryId);
  }

  async search(query: string) {
    return this.repo.search(query);
  }

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: number | string) {
    return this.repo.findById(id);
  }

  create(data: CreateProductInput) {
    return this.repo.create(data);
  }

  async createWithImage(data: CreateProductInput, image: File | null): Promise<number> {
    const uploadedUrl = image ? await this.storage.upload(image) : null;
    try {
      return await this.repo.create({ ...data, image_url: uploadedUrl ?? data.image_url });
    } catch (error) {
      if (uploadedUrl) await this.storage.delete(uploadedUrl);
      throw error;
    }
  }

  async update(id: number | string, data: UpdateProductInput) {
    await this.repo.update(id, data);
  }

  async updateWithImage(id: number | string, data: UpdateProductInput, image: File | null): Promise<void> {
    const product = await this.repo.findById(id);
    if (!product) throw new Error("Product not found");

    const uploadedUrl = image ? await this.storage.upload(image) : null;
    const imageUrl = uploadedUrl ?? data.image_url;
    try {
      await this.repo.update(id, { ...data, image_url: imageUrl });
    } catch (error) {
      if (uploadedUrl) await this.storage.delete(uploadedUrl);
      throw error;
    }
    if (product.image_url !== imageUrl) await this.storage.delete(product.image_url ?? "");
  }

  async delete(id: number | string) {
    await this.repo.delete(id);
  }

  async deleteWithImage(id: number | string): Promise<void> {
    const product = await this.repo.findById(id);
    if (!product) return;
    await this.repo.delete(id);
    await this.storage.delete(product.image_url ?? "");
  }

  async getVariants(productId: number | string) {
    return this.variantRepo.findByProduct(productId);
  }

  async addVariant(productId: number | string, data: CreateVariantInput): Promise<void> {
    await this.variantRepo.add(productId, data);
  }

  async deleteVariant(variantId: number | string, productId: number | string): Promise<void> {
    await this.variantRepo.delete(variantId, productId);
  }
}
