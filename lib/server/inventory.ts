import "server-only";
import { prisma } from "@/lib/db";
import { badRequest, notFound } from "@/lib/api/errors";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface ListInventoryParams {
  search?: string;
  lowStockOnly?: boolean;
  page: number;
  pageSize: number;
}

export async function listInventoryForOrg(organizationId: string, params: ListInventoryParams) {
  const where: Prisma.ProductWhereInput = {
    organizationId,
    trackQuantity: true,
    ...(params.search
      ? { OR: [{ title: { contains: params.search, mode: "insensitive" } }, { sku: { contains: params.search, mode: "insensitive" } }] }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { title: "asc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        title: true,
        sku: true,
        quantity: true,
        lowStockThreshold: true,
        allowBackorder: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        variants: { select: { id: true, title: true, sku: true, inventoryQuantity: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items = products
    .map((product) => ({
      id: product.id,
      title: product.title,
      sku: product.sku,
      imageUrl: product.images[0]?.url ?? null,
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold,
      allowBackorder: product.allowBackorder,
      isLowStock: product.quantity <= product.lowStockThreshold,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        quantity: variant.inventoryQuantity,
      })),
    }))
    .filter((item) => !params.lowStockOnly || item.isLowStock);

  return { items, total: params.lowStockOnly ? items.length : total };
}

export interface AdjustInventoryInput {
  variantId?: string;
  delta: number;
}

export async function adjustInventoryForOrg(organizationId: string, productId: string, input: AdjustInventoryInput) {
  const product = await prisma.product.findFirst({ where: { id: productId, organizationId }, select: { id: true } });
  if (!product) throw notFound("Product not found");

  if (input.variantId) {
    const result = await prisma.productVariant.updateMany({
      where: {
        id: input.variantId,
        productId,
        ...(input.delta < 0 ? { inventoryQuantity: { gte: -input.delta } } : {}),
      },
      data: { inventoryQuantity: { increment: input.delta } },
    });
    if (result.count === 0) throw badRequest("This adjustment would result in negative stock");
  } else {
    const result = await prisma.product.updateMany({
      where: {
        id: productId,
        organizationId,
        ...(input.delta < 0 ? { quantity: { gte: -input.delta } } : {}),
      },
      data: { quantity: { increment: input.delta } },
    });
    if (result.count === 0) throw badRequest("This adjustment would result in negative stock");
  }
}
