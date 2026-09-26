import type { SQL } from "bun";
import type { CreateVariantInput, Variant } from "../types/index.ts";
import type { IVariantRepository } from "./interfaces.ts";

export class PostgresVariantRepository implements IVariantRepository {
  constructor(private db: SQL) {}

  findByProduct = async (productId: number | string) =>
    (await this.db`SELECT * FROM product_variants WHERE product_id = ${productId} ORDER BY size, color`) as Variant[];

  async findByOptions(productId: number, size: string, color: string) {
    return (
      ((
        await this.db`SELECT id, stock FROM product_variants
      WHERE product_id = ${productId} AND size = ${size} AND color = ${color}`
      )[0] as { id: number; stock: number }) ?? null
    );
  }

  async add(productId: number | string, data: CreateVariantInput) {
    await this.db`INSERT INTO product_variants (product_id, size, color, stock, sku)
      VALUES (${productId}, ${data.size}, ${data.color}, ${data.stock}, ${data.sku})`;
  }

  async delete(variantId: number | string, productId: number | string) {
    await this.db`DELETE FROM product_variants WHERE id = ${variantId} AND product_id = ${productId}`;
  }
}
