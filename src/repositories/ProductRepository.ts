import type { SQL } from "bun";
import type {
  CreateProductInput,
  Product,
  ProductWithCategory,
  ProductWithStock,
  UpdateProductInput,
} from "../types/index.ts";
import type { IProductRepository } from "./interfaces.ts";

type Raw<T> = Omit<T, "featured"> & { featured: boolean | number };
const map = <T extends { price: number; compare_at_price: number | null }>(row: Raw<T>): T =>
  ({
    ...row,
    price: Number(row.price),
    compare_at_price: row.compare_at_price === null ? null : Number(row.compare_at_price),
    featured: !!row.featured,
  }) as unknown as T;

export class PostgresProductRepository implements IProductRepository {
  constructor(private db: SQL) {}

  async findBySlug(slug: string) {
    const row = (
      await this.db`SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p JOIN categories c ON p.category_id = c.id WHERE p.slug = ${slug}`
    )[0] as Raw<ProductWithCategory> | undefined;
    return row ? map(row) : null;
  }
  async findFeatured() {
    return (
      await this.db`SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p JOIN categories c ON p.category_id = c.id WHERE p.featured = true ORDER BY p.created_at DESC`
    ).map(map) as ProductWithCategory[];
  }
  async findRecent(limit: number) {
    return (
      await this.db`SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC LIMIT ${limit}`
    ).map(map) as ProductWithCategory[];
  }
  async findByCategory(categoryId: number) {
    return (
      await this.db`SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p JOIN categories c ON p.category_id = c.id WHERE p.category_id = ${categoryId} ORDER BY p.created_at DESC`
    ).map(map) as ProductWithCategory[];
  }
  async search(query: string) {
    const like = `%${query}%`;
    return (
      await this.db`SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p JOIN categories c ON p.category_id = c.id
      WHERE p.name ILIKE ${like} OR p.description ILIKE ${like} ORDER BY p.name`
    ).map(map) as ProductWithCategory[];
  }
  async findAll() {
    return (
      await this.db`SELECT p.*, c.name AS category_name, COALESCE(SUM(pv.stock), 0)::int AS total_stock,
      COUNT(pv.id)::int AS variant_count FROM products p JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id GROUP BY p.id, c.name ORDER BY p.created_at DESC`
    ).map(map) as ProductWithStock[];
  }
  async findById(id: number | string) {
    const row = (await this.db`SELECT * FROM products WHERE id = ${id}`)[0] as Raw<Product> | undefined;
    return row ? map(row) : null;
  }
  async create(data: CreateProductInput) {
    const [row] = await this
      .db`INSERT INTO products (name, slug, description, price, compare_at_price, category_id, image_url, image_alt_text, featured)
      VALUES (${data.name}, ${data.slug}, ${data.description}, ${data.price}, ${data.compare_at_price}, ${data.category_id}, ${data.image_url}, ${data.image_alt_text ?? null}, ${data.featured}) RETURNING id`;
    return Number(row.id);
  }
  async update(id: number | string, data: UpdateProductInput) {
    await this
      .db`UPDATE products SET name = ${data.name}, slug = ${data.slug}, description = ${data.description}, price = ${data.price},
      compare_at_price = ${data.compare_at_price}, category_id = ${data.category_id}, image_url = ${data.image_url},
      image_alt_text = ${data.image_alt_text ?? null}, featured = ${data.featured} WHERE id = ${id}`;
  }
  async delete(id: number | string) {
    await this.db`DELETE FROM products WHERE id = ${id}`;
  }
}
