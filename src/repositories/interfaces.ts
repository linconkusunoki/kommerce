import type {
  AdminUser,
  AdminUserWithHash,
  CartItem,
  Category,
  CategoryWithCount,
  CreateCategoryInput,
  CreateProductInput,
  CreateVariantInput,
  DashboardStats,
  Order,
  OrderItem,
  OrderStatus,
  OrderSummary,
  PlaceOrderInput,
  Product,
  ProductWithCategory,
  ProductWithStock,
  StatusCount,
  UpdateCategoryInput,
  UpdateProductInput,
  Variant,
} from "../types/index.ts";

export interface ICartRepository {
  getItems(sessionId: string): CartItem[];
  getCount(sessionId: string): number;
  getExistingItem(sessionId: string, variantId: number): { id: number; quantity: number } | null;
  addItem(sessionId: string, variantId: number, quantity: number): void;
  updateItem(itemId: number, sessionId: string, quantity: number): void;
  removeItem(itemId: number, sessionId: string): void;
  clearCart(sessionId: string): void;
}

export interface IVariantRepository {
  findByProduct(productId: number | string): Variant[];
  findByOptions(productId: number, size: string, color: string): { id: number; stock: number } | null;
  add(productId: number | string, data: CreateVariantInput): void;
  delete(variantId: number | string, productId: number | string): void;
}

export interface IProductRepository {
  findBySlug(slug: string): ProductWithCategory | null;
  findFeatured(): ProductWithCategory[];
  findByCategory(categoryId: number): ProductWithCategory[];
  search(query: string): ProductWithCategory[];
  findAll(): ProductWithStock[];
  findById(id: number | string): Product | null;
  create(data: CreateProductInput): number;
  update(id: number | string, data: UpdateProductInput): void;
  delete(id: number | string): void;
}

export interface ICategoryRepository {
  findAll(): Category[];
  findBySlug(slug: string): Category | null;
  findById(id: number | string): Category | null;
  findAllWithCount(): CategoryWithCount[];
  create(data: CreateCategoryInput): void;
  update(id: number | string, data: UpdateCategoryInput): void;
  delete(id: number | string): void;
}

export interface IOrderRepository {
  create(input: PlaceOrderInput, items: CartItem[], orderNumber: string, sessionId: string): void;
  findByNumber(orderNumber: string): Order | null;
  findById(id: number | string): Order | null;
  findAll(statusFilter?: string): OrderSummary[];
  getStatusCounts(): StatusCount[];
  updateStatus(id: number | string, status: OrderStatus): void;
  getItems(orderId: number): OrderItem[];
  getItemsByOrderNumber(orderNumber: string): OrderItem[];
}

export interface IAuthRepository {
  findUserByUsername(username: string): AdminUserWithHash | null;
  createSession(userId: number): { sessionId: string; expiresAt: string };
  findSession(sessionId: string): (AdminUser & { expires_at: string }) | null;
  deleteSession(sessionId: string): void;
}

export interface IVisitorRepository {
  findSession(sessionId: string): { id: string } | null;
  createSession(): { id: string; expiresAt: string };
  deleteExpiredSessions(): void;
}

export interface IDashboardRepository {
  getStats(): DashboardStats;
}
