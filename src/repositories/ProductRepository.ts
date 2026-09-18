import type { Database } from "bun:sqlite";
import type {
  CreateProductInput,
  Product,
  ProductWithCategory,
  ProductWithStock,
  UpdateProductInput,
} from "../types/index.ts";
import type { IProductRepository } from "./interfaces.ts";

type RawProduct = Omit<Product, "featured"> & { featured: number };
type RawProductWithCategory = Omit<ProductWithCategory, "featured"> & { featured: number };
type RawProductWithStock = Omit<ProductWithStock, "featured"> & { featured: number };

function mapProduct(row: RawProduct): Product {
  return { ...row, featured: !!row.featured };
}

function mapProductWithCategory(row: RawProductWithCategory): ProductWithCategory {
  return { ...row, featured: !!row.featured };
}

function mapProductWithStock(row: RawProductWithStock): ProductWithStock {
  return { ...row, featured: !!row.featured };
}

export class SqliteProductRepository implements IProductRepository {
  constructor(private db: Database) {}

  findBySlug(slug: string): ProductWithCategory | null {
    const row = this.db
      .query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ?`,
      )
      .get(slug) as RawProductWithCategory | null;
    return row ? mapProductWithCategory(row) : null;
  }

  findFeatured(): ProductWithCategory[] {
    const rows = this.db
      .query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.featured = 1
         ORDER BY p.created_at DESC`,
      )
      .all() as RawProductWithCategory[];
    return rows.map(mapProductWithCategory);
  }

  findByCategory(categoryId: number): ProductWithCategory[] {
    const rows = this.db
      .query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.category_id = ?
         ORDER BY p.created_at DESC`,
      )
      .all(categoryId) as RawProductWithCategory[];
    return rows.map(mapProductWithCategory);
  }

  search(query: string): ProductWithCategory[] {
    const like = `%${query}%`;
    const rows = this.db
      .query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.name LIKE ? OR p.description LIKE ?
         ORDER BY p.name`,
      )
      .all(like, like) as RawProductWithCategory[];
    return rows.map(mapProductWithCategory);
  }

  findAll(): ProductWithStock[] {
    const rows = this.db
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
      .all() as RawProductWithStock[];
    return rows.map(mapProductWithStock);
  }

  findById(id: number | string): Product | null {
    const row = this.db.query("SELECT * FROM products WHERE id = ?").get(id) as RawProduct | null;
    return row ? mapProduct(row) : null;
  }

  create(data: CreateProductInput): number {
    const result = this.db
      .prepare(
        `INSERT INTO products (name, slug, description, price, compare_at_price, category_id, image_url, image_alt_text, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.name,
        data.slug,
        data.description,
        data.price,
        data.compare_at_price,
        data.category_id,
        data.image_url,
        data.image_alt_text ?? null,
        data.featured ? 1 : 0,
      );
    return Number(result.lastInsertRowid);
  }

  update(id: number | string, data: UpdateProductInput): void {
    this.db
      .prepare(
        `UPDATE products SET name = ?, slug = ?, description = ?, price = ?, compare_at_price = ?,
         category_id = ?, image_url = ?, image_alt_text = ?, featured = ? WHERE id = ?`,
      )
      .run(
        data.name,
        data.slug,
        data.description,
        data.price,
        data.compare_at_price,
        data.category_id,
        data.image_url,
        data.image_alt_text ?? null,
        data.featured ? 1 : 0,
        id,
      );
  }

  delete(id: number | string): void {
    this.db.prepare("DELETE FROM products WHERE id = ?").run(id);
  }
}
