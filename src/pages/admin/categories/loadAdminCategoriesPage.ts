import type { CategoryService } from "../../../services/CategoryService.ts";

export async function loadAdminCategoriesPage(services: { categoryService: CategoryService }) {
  return { categories: await services.categoryService.getAllWithCount() };
}

export async function loadAdminCategoryForm(services: { categoryService: CategoryService }, categoryId?: string) {
  if (!categoryId) return { category: undefined };

  const category = await services.categoryService.getById(categoryId);
  return category ? { category } : null;
}
