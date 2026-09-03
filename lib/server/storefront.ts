import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { PRODUCT_INCLUDE, serializeProduct } from "@/lib/api/serializers/product";
import { ORDER_INCLUDE, serializeOrder } from "@/lib/api/serializers/order";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function resolveActiveOrg(slug: string) {
  const organization = await prisma.organization.findUnique({ where: { slug } });
  if (!organization || organization.status !== "ACTIVE") throw notFound("Store not found");
  return organization;
}

export async function getStorefrontHome(slug: string) {
  const organization = await resolveActiveOrg(slug);
  const config = await prisma.storefrontConfig.findUnique({ where: { organizationId: organization.id } });
  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl,
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      address: organization.address,
    },
    storefront: config
      ? {
          storeName: config.storeName,
          logoUrl: config.logoUrl,
          faviconUrl: config.faviconUrl,
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor,
          fontFamily: config.fontFamily,
          heroHeadline: config.heroHeadline,
          heroSubheadline: config.heroSubheadline,
          heroImageUrl: config.heroImageUrl,
          featuredProductIds: config.featuredProductIds,
          featuredCategoryIds: config.featuredCategoryIds,
          footerText: config.footerText,
          contactEmail: config.contactEmail,
          contactPhone: config.contactPhone,
          socialLinks: config.socialLinks,
        }
      : null,
  };
}

export async function listStorefrontCategories(slug: string) {
  const organization = await resolveActiveOrg(slug);
  const categories = await prisma.category.findMany({
    where: { organizationId: organization.id, archivedAt: null },
    orderBy: { name: "asc" },
  });
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
  }));
}

export interface ListStorefrontProductsParams {
  search?: string;
  categoryId?: string;
  page: number;
  pageSize: number;
}

export async function listStorefrontProducts(slug: string, params: ListStorefrontProductsParams) {
  const organization = await resolveActiveOrg(slug);
  const where: Prisma.ProductWhereInput = {
    organizationId: organization.id,
    status: "PUBLISHED",
    ...(params.categoryId ? { categories: { some: { categoryId: params.categoryId } } } : {}),
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  return { items: items.map(serializeProduct), total };
}

export async function getStorefrontProductBySlug(orgSlug: string, productSlug: string) {
  const organization = await resolveActiveOrg(orgSlug);
  const product = await prisma.product.findFirst({
    where: { organizationId: organization.id, slug: productSlug, status: "PUBLISHED" },
    include: PRODUCT_INCLUDE,
  });
  if (!product) throw notFound("Product not found");
  return serializeProduct(product);
}

export interface CheckoutInput {
  customer: { name: string; email: string; phone?: string };
  shippingAddress: Prisma.InputJsonValue;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  discount?: number;
}

export async function createStorefrontOrder(orgSlug: string, input: CheckoutInput) {
  const organization = await resolveActiveOrg(orgSlug);
  if (input.items.length === 0) throw badRequest("Cart is empty");

  const settings = await prisma.organizationSettings.findUnique({ where: { organizationId: organization.id } });

  return prisma.$transaction(async (tx) => {
    const lineItems: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      variantTitle?: string;
      sku?: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    for (const item of input.items) {
      if (item.quantity <= 0) throw badRequest("Item quantity must be positive");

      const product = await tx.product.findFirst({
        where: { id: item.productId, organizationId: organization.id, status: "PUBLISHED" },
        include: { variants: true },
      });
      if (!product) throw notFound(`Product ${item.productId} not found`);

      const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : undefined;
      if (item.variantId && !variant) throw notFound(`Variant ${item.variantId} not found`);

      const unitPrice = variant?.price ?? product.price;

      if (variant) {
        const result = await tx.productVariant.updateMany({
          where: {
            id: variant.id,
            ...(product.allowBackorder ? {} : { inventoryQuantity: { gte: item.quantity } }),
          },
          data: { inventoryQuantity: { decrement: item.quantity } },
        });
        if (result.count === 0) throw conflict(`${product.title} (${variant.title}) is out of stock`);
      } else if (product.trackQuantity) {
        const result = await tx.product.updateMany({
          where: {
            id: product.id,
            ...(product.allowBackorder ? {} : { quantity: { gte: item.quantity } }),
          },
          data: { quantity: { decrement: item.quantity } },
        });
        if (result.count === 0) throw conflict(`${product.title} is out of stock`);
      }

      lineItems.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.title,
        variantTitle: variant?.title,
        sku: variant?.sku ?? product.sku ?? undefined,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice * item.quantity,
      });
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const discount = input.discount ?? 0;
    const shippingCost =
      settings?.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
        ? 0
        : (settings?.shippingFlatRate ?? 0);
    const tax = settings ? Math.round(subtotal * (settings.taxRatePercent / 100) * 100) / 100 : 0;
    const total = Math.max(0, subtotal - discount) + shippingCost + tax;

    const customer = await tx.customer.upsert({
      where: { organizationId_email: { organizationId: organization.id, email: input.customer.email } },
      update: { name: input.customer.name, phone: input.customer.phone, address: input.shippingAddress },
      create: {
        organizationId: organization.id,
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        address: input.shippingAddress,
      },
    });

    const orderNumber = `${settings?.orderNumberPrefix ?? "ORD"}-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;

    const order = await tx.order.create({
      data: {
        organizationId: organization.id,
        orderNumber,
        customerId: customer.id,
        shippingName: input.customer.name,
        shippingEmail: input.customer.email,
        shippingPhone: input.customer.phone,
        shippingAddress: input.shippingAddress,
        subtotal,
        discount,
        shipping: shippingCost,
        tax,
        total,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantTitle: item.variantTitle,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    return serializeOrder(order);
  });
}
