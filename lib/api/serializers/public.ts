import type { Prisma } from "@/lib/generated/prisma/client";
import { roundMoney } from "@/lib/api/validation";

/**
 * Public (storefront) representations. These deliberately omit internal
 * fields — cost price, barcode, low-stock thresholds, exact stock counts,
 * admin notes — and expose only published/active data.
 *
 * IDs: every id is the database cuid serialized as a string. Products and
 * blog posts are addressed by `slug` in URLs; `id` is stable for carts and
 * order payloads.
 */

export interface PublicContext {
  /** Absolute origin used to turn `/media/...` paths into loadable URLs. */
  assetBase: string;
  currency: string;
}

export function resolveAssetUrl(url: string | null | undefined, assetBase: string): string | null {
  if (!url) return null;
  return url.startsWith("/media/") ? `${assetBase}${url}` : url;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const PUBLIC_PRODUCT_INCLUDE = {
  images: { orderBy: { position: "asc" } },
  variants: { where: { isActive: true } },
  categories: {
    include: {
      category: { select: { id: true, slug: true, name: true, parentId: true, isActive: true, archivedAt: true } },
    },
  },
} satisfies Prisma.ProductInclude;

type DbPublicProduct = Prisma.ProductGetPayload<{ include: typeof PUBLIC_PRODUCT_INCLUDE }>;

export function discountPercent(price: number, compareAtPrice: number | null | undefined): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function sizeOrder(size: string): number {
  const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const index = order.indexOf(size.toUpperCase());
  if (index !== -1) return index;
  const numeric = Number(size);
  return Number.isFinite(numeric) ? 100 + numeric : 1000;
}

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function serializePublicProduct(product: DbPublicProduct, ctx: PublicContext) {
  const categories = product.categories
    .map((entry) => entry.category)
    .filter((category) => category.isActive && !category.archivedAt)
    .map((category) => ({ id: category.id, slug: category.slug, name: category.name, parentId: category.parentId }));
  const primaryCategory = categories.find((category) => !category.parentId) ?? categories[0] ?? null;

  const isAvailable = (quantity: number) => !product.trackQuantity || product.allowBackorder || quantity > 0;

  const variants = product.variants.map((variant) => {
    const price = variant.price ?? product.price;
    const compareAtPrice = variant.compareAtPrice ?? product.compareAtPrice ?? null;
    return {
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      options: variant.options as { name: string; value: string }[],
      price,
      compareAtPrice,
      discount: discountPercent(price, compareAtPrice),
      available: isAvailable(variant.inventoryQuantity),
      imageId: variant.imageId,
    };
  });

  const images = product.images.map((image) => ({
    id: image.id,
    url: resolveAssetUrl(image.url, ctx.assetBase) as string,
    alt: image.alt || product.title,
    position: image.position,
  }));

  const inStock = variants.length > 0 ? variants.some((variant) => variant.available) : isAvailable(product.quantity);

  return {
    id: product.id,
    slug: product.slug,
    name: product.title,
    summary: product.summary,
    description: product.description,
    features: product.features ?? [],
    productType: product.productType,
    vendor: product.vendor,
    category: primaryCategory,
    categories,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    discount: discountPercent(product.price, product.compareAtPrice),
    currency: ctx.currency,
    image: images[0]?.url ?? null,
    gallery: images.map((image) => image.url),
    images,
    availableSizes: unique(variants.map((variant) => variant.size)).sort((a, b) => sizeOrder(a) - sizeOrder(b)),
    availableColors: unique(variants.map((variant) => variant.color)),
    variantOptionNames: product.variantOptionNames,
    variants,
    inStock,
    isFeatured: product.isFeatured,
    /** No review system exists yet; always null until one is built. */
    rating: null as number | null,
    seo: {
      title: product.seoTitle || product.title,
      description: product.seoDescription || product.summary || product.description.slice(0, 160),
    },
    publishedAt: product.publishedAt?.toISOString() ?? null,
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type PublicProduct = ReturnType<typeof serializePublicProduct>;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface PublicCategoryRow {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  parentId: string | null;
  position: number;
}

export function serializePublicCategory(
  category: PublicCategoryRow,
  productCount: number,
  children: { id: string; slug: string; name: string; productCount: number }[],
  ctx: Pick<PublicContext, "assetBase">
) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    title: category.title || category.name,
    description: category.description,
    imageUrl: resolveAssetUrl(category.imageUrl, ctx.assetBase),
    imageAlt: category.imageAlt || category.name,
    parentId: category.parentId,
    position: category.position,
    productCount,
    children,
  };
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export const PUBLIC_BLOG_INCLUDE = {
  category: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.BlogPostInclude;

type DbPublicBlogPost = Prisma.BlogPostGetPayload<{ include: typeof PUBLIC_BLOG_INCLUDE }>;

export function serializePublicBlogPost(post: DbPublicBlogPost, ctx: Pick<PublicContext, "assetBase">, withContent: boolean) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    ...(withContent ? { content: post.content } : {}),
    coverImageUrl: resolveAssetUrl(post.coverImageUrl, ctx.assetBase),
    coverImageAlt: post.coverImageAlt || post.title,
    authorName: post.authorName || null,
    category: post.category,
    isFeatured: post.isFeatured,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    seo: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
    },
  };
}

// ---------------------------------------------------------------------------
// Orders (guest view)
// ---------------------------------------------------------------------------

export const PUBLIC_ORDER_INCLUDE = { items: true } satisfies Prisma.OrderInclude;
type DbPublicOrder = Prisma.OrderGetPayload<{ include: typeof PUBLIC_ORDER_INCLUDE }>;

export function serializePublicOrder(order: DbPublicOrder, ctx: Pick<PublicContext, "assetBase">) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status.toLowerCase() as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
    paymentStatus: order.paymentStatus.toLowerCase() as "pending" | "paid" | "refunded" | "failed",
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productSlug: item.productSlug,
      variantId: item.variantId,
      name: item.productName,
      variantTitle: item.variantTitle,
      sku: item.sku,
      size: item.size,
      color: item.color,
      image: resolveAssetUrl(item.imageUrl, ctx.assetBase),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      compareAtPrice: item.compareAtPrice,
      lineTotal: item.total,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    tax: order.tax,
    total: roundMoney(order.total),
    shippingAddress: order.shippingAddress,
    contact: { name: order.shippingName, email: order.shippingEmail, phone: order.shippingPhone },
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
