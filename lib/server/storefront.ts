import "server-only";
import { randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/api/errors";
import { paginated, type Pagination } from "@/lib/api/handler";
import { roundMoney } from "@/lib/api/validation";
import {
  PUBLIC_BLOG_INCLUDE,
  PUBLIC_ORDER_INCLUDE,
  PUBLIC_PRODUCT_INCLUDE,
  resolveAssetUrl,
  serializePublicBlogPost,
  serializePublicCategory,
  serializePublicOrder,
  serializePublicProduct,
  type PublicContext,
} from "@/lib/api/serializers/public";
import { restockOrderItems } from "@/lib/server/orders";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";
import type { Prisma } from "@/lib/generated/prisma/client";

// ---------------------------------------------------------------------------
// Organization / context
// ---------------------------------------------------------------------------

export async function resolveActiveOrg(slug: string) {
  const organization = await prisma.organization.findUnique({ where: { slug: slug.toLowerCase() } });
  if (!organization || organization.status !== "ACTIVE") throw notFound("Store not found");
  return organization;
}

async function publicContext(organizationId: string, assetBase: string): Promise<PublicContext> {
  const settings = await prisma.organizationSettings.findUnique({
    where: { organizationId },
    select: { currency: true },
  });
  return { assetBase, currency: settings?.currency ?? "USD" };
}

const PUBLISHED = "PUBLISHED" as const;

// ---------------------------------------------------------------------------
// Store information, contact, navigation, announcement, hero
// ---------------------------------------------------------------------------

export async function getStorefrontHome(slug: string, assetBase: string) {
  const organization = await resolveActiveOrg(slug);
  const [config, settings, navigation] = await Promise.all([
    prisma.storefrontConfig.findUnique({ where: { organizationId: organization.id } }),
    prisma.organizationSettings.findUnique({ where: { organizationId: organization.id } }),
    prisma.navigationLink.findMany({
      where: { organizationId: organization.id, isVisible: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { location: true, label: true, href: true },
    }),
  ]);

  const socialLinks =
    config?.socialLinks && typeof config.socialLinks === "object" && !Array.isArray(config.socialLinks)
      ? Object.entries(config.socialLinks as Record<string, unknown>)
          .filter(([, url]) => typeof url === "string" && url)
          .map(([platform, url]) => ({ platform, url: url as string }))
      : [];

  return {
    store: {
      id: organization.id,
      slug: organization.slug,
      name: config?.storeName || organization.name,
      description: organization.description,
      logoUrl: resolveAssetUrl(config?.logoUrl ?? organization.logoUrl, assetBase),
      faviconUrl: resolveAssetUrl(config?.faviconUrl, assetBase),
      primaryColor: config?.primaryColor ?? null,
      secondaryColor: config?.secondaryColor ?? null,
      fontFamily: config?.fontFamily ?? null,
      siteUrl: config?.siteUrl ?? null,
      footerText: config?.footerText ?? null,
      seo: {
        title: config?.seoTitle || config?.storeName || organization.name,
        description: config?.seoDescription || organization.description || "",
      },
    },
    contact: {
      email: config?.contactEmail ?? organization.contactEmail,
      phone: config?.contactPhone ?? organization.contactPhone,
      addressLines:
        config && config.addressLines.length > 0
          ? config.addressLines
          : organization.address
            ? [organization.address]
            : [],
      workingHours: config?.workingHours ?? null,
      mapEmbedUrl: config?.mapEmbedUrl ?? null,
    },
    socialLinks,
    announcement:
      config?.announcementEnabled && config.announcementMessage
        ? {
            message: config.announcementMessage,
            highlight: config.announcementHighlight,
            linkLabel: config.announcementLinkLabel,
            linkHref: config.announcementLinkHref,
            showPhone: config.announcementShowPhone,
          }
        : null,
    hero: config?.heroHeadline
      ? {
          badgeText: config.heroBadgeText,
          headline: config.heroHeadline,
          subheadline: config.heroSubheadline,
          imageUrl: resolveAssetUrl(config.heroImageUrl, assetBase),
          imageAlt: config.heroImageAlt || config.heroHeadline,
          ctaLabel: config.heroCtaLabel,
          ctaHref: config.heroCtaHref,
        }
      : null,
    navigation: {
      header: navigation.filter((link) => link.location === "HEADER").map(({ label, href }) => ({ label, href })),
      footer: navigation.filter((link) => link.location === "FOOTER").map(({ label, href }) => ({ label, href })),
    },
    commerce: {
      currency: settings?.currency ?? "USD",
      taxRatePercent: settings?.taxRatePercent ?? 0,
      shippingFlatRate: settings?.shippingFlatRate ?? 0,
      freeShippingThreshold: settings?.freeShippingThreshold ?? null,
    },
    updatedAt: (config?.updatedAt ?? organization.updatedAt).toISOString(),
  };
}

export async function getStorefrontPage(slug: string, key: string, assetBase: string) {
  const organization = await resolveActiveOrg(slug);
  const page = await prisma.pageContent.findUnique({
    where: { organizationId_key: { organizationId: organization.id, key } },
  });
  if (!page) throw notFound("Page not found");
  const teamMembers =
    key === "about"
      ? await prisma.teamMember.findMany({
          where: { organizationId: organization.id, isVisible: true },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        })
      : [];
  return {
    key: page.key,
    content: absolutizeMediaInJson(page.content, assetBase),
    teamMembers: teamMembers.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      imageUrl: resolveAssetUrl(member.imageUrl, assetBase),
    })),
    updatedAt: page.updatedAt.toISOString(),
  };
}

function absolutizeMediaInJson(value: Prisma.JsonValue, assetBase: string): Prisma.JsonValue {
  if (typeof value === "string") return resolveAssetUrl(value, assetBase) ?? value;
  if (Array.isArray(value)) return value.map((entry) => absolutizeMediaInJson(entry, assetBase));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, absolutizeMediaInJson(entry as Prisma.JsonValue, assetBase)])
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

async function loadActiveCategories(organizationId: string) {
  const categories = await prisma.category.findMany({
    where: { organizationId, archivedAt: null, isActive: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      title: true,
      description: true,
      imageUrl: true,
      imageAlt: true,
      parentId: true,
      position: true,
    },
  });
  // A child whose parent is inactive/archived is treated as hidden too.
  const ids = new Set(categories.map((category) => category.id));
  return categories.filter((category) => !category.parentId || ids.has(category.parentId));
}

function descendantIds(categoryId: string, categories: { id: string; parentId: string | null }[]): string[] {
  const result = [categoryId];
  for (let i = 0; i < result.length; i += 1) {
    for (const category of categories) if (category.parentId === result[i]) result.push(category.id);
  }
  return result;
}

/** Published product counts per category, including products in subcategories. */
async function categoryProductCounts(organizationId: string, categories: { id: string; parentId: string | null }[]) {
  const links = await prisma.productCategory.findMany({
    where: { category: { organizationId }, product: { organizationId, status: PUBLISHED } },
    select: { productId: true, categoryId: true },
  });
  const productsByCategory = new Map<string, Set<string>>();
  for (const link of links) {
    if (!productsByCategory.has(link.categoryId)) productsByCategory.set(link.categoryId, new Set());
    productsByCategory.get(link.categoryId)!.add(link.productId);
  }
  const counts = new Map<string, number>();
  for (const category of categories) {
    const productIds = new Set<string>();
    for (const id of descendantIds(category.id, categories)) {
      for (const productId of productsByCategory.get(id) ?? []) productIds.add(productId);
    }
    counts.set(category.id, productIds.size);
  }
  return counts;
}

export async function listStorefrontCategories(slug: string, assetBase: string) {
  const organization = await resolveActiveOrg(slug);
  const categories = await loadActiveCategories(organization.id);
  const counts = await categoryProductCounts(organization.id, categories);
  return categories.map((category) =>
    serializePublicCategory(
      category,
      counts.get(category.id) ?? 0,
      categories
        .filter((child) => child.parentId === category.id)
        .map((child) => ({ id: child.id, slug: child.slug, name: child.name, productCount: counts.get(child.id) ?? 0 })),
      { assetBase }
    )
  );
}

export async function getStorefrontCategory(orgSlug: string, categorySlug: string, assetBase: string) {
  const all = await listStorefrontCategories(orgSlug, assetBase);
  const category = all.find((entry) => entry.slug === categorySlug.toLowerCase());
  if (!category) throw notFound("Category not found");
  return category;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc" | "name-asc";

export interface ListStorefrontProductsParams extends Pagination {
  q?: string;
  /** Category slugs (case-insensitive). Products in subcategories are included. */
  categories?: string[];
  /** Legacy filter by category id. */
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  productType?: string;
  featured?: boolean;
  inStock?: boolean;
  sort?: ProductSort;
}

function orderByForSort(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "price-desc":
      return [{ price: "desc" }, { id: "asc" }];
    case "name-asc":
      return [{ title: "asc" }, { id: "asc" }];
    case "newest":
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "asc" }];
    case "featured":
    default:
      return [
        { isFeatured: "desc" },
        { featuredPosition: { sort: "asc", nulls: "last" } },
        { publishedAt: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ];
  }
}

export async function listStorefrontProducts(slug: string, params: ListStorefrontProductsParams, assetBase: string) {
  const organization = await resolveActiveOrg(slug);
  const ctx = await publicContext(organization.id, assetBase);
  const and: Prisma.ProductWhereInput[] = [];

  if (params.categories?.length || params.categoryId) {
    const categories = await loadActiveCategories(organization.id);
    const wanted = new Set((params.categories ?? []).map((value) => value.toLowerCase()));
    const roots = categories.filter((category) => wanted.has(category.slug) || category.id === params.categoryId);
    if (roots.length === 0) return paginated([], 0, params);
    const ids = [...new Set(roots.flatMap((root) => descendantIds(root.id, categories)))];
    and.push({ categories: { some: { categoryId: { in: ids } } } });
  }

  if (params.q) {
    and.push({
      OR: [
        { title: { contains: params.q, mode: "insensitive" } },
        { summary: { contains: params.q, mode: "insensitive" } },
        { description: { contains: params.q, mode: "insensitive" } },
        { productType: { contains: params.q, mode: "insensitive" } },
        { sku: { equals: params.q, mode: "insensitive" } },
        { variants: { some: { isActive: true, sku: { equals: params.q, mode: "insensitive" } } } },
      ],
    });
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const range: Prisma.FloatFilter = {
      ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
      ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
    };
    and.push({ OR: [{ price: range }, { variants: { some: { isActive: true, price: range } } }] });
  }

  if (params.sizes?.length) {
    and.push({
      variants: {
        some: { isActive: true, OR: params.sizes.map((size) => ({ size: { equals: size, mode: "insensitive" as const } })) },
      },
    });
  }
  if (params.colors?.length) {
    and.push({
      variants: {
        some: {
          isActive: true,
          OR: params.colors.map((color) => ({ color: { equals: color, mode: "insensitive" as const } })),
        },
      },
    });
  }
  if (params.productType) and.push({ productType: { equals: params.productType, mode: "insensitive" } });
  if (params.featured) and.push({ isFeatured: true });
  if (params.inStock) {
    and.push({
      OR: [
        { trackQuantity: false },
        { allowBackorder: true },
        { variants: { some: { isActive: true, inventoryQuantity: { gt: 0 } } } },
        { variants: { none: { isActive: true } }, quantity: { gt: 0 } },
      ],
    });
  }

  const where: Prisma.ProductWhereInput = { organizationId: organization.id, status: PUBLISHED, AND: and };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PUBLIC_PRODUCT_INCLUDE,
      orderBy: orderByForSort(params.sort ?? "featured"),
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  return paginated(
    items.map((item) => serializePublicProduct(item, ctx)),
    total,
    params
  );
}

/** Looks a published product up by slug (case-insensitive) or by id. */
async function findPublishedProduct(organizationId: string, slugOrId: string) {
  return prisma.product.findFirst({
    where: { organizationId, status: PUBLISHED, OR: [{ slug: slugOrId.toLowerCase() }, { id: slugOrId }] },
    include: PUBLIC_PRODUCT_INCLUDE,
  });
}

export async function getStorefrontProduct(orgSlug: string, slugOrId: string, assetBase: string) {
  const organization = await resolveActiveOrg(orgSlug);
  const product = await findPublishedProduct(organization.id, slugOrId);
  if (!product) throw notFound("Product not found");
  return serializePublicProduct(product, await publicContext(organization.id, assetBase));
}

/** Published products sharing a category with the given product, newest first. */
export async function getRelatedStorefrontProducts(orgSlug: string, slugOrId: string, limit: number, assetBase: string) {
  const organization = await resolveActiveOrg(orgSlug);
  const product = await findPublishedProduct(organization.id, slugOrId);
  if (!product) throw notFound("Product not found");
  const categoryIds = product.categories.map((entry) => entry.categoryId);
  const related = await prisma.product.findMany({
    where: {
      organizationId: organization.id,
      status: PUBLISHED,
      id: { not: product.id },
      ...(categoryIds.length ? { categories: { some: { categoryId: { in: categoryIds } } } } : {}),
    },
    include: PUBLIC_PRODUCT_INCLUDE,
    orderBy: orderByForSort("featured"),
    take: limit,
  });
  const ctx = await publicContext(organization.id, assetBase);
  return { items: related.map((item) => serializePublicProduct(item, ctx)) };
}

/** Values the storefront needs to build its filter UI (price slider bounds, size/colour chips). */
export async function getStorefrontProductFilters(orgSlug: string) {
  const organization = await resolveActiveOrg(orgSlug);
  const where = { organizationId: organization.id, status: PUBLISHED };
  const [priceAgg, variantPriceAgg, sizes, colors, types] = await Promise.all([
    prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
    prisma.productVariant.aggregate({
      where: { isActive: true, product: where },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, size: { not: null }, product: where },
      distinct: ["size"],
      select: { size: true },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, color: { not: null }, product: where },
      distinct: ["color"],
      select: { color: true },
    }),
    prisma.product.findMany({ where: { ...where, productType: { not: "" } }, distinct: ["productType"], select: { productType: true } }),
  ]);
  const mins = [priceAgg._min.price, variantPriceAgg._min.price].filter((value): value is number => value !== null);
  const maxes = [priceAgg._max.price, variantPriceAgg._max.price].filter((value): value is number => value !== null);
  return {
    priceRange: { min: mins.length ? Math.min(...mins) : 0, max: maxes.length ? Math.max(...maxes) : 0 },
    sizes: sizes.map((row) => row.size as string),
    colors: colors.map((row) => row.color as string),
    productTypes: types.map((row) => row.productType),
  };
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

function publishedPostWhere(organizationId: string): Prisma.BlogPostWhereInput {
  return { organizationId, status: PUBLISHED, publishedAt: { lte: new Date() } };
}

export async function listStorefrontBlogPosts(
  orgSlug: string,
  params: Pagination & { category?: string; featured?: boolean },
  assetBase: string
) {
  const organization = await resolveActiveOrg(orgSlug);
  const where: Prisma.BlogPostWhereInput = {
    ...publishedPostWhere(organization.id),
    ...(params.category ? { category: { slug: params.category.toLowerCase() } } : {}),
    ...(params.featured ? { isFeatured: true } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: PUBLIC_BLOG_INCLUDE,
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.blogPost.count({ where }),
  ]);
  return paginated(
    items.map((post) => serializePublicBlogPost(post, { assetBase }, false)),
    total,
    params
  );
}

export async function getStorefrontBlogPost(orgSlug: string, postSlug: string, assetBase: string) {
  const organization = await resolveActiveOrg(orgSlug);
  const post = await prisma.blogPost.findFirst({
    where: { ...publishedPostWhere(organization.id), slug: postSlug.toLowerCase() },
    include: PUBLIC_BLOG_INCLUDE,
  });
  if (!post) throw notFound("Article not found");
  return serializePublicBlogPost(post, { assetBase }, true);
}

export async function listStorefrontBlogCategories(orgSlug: string) {
  const organization = await resolveActiveOrg(orgSlug);
  const categories = await prisma.blogCategory.findMany({
    where: { organizationId: organization.id },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, _count: { select: { posts: { where: publishedPostWhere(organization.id) } } } },
  });
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    postCount: category._count.posts,
  }));
}

// ---------------------------------------------------------------------------
// Checkout (order capture — no payment is collected)
// ---------------------------------------------------------------------------

export interface CheckoutAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface CheckoutInput {
  shippingAddress: CheckoutAddress;
  billingAddress?: Omit<CheckoutAddress, "email" | "phone">;
  items: Array<{ productId: string; variantId?: string; size?: string; color?: string; quantity: number }>;
  paymentMethod: "cod" | "card" | "wallet";
  note?: string;
}

interface ResolvedLine {
  productId: string;
  productSlug: string;
  productName: string;
  variantId?: string;
  variantTitle?: string;
  sku?: string;
  size?: string;
  color?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  compareAtPrice: number | null;
  total: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
}

function sameText(a: string | null | undefined, b: string | undefined): boolean {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}

export async function createStorefrontOrder(orgSlug: string, input: CheckoutInput, assetBase: string) {
  const organization = await resolveActiveOrg(orgSlug);
  const settings = await prisma.organizationSettings.findUnique({ where: { organizationId: organization.id } });

  // Merge duplicate cart lines so stock is checked against the combined quantity.
  const merged = new Map<string, CheckoutInput["items"][number]>();
  for (const item of input.items) {
    const key = [item.productId, item.variantId ?? "", item.size?.toLowerCase() ?? "", item.color?.toLowerCase() ?? ""].join("|");
    const existing = merged.get(key);
    if (existing) existing.quantity += item.quantity;
    else merged.set(key, { ...item });
  }

  const order = await prisma.$transaction(async (tx) => {
    const lines: ResolvedLine[] = [];
    const fieldErrors: Record<string, string[]> = {};
    let index = 0;

    for (const item of merged.values()) {
      const field = `items.${index}`;
      index += 1;
      const product = await tx.product.findFirst({
        where: { id: item.productId, organizationId: organization.id, status: PUBLISHED },
        include: { variants: { where: { isActive: true } }, images: { orderBy: { position: "asc" }, take: 1 } },
      });
      if (!product) {
        fieldErrors[`${field}.productId`] = ["This product is no longer available"];
        continue;
      }

      let variant = item.variantId ? product.variants.find((entry) => entry.id === item.variantId) : undefined;
      if (item.variantId && !variant) {
        fieldErrors[`${field}.variantId`] = [`The selected option of ${product.title} is no longer available`];
        continue;
      }
      if (!variant && (item.size || item.color)) {
        variant = product.variants.find(
          (entry) => (!item.size || sameText(entry.size, item.size)) && (!item.color || sameText(entry.color, item.color))
        );
        if (!variant) {
          fieldErrors[`${field}`] = [`${product.title} is not available in the selected size/colour`];
          continue;
        }
      }
      if (!variant && product.variants.length > 0) {
        fieldErrors[`${field}.variantId`] = [`Choose a size/colour for ${product.title}`];
        continue;
      }

      const unitPrice = variant?.price ?? product.price;
      lines.push({
        productId: product.id,
        productSlug: product.slug,
        productName: product.title,
        variantId: variant?.id,
        variantTitle: variant?.title,
        sku: variant?.sku ?? product.sku ?? undefined,
        size: variant?.size ?? undefined,
        color: variant?.color ?? undefined,
        imageUrl: product.images[0]?.url,
        quantity: item.quantity,
        unitPrice,
        compareAtPrice: variant?.compareAtPrice ?? product.compareAtPrice ?? null,
        total: roundMoney(unitPrice * item.quantity),
        trackQuantity: product.trackQuantity,
        allowBackorder: product.allowBackorder,
      });
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw validationError(fieldErrors, "Some items in your cart are unavailable");
    }

    // Reserve stock atomically: the conditional update only succeeds when enough is on hand.
    for (const line of lines) {
      if (!line.trackQuantity) continue;
      const result = line.variantId
        ? await tx.productVariant.updateMany({
            where: { id: line.variantId, ...(line.allowBackorder ? {} : { inventoryQuantity: { gte: line.quantity } }) },
            data: { inventoryQuantity: { decrement: line.quantity } },
          })
        : await tx.product.updateMany({
            where: { id: line.productId, ...(line.allowBackorder ? {} : { quantity: { gte: line.quantity } }) },
            data: { quantity: { decrement: line.quantity } },
          });
      if (result.count === 0) {
        const label = line.variantTitle ? `${line.productName} (${line.variantTitle})` : line.productName;
        throw conflict(`${label} does not have enough stock for the requested quantity`, "OUT_OF_STOCK");
      }
    }

    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.total, 0));
    const shippingCost =
      settings?.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
        ? 0
        : roundMoney(settings?.shippingFlatRate ?? 0);
    const tax = roundMoney(subtotal * ((settings?.taxRatePercent ?? 0) / 100));
    const total = roundMoney(subtotal + shippingCost + tax);

    const address = input.shippingAddress;
    const email = address.email.toLowerCase();
    const addressJson = {
      fullName: address.fullName,
      street: address.street,
      apartment: address.apartment ?? null,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country ?? null,
    };

    const customer = await tx.customer.upsert({
      where: { organizationId_email: { organizationId: organization.id, email } },
      update: { name: address.fullName, phone: address.phone, address: addressJson },
      create: { organizationId: organization.id, name: address.fullName, email, phone: address.phone, address: addressJson },
    });

    const orderNumber = `${settings?.orderNumberPrefix ?? "ORD"}-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;

    return tx.order.create({
      data: {
        organizationId: organization.id,
        orderNumber,
        accessToken: randomBytes(24).toString("base64url"),
        customerId: customer.id,
        paymentMethod: input.paymentMethod,
        currency: settings?.currency ?? "USD",
        shippingName: address.fullName,
        shippingEmail: email,
        shippingPhone: address.phone,
        shippingAddress: addressJson,
        billingAddress: input.billingAddress ?? undefined,
        customerNote: input.note,
        subtotal,
        discount: 0,
        shipping: shippingCost,
        tax,
        total,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            productSlug: line.productSlug,
            variantId: line.variantId,
            productName: line.productName,
            variantTitle: line.variantTitle,
            sku: line.sku,
            size: line.size,
            color: line.color,
            imageUrl: line.imageUrl,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            compareAtPrice: line.compareAtPrice,
            total: line.total,
          })),
        },
        statusHistory: { create: { toStatus: "PENDING", note: "Order placed on the storefront" } },
      },
      include: PUBLIC_ORDER_INCLUDE,
    });
  });

  notifyStorefront(organization.id, [
    StorefrontTag.products,
    ...order.items.map((item) => StorefrontTag.product(item.productSlug ?? "")).filter((tag) => tag !== "product:"),
  ]);

  return { ...serializePublicOrder(order, { assetBase }), accessToken: order.accessToken };
}

// ---------------------------------------------------------------------------
// Guest order lookup / cancellation
// ---------------------------------------------------------------------------

function tokensMatch(expected: string | null, provided: string | null): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function findGuestOrder(orgSlug: string, orderNumber: string, token: string | null) {
  const organization = await resolveActiveOrg(orgSlug);
  const order = await prisma.order.findUnique({
    where: { organizationId_orderNumber: { organizationId: organization.id, orderNumber } },
    include: PUBLIC_ORDER_INCLUDE,
  });
  // Same 404 for "missing" and "wrong token" so order numbers cannot be probed.
  if (!order || !tokensMatch(order.accessToken, token)) throw notFound("Order not found");
  return { organization, order };
}

export async function getGuestOrder(orgSlug: string, orderNumber: string, token: string | null, assetBase: string) {
  const { order } = await findGuestOrder(orgSlug, orderNumber, token);
  return serializePublicOrder(order, { assetBase });
}

export async function cancelGuestOrder(orgSlug: string, orderNumber: string, token: string | null, assetBase: string) {
  const { organization, order } = await findGuestOrder(orgSlug, orderNumber, token);
  if (order.status !== "PENDING") {
    throw conflict("This order can no longer be cancelled online. Please contact the store.", "INVALID_STATUS_TRANSITION");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Cancelled by customer" },
    });
    if (result.count === 0) throw conflict("This order can no longer be cancelled online.", "INVALID_STATUS_TRANSITION");
    await restockOrderItems(tx, order.id);
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, fromStatus: "PENDING", toStatus: "CANCELLED", note: "Cancelled by customer" },
    });
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: PUBLIC_ORDER_INCLUDE });
  });
  notifyStorefront(organization.id, [StorefrontTag.products]);
  return serializePublicOrder(updated, { assetBase });
}
