import type { SQL } from "bun";
import type { Category, CategoryWithCount, CreateCategoryInput, UpdateCategoryInput } from "../types/index.ts";
import type { ICategoryRepository } from "./interfaces.ts";

export class PostgresCategoryRepository implements ICategoryRepository {
  constructor(private db: SQL) {}

  findAll = async () => (await this.db`SELECT * FROM categories ORDER BY sort_order`) as Category[];
  findBySlug = async (slug: string) =>
    ((await this.db`SELECT * FROM categories WHERE slug = ${slug}`)[0] as Category) ?? null;
  findById = async (id: number | string) =>
    ((await this.db`SELECT * FROM categories WHERE id = ${id}`)[0] as Category) ?? null;
  findAllWithCount = async () =>
    (await this.db`
    SELECT c.*, COUNT(p.id)::int AS product_count
    FROM categories c LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id ORDER BY c.sort_order`) as CategoryWithCount[];

  async create(data: CreateCategoryInput) {
    await this.db`INSERT INTO categories (name, slug, description, image_url, sort_order)
      VALUES (${data.name}, ${data.slug}, ${data.description}, ${data.image_url}, ${data.sort_order})`;
  }

  async update(id: number | string, data: UpdateCategoryInput) {
    await this.db`UPDATE categories SET name = ${data.name}, slug = ${data.slug}, description = ${data.description},
      image_url = ${data.image_url}, sort_order = ${data.sort_order} WHERE id = ${id}`;
  }

  async delete(id: number | string) {
    await this.db`DELETE FROM categories WHERE id = ${id}`;
  }
}
