import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import { PRODUCT_INCLUDE, serializeProduct, statusToDb } from "@/lib/api/serializers/product";
import { slugify } from "@/utils/slugify";
import type { ProductFormValues } from "@/features/products/components/ProductForm/schema";
import type { Prisma } from "@/lib/generated/prisma/client";

async function uniqueProductSlug(organizationId: string, title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "product";
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-await-in-loop
  while (
    await prisma.product.findFirst({
      where: { organizationId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function toProductData(input: ProductFormValues) {
  return {
    title: input.title,
    description: input.description,
    vendor: input.vendor,
    productType: input.productType,
    status: statusToDb(input.status),
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    costPerItem: input.costPerItem ?? null,
    sku: input.sku || null,
    barcode: input.barcode || null,
    trackQuantity: input.inventory.trackQuantity,
    quantity: input.inventory.quantity,
    lowStockThreshold: input.inventory.lowStockThreshold,
    allowBackorder: input.inventory.allowBackorder,
    variantOptionNames: input.variantOptionNames,
    isFeatured: input.isFeatured,
    seoTitle: input.seo.title,
    seoDescription: input.seo.description,
    weightKg: input.shipping.weightKg ?? null,
    requiresShipping: input.shipping.requiresShipping,
  };
}

export async function createProductForOrg(organizationId: string, input: ProductFormValues) {
  const slug = await uniqueProductSlug(organizationId, input.title);
  const product = await prisma.product.create({
    data: {
      organizationId,
      slug,
      ...toProductData(input),
      images: {
        create: input.images.map((image, index) => ({
          url: image.url,
          alt: image.alt ?? "",
          position: image.position ?? index,
        })),
      },
      variants: {
        create: input.variants.map((variant) => ({
          title: variant.title,
          options: variant.options as Prisma.InputJsonValue,
          sku: variant.sku || null,
          price: variant.price ?? null,
          compareAtPrice: variant.compareAtPrice ?? null,
          inventoryQuantity: variant.inventoryQuantity,
          imageId: variant.imageId || null,
        })),
      },
      categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
    },
    include: PRODUCT_INCLUDE,
  });
  return serializeProduct(product);
}

export async function updateProductForOrg(organizationId: string, id: string, input: ProductFormValues) {
  const existing = await prisma.product.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!existing) throw notFound("Product not found");
  const slug = await uniqueProductSlug(organizationId, input.title, id);

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productVariant.deleteMany({ where: { productId: id } }),
    prisma.productCategory.deleteMany({ where: { productId: id } }),
  ]);

  const product = await prisma.product.update({
    where: { id },
    data: {
      slug,
      ...toProductData(input),
      images: {
        create: input.images.map((image, index) => ({
          url: image.url,
          alt: image.alt ?? "",
          position: image.position ?? index,
        })),
      },
      variants: {
        create: input.variants.map((variant) => ({
          title: variant.title,
          options: variant.options as Prisma.InputJsonValue,
          sku: variant.sku || null,
          price: variant.price ?? null,
          compareAtPrice: variant.compareAtPrice ?? null,
          inventoryQuantity: variant.inventoryQuantity,
          imageId: variant.imageId || null,
        })),
      },
      categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
    },
    include: PRODUCT_INCLUDE,
  });
  return serializeProduct(product);
}

export async function duplicateProductForOrg(organizationId: string, id: string) {
  const existing = await prisma.product.findFirst({ where: { id, organizationId }, include: PRODUCT_INCLUDE });
  if (!existing) throw notFound("Product not found");
  const title = `${existing.title} (Copy)`;
  const slug = await uniqueProductSlug(organizationId, title);

  const created = await prisma.product.create({
    data: {
      organizationId,
      title,
      slug,
      description: existing.description,
      vendor: existing.vendor,
      productType: existing.productType,
      status: "DRAFT",
      price: existing.price,
      compareAtPrice: existing.compareAtPrice,
      costPerItem: existing.costPerItem,
      sku: existing.sku,
      barcode: existing.barcode,
      trackQuantity: existing.trackQuantity,
      quantity: existing.quantity,
      lowStockThreshold: existing.lowStockThreshold,
      allowBackorder: existing.allowBackorder,
      variantOptionNames: existing.variantOptionNames,
      isFeatured: false,
      seoTitle: existing.seoTitle,
      seoDescription: existing.seoDescription,
      weightKg: existing.weightKg,
      requiresShipping: existing.requiresShipping,
      images: {
        create: existing.images.map((image) => ({ url: image.url, alt: image.alt, position: image.position })),
      },
      variants: {
        create: existing.variants.map((variant) => ({
          title: variant.title,
          options: variant.options as Prisma.InputJsonValue,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          inventoryQuantity: variant.inventoryQuantity,
        })),
      },
      categories: { create: existing.categories.map((entry) => ({ categoryId: entry.categoryId })) },
    },
    include: PRODUCT_INCLUDE,
  });
  return serializeProduct(created);
}

export async function bulkSetProductStatus(
  organizationId: string,
  ids: string[],
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
) {
  await prisma.product.updateMany({ where: { organizationId, id: { in: ids } }, data: { status } });
}

export async function bulkDeleteProducts(organizationId: string, ids: string[]) {
  await prisma.product.deleteMany({ where: { organizationId, id: { in: ids } } });
}

export async function getProductStatsForOrg(organizationId: string) {
  const [total, published, draft, archived, lowStockRows] = await Promise.all([
    prisma.product.count({ where: { organizationId } }),
    prisma.product.count({ where: { organizationId, status: "PUBLISHED" } }),
    prisma.product.count({ where: { organizationId, status: "DRAFT" } }),
    prisma.product.count({ where: { organizationId, status: "ARCHIVED" } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "products"
      WHERE "organizationId" = ${organizationId} AND "trackQuantity" = true AND "quantity" <= "lowStockThreshold"
    `,
  ]);
  return { total, published, draft, archived, lowStock: Number(lowStockRows[0]?.count ?? 0) };
}
