import type { Database } from "bun:sqlite";
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
import { ReviewService } from "../services/ReviewService.ts";
import { SqliteReviewRepository } from "../repositories/ReviewRepository.ts";
import { S3ObjectStorage } from "../services/ObjectStorage.ts";

export type Services = {
  cartService: CartService;
  productService: ProductService;
  categoryService: CategoryService;
  orderService: OrderService;
  dashboardService: DashboardService;
  authService: AuthService;
  reviewService: ReviewService;
  objectStorage: S3ObjectStorage;
};

export function createContainer(db: Database): Services {
  const variantRepo = new SqliteVariantRepository(db);
  const cartRepo = new SqliteCartRepository(db);
  const reviewRepo = new SqliteReviewRepository(db);
  const objectStorage = new S3ObjectStorage();

  return {
    cartService: new CartService(cartRepo, variantRepo),
    productService: new ProductService(new SqliteProductRepository(db), variantRepo, objectStorage),
    categoryService: new CategoryService(new SqliteCategoryRepository(db)),
    orderService: new OrderService(new SqliteOrderRepository(db), cartRepo),
    dashboardService: new DashboardService(new SqliteDashboardRepository(db)),
    authService: new AuthService(new SqliteAuthRepository(db)),
    reviewService: new ReviewService({
      publicReviews: reviewRepo,
      customerReviews: reviewRepo,
      adminReviews: reviewRepo,
    }),
    objectStorage,
  };
}
