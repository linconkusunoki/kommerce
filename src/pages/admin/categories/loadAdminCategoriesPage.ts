import type { CategoryService } from "../../../services/CategoryService.ts";

export function loadAdminCategoriesPage(services: { categoryService: CategoryService }) {
  return { categories: services.categoryService.getAllWithCount() };
}

export function loadAdminCategoryForm(services: { categoryService: CategoryService }, categoryId?: string) {
  if (!categoryId) return { category: undefined };

  const category = services.categoryService.getById(categoryId);
  return category ? { category } : null;
}
