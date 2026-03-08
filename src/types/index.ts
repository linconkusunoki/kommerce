export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type CategoryWithCount = Category & { product_count: number };

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category_id: number;
  image_url: string | null;
  featured: boolean;
  created_at: string;
};

export type ProductWithCategory = Product & {
  category_name: string;
  category_slug: string;
};

export type ProductWithStock = Product & {
  category_name: string;
  total_stock: number;
  variant_count: number;
};

export type Variant = {
  id: number;
  product_id: number;
  size: string;
  color: string;
  stock: number;
  sku: string;
};

export type CartItem = {
  id: number;
  variant_id: number;
  quantity: number;
  size: string;
  color: string;
  stock: number;
  product_name: string;
  product_slug: string;
  product_price: number;
  product_image: string | null;
};

export type Order = {
  id: number;
  order_number: string;
  status: string;
  email: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  notes: string;
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
};

export type OrderSummary = {
  id: number;
  order_number: string;
  status: string;
  email: string;
  name: string;
  total: number;
  created_at: string;
  item_count: number;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_name: string;
  product_slug: string;
  variant_size: string;
  variant_color: string;
  price: number;
  quantity: number;
  total: number;
};

export type AdminUser = { id: number; username: string };
export type AdminUserWithHash = AdminUser & { password_hash: string };

export type StatusCount = { status: string; count: number };

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type CreateProductInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category_id: number;
  image_url: string | null;
  featured: boolean;
};

export type UpdateProductInput = CreateProductInput;

export type CreateVariantInput = {
  size: string;
  color: string;
  stock: number;
  sku: string;
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type UpdateCategoryInput = CreateCategoryInput;

export type PlaceOrderInput = {
  email: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  notes: string;
};

export type DashboardStats = {
  productCount: number;
  categoryCount: number;
  orderCount: number;
  pendingOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  avgOrder: number;
};
