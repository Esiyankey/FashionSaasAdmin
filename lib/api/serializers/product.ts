import type { Prisma, ProductStatus } from "@/lib/generated/prisma/client";

export const PRODUCT_INCLUDE = {
  images: true,
  variants: true,
  categories: true,
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

const STATUS_TO_DB: Record<"draft" | "published" | "archived", ProductStatus> = {
  draft: "DRAFT",
  published: "PUBLISHED",
  archived: "ARCHIVED",
};
const STATUS_FROM_DB: Record<ProductStatus, "draft" | "published" | "archived"> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export function statusToDb(status: "draft" | "published" | "archived"): ProductStatus {
  return STATUS_TO_DB[status];
}

export function statusFromDb(status: ProductStatus): "draft" | "published" | "archived" {
  return STATUS_FROM_DB[status];
}

export function serializeProduct(product: DbProduct) {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    vendor: product.vendor,
    productType: product.productType,
    status: statusFromDb(product.status),
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    costPerItem: product.costPerItem ?? undefined,
    sku: product.sku ?? undefined,
    barcode: product.barcode ?? undefined,
    inventory: {
      trackQuantity: product.trackQuantity,
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold,
      allowBackorder: product.allowBackorder,
    },
    images: product.images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ id: image.id, url: image.url, alt: image.alt, position: image.position })),
    categoryIds: product.categories.map((entry) => entry.categoryId),
    variantOptionNames: product.variantOptionNames,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      options: variant.options as { name: string; value: string }[],
      sku: variant.sku ?? undefined,
      price: variant.price ?? undefined,
      compareAtPrice: variant.compareAtPrice ?? undefined,
      inventoryQuantity: variant.inventoryQuantity,
      imageId: variant.imageId ?? undefined,
    })),
    seo: { title: product.seoTitle, description: product.seoDescription },
    shipping: { weightKg: product.weightKg ?? undefined, requiresShipping: product.requiresShipping },
    isFeatured: product.isFeatured,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type SerializedProduct = ReturnType<typeof serializeProduct>;
