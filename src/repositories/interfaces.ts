import type {
  AdminUser,
  AdminUserWithHash,
  CartItem,
  Category,
  CategoryWithCount,
  CreateCategoryInput,
  CreateCustomerReviewInput,
  CreateAdminReviewInput,
  CreateProductInput,
  CreateVariantInput,
  Customer,
  CustomerWithHash,
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
  ProductReview,
  AdminReview,
  CustomerReview,
  RatingSummary,
  ReviewPage,
} from "../types/index.ts";

export interface ICartRepository {
  getItems(sessionId: string): Promise<CartItem[]>;
  getCount(sessionId: string): Promise<number>;
  getExistingItem(sessionId: string, variantId: number): Promise<{ id: number; quantity: number } | null>;
  addItem(sessionId: string, variantId: number, quantity: number): Promise<void>;
  updateItem(itemId: number, sessionId: string, quantity: number): Promise<void>;
  removeItem(itemId: number, sessionId: string): Promise<void>;
  clearCart(sessionId: string): Promise<void>;
}

export interface IVariantRepository {
  findByProduct(productId: number | string): Promise<Variant[]>;
  findByOptions(productId: number, size: string, color: string): Promise<{ id: number; stock: number } | null>;
  add(productId: number | string, data: CreateVariantInput): Promise<void>;
  delete(variantId: number | string, productId: number | string): Promise<void>;
}

export interface IProductRepository {
  findBySlug(slug: string): Promise<ProductWithCategory | null>;
  findFeatured(): Promise<ProductWithCategory[]>;
  findRecent(limit: number): Promise<ProductWithCategory[]>;
  findByCategory(categoryId: number): Promise<ProductWithCategory[]>;
  search(query: string): Promise<ProductWithCategory[]>;
  findAll(): Promise<ProductWithStock[]>;
  findById(id: number | string): Promise<Product | null>;
  create(data: CreateProductInput): Promise<number>;
  update(id: number | string, data: UpdateProductInput): Promise<void>;
  delete(id: number | string): Promise<void>;
}

export interface IReviewPublicRepository {
  findVisibleByProduct(productId: number, page: number, pageSize: number): Promise<ReviewPage>;
  getRatingSummary(productId: number): Promise<RatingSummary>;
}

export interface IReviewCustomerRepository {
  findByCustomer(customerId: number): Promise<CustomerReview[]>;
  findCustomerReview(productId: number, customerId: number): Promise<ProductReview | null>;
  createCustomerReview(input: CreateCustomerReviewInput): Promise<number>;
  updateCustomerReview(id: number, customerId: number, rating: number, text: string | null): Promise<void>;
  deleteCustomerReview(id: number, customerId: number): Promise<void>;
}

export interface IReviewAdminRepository {
  findAllForAdmin(visibility?: "all" | "visible" | "hidden", productId?: number): Promise<AdminReview[]>;
  setVisibility(id: number, visible: boolean): Promise<void>;
  deleteReview(id: number): Promise<void>;
  createAdminReview(input: CreateAdminReviewInput): Promise<number>;
}

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: number | string): Promise<Category | null>;
  findAllWithCount(): Promise<CategoryWithCount[]>;
  create(data: CreateCategoryInput): Promise<void>;
  update(id: number | string, data: UpdateCategoryInput): Promise<void>;
  delete(id: number | string): Promise<void>;
}

export interface IOrderRepository {
  create(
    input: PlaceOrderInput,
    items: CartItem[],
    orderNumber: string,
    sessionId: string,
    customerId?: number,
  ): Promise<void>;
  findByNumber(orderNumber: string): Promise<Order | null>;
  findById(id: number | string): Promise<Order | null>;
  findAll(statusFilter?: string): Promise<OrderSummary[]>;
  findByCustomer(customerId: number, email: string): Promise<OrderSummary[]>;
  getStatusCounts(): Promise<StatusCount[]>;
  updateStatus(id: number | string, status: OrderStatus): Promise<void>;
  getItems(orderId: number): Promise<OrderItem[]>;
  getItemsByOrderNumber(orderNumber: string): Promise<OrderItem[]>;
}

export interface IAdminAuthRepository {
  findUserByUsername(username: string): Promise<AdminUserWithHash | null>;
  createSession(userId: number): Promise<{ sessionId: string; expiresAt: string }>;
  findSession(sessionId: string): Promise<(AdminUser & { expires_at: string }) | null>;
  deleteSession(sessionId: string): Promise<void>;
}

export interface ICustomerAuthRepository {
  findCustomerByEmail(email: string): Promise<CustomerWithHash | null>;
  createCustomer(email: string, passwordHash: string, displayName: string): Promise<number>;
  createCustomerSession(customerId: number): Promise<{ sessionId: string; expiresAt: string }>;
  findCustomerSession(sessionId: string): Promise<(Customer & { expires_at: string }) | null>;
  updateCustomerDisplayName(customerId: number, displayName: string): Promise<void>;
  deleteCustomerSession(sessionId: string): Promise<void>;
}

export interface IVisitorRepository {
  findSession(sessionId: string): Promise<{ id: string } | null>;
  createSession(): Promise<{ id: string; expiresAt: string }>;
  deleteExpiredSessions(): Promise<void>;
}

export interface IDashboardRepository {
  getStats(): Promise<DashboardStats>;
}
