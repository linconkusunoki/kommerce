import type { Database } from "bun:sqlite";
import type { CreateVariantInput, Variant } from "../types/index.ts";
import type { IVariantRepository } from "./interfaces.ts";

export class SqliteVariantRepository implements IVariantRepository {
  constructor(private db: Database) {}

  findByProduct(productId: number | string): Variant[] {
    return this.db
      .query("SELECT * FROM product_variants WHERE product_id = ? ORDER BY size, color")
      .all(productId) as Variant[];
  }

  findByOptions(productId: number, size: string, color: string): { id: number; stock: number } | null {
    return this.db
      .query("SELECT id, stock FROM product_variants WHERE product_id = ? AND size = ? AND color = ?")
      .get(productId, size, color) as { id: number; stock: number } | null;
  }

  add(productId: number | string, data: CreateVariantInput): void {
    this.db
      .prepare("INSERT INTO product_variants (product_id, size, color, stock, sku) VALUES (?, ?, ?, ?, ?)")
      .run(productId, data.size, data.color, data.stock, data.sku);
  }

  delete(variantId: number | string, productId: number | string): void {
    this.db
      .prepare("DELETE FROM product_variants WHERE id = ? AND product_id = ?")
      .run(variantId, productId);
  }
}
