import type { PaginatedResult } from "@/types/common";

export type ProductStatus = "draft" | "published" | "archived";

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  options: VariantOption[];
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  inventoryQuantity: number;
  imageId?: string;
}

export interface ProductSeo {
  title: string;
  description: string;
}

export interface ProductShipping {
  weightKg?: number;
  requiresShipping: boolean;
}

export interface ProductInventory {
  trackQuantity: boolean;
  quantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  vendor: string;
  productType: string;
  status: ProductStatus;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  sku?: string;
  barcode?: string;
  inventory: ProductInventory;
  images: ProductImage[];
  categoryIds: string[];
  variantOptionNames: string[];
  variants: ProductVariant[];
  seo: ProductSeo;
  shipping: ProductShipping;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Submitted by `ProductForm` — generated/server-owned fields (`id`, `slug`, timestamps) are excluded. */
export type ProductInput = Omit<Product, "id" | "slug" | "createdAt" | "updatedAt">;

export interface ProductStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  lowStock: number;
}

export type ProductSortField = "title" | "status" | "price" | "inventory" | "updatedAt";

export interface ProductQueryParams {
  search: string;
  status: ProductStatus | "all";
  categoryId: string | "all";
  sortBy: ProductSortField;
  sortDirection: "asc" | "desc";
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

export type ProductListResult = PaginatedResult<Product>;

export function isLowStock(product: Product): boolean {
  if (!product.inventory.trackQuantity) return false;
  return product.inventory.quantity <= product.inventory.lowStockThreshold;
}

export function getProductPriceRange(product: Product): { min: number; max: number } {
  if (product.variants.length === 0) return { min: product.price, max: product.price };
  const prices = product.variants.map((variant) => variant.price ?? product.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getProductTotalInventory(product: Product): number {
  if (product.variants.length === 0) return product.inventory.quantity;
  return product.variants.reduce((sum, variant) => sum + variant.inventoryQuantity, 0);
}
