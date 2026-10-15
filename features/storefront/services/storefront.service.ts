import { apiClient } from "@/services/http-client";
import type { CheckoutInput, CheckoutResult, Paginated, PublicProduct, StorefrontHome } from "../types";

export function getStorefrontHome(orgSlug: string): Promise<StorefrontHome> {
  return apiClient.get<StorefrontHome>(`/storefront/${orgSlug}`);
}

export interface StorefrontProductQueryParams {
  q?: string;
  category?: string;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "name-asc";
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

export function getStorefrontProducts(
  orgSlug: string,
  params: StorefrontProductQueryParams
): Promise<Paginated<PublicProduct>> {
  return apiClient.get<Paginated<PublicProduct>>(`/storefront/${orgSlug}/products`, { params });
}

export function getStorefrontProduct(orgSlug: string, slug: string): Promise<PublicProduct> {
  return apiClient.get<PublicProduct>(`/storefront/${orgSlug}/products/${slug}`);
}

export function checkout(orgSlug: string, input: CheckoutInput): Promise<CheckoutResult> {
  return apiClient.post<CheckoutResult>(`/storefront/${orgSlug}/checkout`, { body: input });
}
