import type { Database } from "bun:sqlite";
import type {
  CreateProductInput,
  Product,
  ProductWithCategory,
  ProductWithStock,
  UpdateProductInput,
} from "../types/index.ts";
import type { IProductRepository } from "./interfaces.ts";

export class SqliteProductRepository implements IProductRepository {
  constructor(private db: Database) {}

  findBySlug(slug: string): ProductWithCategory | null {
    return this.db
      .query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ?`,
      )
      .get(slug) as ProductWithCategory | null;
  }

  findFeatured(): ProductWithCategory[] {
    return this.db
      .query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.featured = 1
         ORDER BY p.created_at DESC`,
      )
      .all() as ProductWithCategory[];
  }

  findByCategory(categoryId: number): ProductWithCategory[] {
    return this.db
      .query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.category_id = ?
         ORDER BY p.created_at DESC`,
      )
      .all(categoryId) as ProductWithCategory[];
  }

  search(query: string): ProductWithCategory[] {
    const like = `%${query}%`;
    return this.db
      .query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.name LIKE ? OR p.description LIKE ?
         ORDER BY p.name`,
      )
      .all(like, like) as ProductWithCategory[];
  }

  findAll(): ProductWithStock[] {
    return this.db
      .query(
        `SELECT p.*, c.name as category_name,
                COALESCE(SUM(pv.stock), 0) as total_stock,
                COUNT(pv.id) as variant_count
         FROM products p
         JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_variants pv ON pv.product_id = p.id
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
      )
      .all() as ProductWithStock[];
  }

  findById(id: number | string): Product | null {
    return this.db.query("SELECT * FROM products WHERE id = ?").get(id) as Product | null;
  }

  create(data: CreateProductInput): number {
    const result = this.db
      .prepare(
        `INSERT INTO products (name, slug, description, price, compare_at_price, category_id, image_url, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.name,
        data.slug,
        data.description,
        data.price,
        data.compare_at_price,
        data.category_id,
        data.image_url,
        data.featured,
      );
    return Number(result.lastInsertRowid);
  }

  update(id: number | string, data: UpdateProductInput): void {
    this.db
      .prepare(
        `UPDATE products SET name = ?, slug = ?, description = ?, price = ?, compare_at_price = ?,
         category_id = ?, image_url = ?, featured = ? WHERE id = ?`,
      )
      .run(
        data.name,
        data.slug,
        data.description,
        data.price,
        data.compare_at_price,
        data.category_id,
        data.image_url,
        data.featured,
        id,
      );
  }

  delete(id: number | string): void {
    this.db.prepare("DELETE FROM products WHERE id = ?").run(id);
  }
}
