import type { Services } from "../../../lib/container.ts";

export function loadAdminCategoriesPage(services: Services) {
  return { categories: services.categoryService.getAllWithCount() };
}

export function loadAdminCategoryForm(services: Services, categoryId?: string) {
  if (!categoryId) return { category: undefined };

  const category = services.categoryService.getById(categoryId);
  return category ? { category } : null;
}
