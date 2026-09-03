import { apiClient } from "@/services/http-client";
import type {
  Product,
  ProductInput,
  ProductListResult,
  ProductQueryParams,
  ProductStats,
} from "../types";

export function getProducts(params: ProductQueryParams): Promise<ProductListResult> {
  return apiClient.get<ProductListResult>("/admin/products", { params });
}

export function getProduct(id: string): Promise<Product> {
  return apiClient.get<Product>(`/admin/products/${id}`);
}

export function getProductStats(): Promise<ProductStats> {
  return apiClient.get<ProductStats>("/admin/products/stats");
}

export function createProduct(input: ProductInput): Promise<Product> {
  return apiClient.post<Product>("/admin/products", { body: input });
}

export function updateProduct(id: string, input: ProductInput): Promise<Product> {
  return apiClient.patch<Product>(`/admin/products/${id}`, { body: input });
}

export function deleteProduct(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/products/${id}`);
}

export function deleteProducts(ids: string[]): Promise<void> {
  return apiClient.post<void>("/admin/products/bulk-delete", { body: { ids } });
}

export function archiveProducts(ids: string[]): Promise<void> {
  return apiClient.post<void>("/admin/products/bulk-archive", { body: { ids } });
}

export function publishProducts(ids: string[]): Promise<void> {
  return apiClient.post<void>("/admin/products/bulk-publish", { body: { ids } });
}

export function duplicateProduct(id: string): Promise<Product> {
  return apiClient.post<Product>(`/admin/products/${id}/duplicate`);
}
