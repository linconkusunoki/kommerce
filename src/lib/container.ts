import { getDb } from "../db/schema.ts";
import { CartService } from "../services/CartService.ts";
import { ProductService } from "../services/ProductService.ts";
import { CategoryService } from "../services/CategoryService.ts";
import { OrderService } from "../services/OrderService.ts";
import { DashboardService } from "../services/DashboardService.ts";
import { AuthService } from "../services/AuthService.ts";
import { SqliteCartRepository } from "../repositories/CartRepository.ts";
import { SqliteVariantRepository } from "../repositories/VariantRepository.ts";
import { SqliteProductRepository } from "../repositories/ProductRepository.ts";
import { SqliteCategoryRepository } from "../repositories/CategoryRepository.ts";
import { SqliteOrderRepository } from "../repositories/OrderRepository.ts";
import { SqliteDashboardRepository } from "../repositories/DashboardRepository.ts";
import { SqliteAuthRepository } from "../repositories/AuthRepository.ts";

const db = getDb();

const variantRepo = new SqliteVariantRepository(db);
const cartRepo = new SqliteCartRepository(db);

export const cartService = new CartService(cartRepo, variantRepo);
export const productService = new ProductService(new SqliteProductRepository(db), variantRepo);
export const categoryService = new CategoryService(new SqliteCategoryRepository(db));
export const orderService = new OrderService(new SqliteOrderRepository(db), cartRepo);
export const dashboardService = new DashboardService(new SqliteDashboardRepository(db));
export const authService = new AuthService(new SqliteAuthRepository(db));
