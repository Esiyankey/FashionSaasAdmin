import "server-only";
import { prisma } from "@/lib/db";
import { badRequest, conflict, notFound, validationError } from "@/lib/api/errors";
import { PRODUCT_INCLUDE, serializeProduct, statusToDb } from "@/lib/api/serializers/product";
import { deriveSizeAndColor, variantOptionKey } from "@/lib/server/variants";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";
import { slugify } from "@/utils/slugify";
import type { ProductFormValues } from "@/features/products/components/ProductForm/schema";
import type { Prisma, ProductStatus } from "@/lib/generated/prisma/client";

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
    title: input.title.trim(),
    description: input.description,
    summary: input.summary.trim(),
    features: input.features.map((feature) => feature.trim()).filter(Boolean),
    vendor: input.vendor,
    productType: input.productType.trim(),
    status: statusToDb(input.status),
    price: input.price,
    compareAtPrice: input.compareAtPrice || null,
    costPerItem: input.costPerItem ?? null,
    sku: input.sku?.trim() || null,
    barcode: input.barcode?.trim() || null,
    trackQuantity: input.inventory.trackQuantity,
    quantity: input.inventory.quantity,
    lowStockThreshold: input.inventory.lowStockThreshold,
    allowBackorder: input.inventory.allowBackorder,
    variantOptionNames: input.variantOptionNames,
    isFeatured: input.isFeatured,
    featuredPosition: input.isFeatured ? (input.featuredPosition ?? null) : null,
    seoTitle: input.seo.title,
    seoDescription: input.seo.description,
    weightKg: input.shipping.weightKg ?? null,
    requiresShipping: input.shipping.requiresShipping,
  };
}

/** Category ids must belong to the same organization. */
async function assertCategoriesOwned(organizationId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) return;
  const count = await prisma.category.count({ where: { organizationId, id: { in: categoryIds }, archivedAt: null } });
  if (count !== new Set(categoryIds).size) {
    throw validationError({ categoryIds: ["One or more categories do not exist"] });
  }
}

/**
 * SKUs are unique per organization across products and variants. The DB
 * enforces product↔product and variant↔variant; this checks across the two.
 */
async function assertSkusAvailable(organizationId: string, input: ProductFormValues, productId?: string) {
  const skus = [input.sku, ...input.variants.map((variant) => variant.sku)]
    .map((sku) => sku?.trim())
    .filter((sku): sku is string => Boolean(sku));
  if (skus.length === 0) return;
  const notThisProduct = productId ? { not: productId } : undefined;
  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId, sku: { in: skus, mode: "insensitive" }, ...(notThisProduct ? { id: notThisProduct } : {}) },
      select: { sku: true },
    }),
    prisma.productVariant.findMany({
      where: {
        organizationId,
        sku: { in: skus, mode: "insensitive" },
        ...(notThisProduct ? { productId: notThisProduct } : {}),
      },
      select: { sku: true },
    }),
  ]);
  const taken = [...products, ...variants].map((row) => row.sku).filter(Boolean);
  if (taken.length > 0) {
    throw validationError({ sku: [`SKU already used by another product: ${[...new Set(taken)].join(", ")}`] });
  }
}

function variantData(organizationId: string, variant: ProductFormValues["variants"][number], imageId: string | null) {
  const options = variant.options.map((option) => ({ name: option.name.trim(), value: option.value.trim() }));
  const { size, color } = deriveSizeAndColor(options);
  return {
    organizationId,
    title: variant.title.trim(),
    options: options as Prisma.InputJsonValue,
    optionKey: options.length > 0 ? variantOptionKey(options) : `title=${variant.title.trim().toLowerCase()}`,
    size,
    color,
    sku: variant.sku?.trim() || null,
    price: variant.price ?? null,
    compareAtPrice: variant.compareAtPrice ?? null,
    inventoryQuantity: variant.inventoryQuantity,
    isActive: variant.isActive ?? true,
    imageId,
  };
}

/**
 * Applies images, variants and categories as a diff so existing variant ids
 * (referenced by carts and order items) survive an edit.
 */
async function syncProductChildren(
  tx: Prisma.TransactionClient,
  organizationId: string,
  productId: string,
  input: ProductFormValues
) {
  // Images: keep ids that still exist, create new ones, drop removed ones.
  const existingImages = await tx.productImage.findMany({ where: { productId }, select: { id: true } });
  const existingImageIds = new Set(existingImages.map((image) => image.id));
  const imageIdMap = new Map<string, string>();
  const keptImageIds: string[] = [];
  for (const [index, image] of input.images.entries()) {
    const data = { url: image.url, alt: image.alt ?? "", position: image.position ?? index };
    if (existingImageIds.has(image.id)) {
      await tx.productImage.update({ where: { id: image.id }, data });
      imageIdMap.set(image.id, image.id);
      keptImageIds.push(image.id);
    } else {
      const created = await tx.productImage.create({ data: { productId, ...data } });
      imageIdMap.set(image.id, created.id);
      keptImageIds.push(created.id);
    }
  }
  await tx.productImage.deleteMany({ where: { productId, id: { notIn: keptImageIds } } });

  // Variants: same strategy. Removed variants are deleted; order items keep their snapshot.
  const existingVariants = await tx.productVariant.findMany({ where: { productId }, select: { id: true } });
  const existingVariantIds = new Set(existingVariants.map((variant) => variant.id));
  const incomingIds = new Set(input.variants.map((variant) => variant.id));
  await tx.productVariant.deleteMany({
    where: { productId, id: { notIn: [...incomingIds].filter((id) => existingVariantIds.has(id)) } },
  });
  for (const variant of input.variants) {
    const data = variantData(organizationId, variant, variant.imageId ? (imageIdMap.get(variant.imageId) ?? null) : null);
    if (existingVariantIds.has(variant.id)) {
      await tx.productVariant.update({ where: { id: variant.id }, data });
    } else {
      await tx.productVariant.create({ data: { productId, ...data } });
    }
  }

  await tx.productCategory.deleteMany({ where: { productId } });
  if (input.categoryIds.length > 0) {
    await tx.productCategory.createMany({
      data: [...new Set(input.categoryIds)].map((categoryId) => ({ productId, categoryId })),
    });
  }
}

function productTags(...slugs: string[]) {
  return [
    StorefrontTag.products,
    StorefrontTag.categories,
    StorefrontTag.outfitFinder,
    ...slugs.map((slug) => StorefrontTag.product(slug)),
  ];
}

export async function createProductForOrg(organizationId: string, input: ProductFormValues) {
  await assertCategoriesOwned(organizationId, input.categoryIds);
  await assertSkusAvailable(organizationId, input);
  const slug = await uniqueProductSlug(organizationId, input.title);
  const data = toProductData(input);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        organizationId,
        slug,
        ...data,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });
    await syncProductChildren(tx, organizationId, created.id, input);
    return tx.product.findUniqueOrThrow({ where: { id: created.id }, include: PRODUCT_INCLUDE });
  });

  notifyStorefront(organizationId, productTags(product.slug));
  return serializeProduct(product);
}

export async function updateProductForOrg(organizationId: string, id: string, input: ProductFormValues) {
  const existing = await prisma.product.findFirst({
    where: { id, organizationId },
    select: { id: true, slug: true, publishedAt: true },
  });
  if (!existing) throw notFound("Product not found");
  await assertCategoriesOwned(organizationId, input.categoryIds);
  await assertSkusAvailable(organizationId, input, id);
  const slug = await uniqueProductSlug(organizationId, input.title, id);
  const data = toProductData(input);

  const product = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        slug,
        ...data,
        ...(data.status === "PUBLISHED" && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
    await syncProductChildren(tx, organizationId, id, input);
    return tx.product.findUniqueOrThrow({ where: { id }, include: PRODUCT_INCLUDE });
  });

  notifyStorefront(organizationId, productTags(existing.slug, product.slug));
  return serializeProduct(product);
}

export async function duplicateProductForOrg(organizationId: string, id: string) {
  const existing = await prisma.product.findFirst({ where: { id, organizationId }, include: PRODUCT_INCLUDE });
  if (!existing) throw notFound("Product not found");
  const title = `${existing.title} (Copy)`;
  const slug = await uniqueProductSlug(organizationId, title);

  // SKUs are unique per organization, so the copy starts without them.
  const created = await prisma.product.create({
    data: {
      organizationId,
      title,
      slug,
      description: existing.description,
      summary: existing.summary,
      features: existing.features,
      vendor: existing.vendor,
      productType: existing.productType,
      status: "DRAFT",
      price: existing.price,
      compareAtPrice: existing.compareAtPrice,
      costPerItem: existing.costPerItem,
      sku: null,
      barcode: null,
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
          organizationId,
          title: variant.title,
          options: variant.options as Prisma.InputJsonValue,
          optionKey: variant.optionKey,
          size: variant.size,
          color: variant.color,
          sku: null,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          inventoryQuantity: variant.inventoryQuantity,
          isActive: variant.isActive,
        })),
      },
      categories: { create: existing.categories.map((entry) => ({ categoryId: entry.categoryId })) },
    },
    include: PRODUCT_INCLUDE,
  });
  return serializeProduct(created);
}

export async function bulkSetProductStatus(organizationId: string, ids: string[], status: ProductStatus) {
  const products = await prisma.product.findMany({
    where: { organizationId, id: { in: ids } },
    select: { id: true, slug: true, publishedAt: true, _count: { select: { images: true } } },
  });
  if (status === "PUBLISHED") {
    const withoutImages = products.filter((product) => product._count.images === 0);
    if (withoutImages.length > 0) {
      throw validationError(
        { ids: withoutImages.map((product) => `${product.slug} has no images`) },
        "Add at least one image before publishing"
      );
    }
  }
  await prisma.$transaction([
    prisma.product.updateMany({ where: { organizationId, id: { in: ids } }, data: { status } }),
    ...(status === "PUBLISHED"
      ? [
          prisma.product.updateMany({
            where: { organizationId, id: { in: ids }, publishedAt: null },
            data: { publishedAt: new Date() },
          }),
        ]
      : []),
  ]);
  notifyStorefront(organizationId, productTags(...products.map((product) => product.slug)));
}

/** Products that appear on orders are archived instead of deleted so order history stays linked. */
export async function deleteProductsForOrg(organizationId: string, ids: string[]) {
  if (ids.length === 0) throw badRequest("No products selected");
  const products = await prisma.product.findMany({
    where: { organizationId, id: { in: ids } },
    select: { id: true, slug: true, title: true, _count: { select: { orderItems: true } } },
  });
  if (products.length === 0) throw notFound("Product not found");
  const ordered = products.filter((product) => product._count.orderItems > 0);
  if (ordered.length > 0) {
    throw conflict(
      `${ordered.map((product) => product.title).join(", ")} ${ordered.length === 1 ? "has" : "have"} been ordered and cannot be deleted. Archive instead.`,
      "PRODUCT_HAS_ORDERS"
    );
  }
  await prisma.product.deleteMany({ where: { organizationId, id: { in: products.map((product) => product.id) } } });
  notifyStorefront(organizationId, productTags(...products.map((product) => product.slug)));
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
