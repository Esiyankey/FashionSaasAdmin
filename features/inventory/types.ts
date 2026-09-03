import type { PaginatedResult } from "@/types/common";

export interface InventoryVariant {
  id: string;
  title: string;
  sku: string | null;
  quantity: number;
}

export interface InventoryItem {
  id: string;
  title: string;
  sku: string | null;
  imageUrl: string | null;
  quantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  isLowStock: boolean;
  variants: InventoryVariant[];
}

export interface InventoryQueryParams {
  search: string;
  lowStockOnly: boolean;
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

export type InventoryListResult = PaginatedResult<InventoryItem>;

export interface AdjustInventoryInput {
  variantId?: string;
  delta: number;
}
