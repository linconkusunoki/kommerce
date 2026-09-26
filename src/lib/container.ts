import type { SQL } from "bun";
import { CartService } from "../services/CartService.ts";
import { ProductService } from "../services/ProductService.ts";
import { CategoryService } from "../services/CategoryService.ts";
import { OrderService } from "../services/OrderService.ts";
import { DashboardService } from "../services/DashboardService.ts";
import { AdminAuthService } from "../services/AdminAuthService.ts";
import { CustomerAuthService } from "../services/CustomerAuthService.ts";
import { PostgresCartRepository } from "../repositories/CartRepository.ts";
import { PostgresVariantRepository } from "../repositories/VariantRepository.ts";
import { PostgresProductRepository } from "../repositories/ProductRepository.ts";
import { PostgresCategoryRepository } from "../repositories/CategoryRepository.ts";
import { PostgresOrderRepository } from "../repositories/OrderRepository.ts";
import { PostgresDashboardRepository } from "../repositories/DashboardRepository.ts";
import { PostgresAuthRepository } from "../repositories/AuthRepository.ts";
import { ReviewService } from "../services/ReviewService.ts";
import { PostgresReviewRepository } from "../repositories/ReviewRepository.ts";
import { S3ObjectStorage } from "../services/ObjectStorage.ts";

export type Services = {
  cartService: CartService;
  productService: ProductService;
  categoryService: CategoryService;
  orderService: OrderService;
  dashboardService: DashboardService;
  adminAuthService: AdminAuthService;
  customerAuthService: CustomerAuthService;
  reviewService: ReviewService;
  objectStorage: S3ObjectStorage;
};

export function createContainer(db: SQL): Services {
  const variantRepo = new PostgresVariantRepository(db);
  const cartRepo = new PostgresCartRepository(db);
  const reviewRepo = new PostgresReviewRepository(db);
  const objectStorage = new S3ObjectStorage();
  const authRepo = new PostgresAuthRepository(db);

  return {
    cartService: new CartService(cartRepo, variantRepo),
    productService: new ProductService(new PostgresProductRepository(db), variantRepo, objectStorage),
    categoryService: new CategoryService(new PostgresCategoryRepository(db)),
    orderService: new OrderService(new PostgresOrderRepository(db), cartRepo),
    dashboardService: new DashboardService(new PostgresDashboardRepository(db)),
    adminAuthService: new AdminAuthService(authRepo),
    customerAuthService: new CustomerAuthService(authRepo),
    reviewService: new ReviewService({
      publicReviews: reviewRepo,
      customerReviews: reviewRepo,
      adminReviews: reviewRepo,
    }),
    objectStorage,
  };
}
