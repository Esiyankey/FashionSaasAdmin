import { apiClient } from "@/services/http-client";
import type { Product, ProductListResult } from "@/features/products/types";
import type { Category } from "@/types/category";
import type { CheckoutInput, CheckoutResult, StorefrontHome } from "../types";

export function getStorefrontHome(orgSlug: string): Promise<StorefrontHome> {
  return apiClient.get<StorefrontHome>(`/storefront/${orgSlug}`);
}

export function getStorefrontCategories(orgSlug: string): Promise<Category[]> {
  return apiClient.get<Category[]>(`/storefront/${orgSlug}/categories`);
}

export interface StorefrontProductQueryParams {
  search?: string;
  categoryId?: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

export function getStorefrontProducts(orgSlug: string, params: StorefrontProductQueryParams): Promise<ProductListResult> {
  return apiClient.get<ProductListResult>(`/storefront/${orgSlug}/products`, { params });
}

export function getStorefrontProduct(orgSlug: string, slug: string): Promise<Product> {
  return apiClient.get<Product>(`/storefront/${orgSlug}/products/${slug}`);
}

export function checkout(orgSlug: string, input: CheckoutInput): Promise<CheckoutResult> {
  return apiClient.post<CheckoutResult>(`/storefront/${orgSlug}/checkout`, { body: input });
}
