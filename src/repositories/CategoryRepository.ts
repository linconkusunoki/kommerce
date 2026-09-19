import type { Database } from "bun:sqlite";
import type { Category, CategoryWithCount, CreateCategoryInput, UpdateCategoryInput } from "../types/index.ts";
import type { ICategoryRepository } from "./interfaces.ts";

export class SqliteCategoryRepository implements ICategoryRepository {
  constructor(private db: Database) {}

  findAll(): Category[] {
    return this.db.query("SELECT * FROM categories ORDER BY sort_order").all() as Category[];
  }

  findBySlug(slug: string): Category | null {
    return this.db.query("SELECT * FROM categories WHERE slug = ?").get(slug) as Category | null;
  }

  findById(id: number | string): Category | null {
    return this.db.query("SELECT * FROM categories WHERE id = ?").get(id) as Category | null;
  }

  findAllWithCount(): CategoryWithCount[] {
    return this.db
      .query(
        `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count
         FROM categories c ORDER BY c.sort_order`,
      )
      .all() as CategoryWithCount[];
  }

  create(data: CreateCategoryInput): void {
    this.db
      .prepare(
        `INSERT INTO categories (name, slug, description, image_url, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(data.name, data.slug, data.description, data.image_url, data.sort_order);
  }

  update(id: number | string, data: UpdateCategoryInput): void {
    this.db
      .prepare(
        `UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, sort_order = ?
         WHERE id = ?`,
      )
      .run(data.name, data.slug, data.description, data.image_url, data.sort_order, id);
  }

  delete(id: number | string): void {
    this.db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  }
}
