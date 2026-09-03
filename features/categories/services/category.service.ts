import { apiClient } from "@/services/http-client";
import type { Category } from "@/types/category";

export interface CategoryInput {
  name: string;
  parentId?: string | null;
}

export function getCategories(): Promise<Category[]> {
  return apiClient.get<Category[]>("/admin/categories");
}

export function createCategory(input: CategoryInput): Promise<Category> {
  return apiClient.post<Category>("/admin/categories", { body: input });
}

export function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  return apiClient.patch<Category>(`/admin/categories/${id}`, { body: input });
}

export function deleteCategory(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/categories/${id}`);
}
