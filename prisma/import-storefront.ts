/**
 * One-time, idempotent import of the Fashion SaaS storefront's former mock
 * data into the database, as the organization `fashion-saas`.
 *
 *   npx tsx prisma/import-storefront.ts
 *
 * - Creates records only when they are missing (matched by slug/key), so it
 *   is safe to re-run and never overwrites edits made in the admin.
 * - Never deletes anything.
 * - Copies the storefront's /images/* files into the media library
 *   (see migrateStorefrontImages) so every image URL is served by this app.
 * - Admin login: IMPORT_ADMIN_EMAIL / IMPORT_ADMIN_PASSWORD, or a generated
 *   password printed once (only when the organization has no admin yet).
 *
 * Values the storefront did not have (stock levels, SKUs) are placeholders
 * flagged below and must be reviewed in the admin.
 */
import { config } from "dotenv";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../lib/generated/prisma/client";

config({ path: ".env.local" });

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const ORG_SLUG = "fashion-saas";
/** Placeholder stock per variant — the storefront never tracked inventory. */
const DEFAULT_STOCK = Number(process.env.IMPORT_DEFAULT_STOCK ?? 10);

interface SourceProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  productType: string;
  price: number;
  originalPrice: number;
  image: string;
  summary: string;
  description: string;
  features: string[];
  gallery: string[];
  availableSizes: string[];
  availableColors: string[];
}
interface SourceCategory {
  id: string;
  title: string;
  description?: string;
  image: string;
  imageAlt: string;
  subCategories: string[];
}
interface SourceBlogPost {
  slug: string;
  date: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
}

const data = JSON.parse(readFileSync(join(__dirname, "import", "fashion-saas-storefront.json"), "utf-8")) as {
  products: SourceProduct[];
  categories: SourceCategory[];
  blogPosts: SourceBlogPost[];
};

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

/** Same normalization as lib/server/variants.ts. */
function optionKey(options: { name: string; value: string }[]): string {
  return options
    .map((o) => ({ name: o.name.trim().toLowerCase(), value: o.value.trim().toLowerCase() }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((o) => `${o.name}=${o.value}`)
    .join("|");
}

const created: string[] = [];
const skipped: string[] = [];

async function ensureOrganization() {
  const existing = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (existing) {
    skipped.push("organization");
    return existing;
  }
  created.push("organization");
  return prisma.organization.create({
    data: {
      name: "Fashion SaaS",
      slug: ORG_SLUG,
      description:
        "A modern fashion storefront focused on curated collections, editorial storytelling, and fast, accessible shopping experiences.",
      contactEmail: "hello@fashionsaas.example",
      contactPhone: "(406) 555-0120",
      address: "2331 Beverly Rd, Brooklyn, New York 11226, United States",
    },
  });
}

async function ensureAdmin(organizationId: string) {
  const admin = await prisma.user.findUnique({ where: { organizationId } });
  if (admin) {
    skipped.push(`admin user (${admin.email})`);
    return;
  }
  const email = (process.env.IMPORT_ADMIN_EMAIL ?? "admin@fashionsaas.example").toLowerCase();
  const generated = !process.env.IMPORT_ADMIN_PASSWORD;
  const password = process.env.IMPORT_ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
  await prisma.user.create({
    data: { organizationId, name: "Fashion SaaS Admin", email, passwordHash: await bcrypt.hash(password, 10), role: "ORGANIZATION_ADMIN" },
  });
  created.push(`admin user ${email}`);
  if (generated) console.log(`\n  Admin password for ${email} (shown once, change it after login): ${password}\n`);
}

async function ensureSettings(organizationId: string) {
  // Values from the storefront's CartProvider constants (TAX_RATE 0.08, SHIPPING_COST 0, USD).
  await prisma.organizationSettings.upsert({
    where: { organizationId },
    update: {},
    create: { organizationId, currency: "USD", taxRatePercent: 8, shippingFlatRate: 0, orderNumberPrefix: "FS" },
  });

  const existing = await prisma.storefrontConfig.findUnique({ where: { organizationId } });
  if (existing) {
    skipped.push("storefront config");
    return;
  }
  created.push("storefront config");
  // Contact details: the storefront had three conflicting sets. siteConfig's set is used; the contact
  // page's "Ubud / travella" and the blog footer's values were template leftovers. Replace in the admin.
  await prisma.storefrontConfig.create({
    data: {
      organizationId,
      storeName: "Fashion SaaS",
      primaryColor: "#7a4b2a",
      secondaryColor: "#f7f3ec",
      siteUrl: "https://fashionsaas.example",
      seoTitle: "Fashion SaaS",
      seoDescription:
        "A modern fashion storefront focused on curated collections, editorial storytelling, and fast, accessible shopping experiences.",
      contactEmail: "hello@fashionsaas.example",
      contactPhone: "(406) 555-0120",
      addressLines: ["2331 Beverly Rd", "Brooklyn, New York 11226", "United States"],
      workingHours: "Mon - Sat: 9:00 - 5:00",
      footerText: null,
      announcementEnabled: true,
      announcementMessage: "Sign up and",
      announcementHighlight: "get 25% off",
      announcementLinkLabel: "Shop offers",
      announcementLinkHref: "/shop",
      announcementShowPhone: true,
      heroBadgeText: "50% off summer super sale",
      heroHeadline: "Step Into Style With A Faster, Cleaner Fashion Storefront",
      heroSubheadline:
        "Discover curated wardrobe staples, modern editorial styling, and a premium shopping experience built for speed and clarity.",
      heroImageUrl: "/images/hero-image-2.jpg",
      heroImageAlt: "Fashion hero campaign",
      heroCtaLabel: "Shop Now",
      heroCtaHref: "/shop",
      featuredProductIds: [],
      featuredCategoryIds: [],
    },
  });
}

async function ensureNavigation(organizationId: string) {
  if (await prisma.navigationLink.count({ where: { organizationId } })) {
    skipped.push("navigation");
    return;
  }
  created.push("navigation");
  const header = [
    ["Home", "/"],
    ["Shop", "/shop"],
    ["About", "/about"],
    ["Blog", "/blog"],
    ["Contact", "/contact"],
    ["Outfit Finder", "/outfit_finder"],
  ];
  // Footer placeholders ("Pricing", "FAQ", "Case Studies" all pointed to /about) are imported hidden.
  const footer: [string, string, boolean][] = [
    ["Shop", "/shop", true],
    ["Blog", "/blog", true],
    ["Contact", "/contact", true],
    ["Brand Directory", "/shop", false],
    ["Case Studies", "/about", false],
    ["Pricing", "/about", false],
    ["FAQ", "/about", false],
  ];
  await prisma.navigationLink.createMany({
    data: [
      ...header.map(([label, href], position) => ({ organizationId, location: "HEADER" as const, label, href, position })),
      ...footer.map(([label, href, isVisible], position) => ({ organizationId, location: "FOOTER" as const, label, href, position, isVisible })),
    ],
  });
}

async function ensureAboutPage(organizationId: string) {
  const existing = await prisma.pageContent.findUnique({ where: { organizationId_key: { organizationId, key: "about" } } });
  if (existing) {
    skipped.push("about page");
  } else {
    created.push("about page");
    await prisma.pageContent.create({
      data: {
        organizationId,
        key: "about",
        content: {
          hero: { eyebrow: "Welcome to Fashion SaaS", title: "About Fashion SaaS", image: { url: "/images/hero-image-1.jpg", alt: "About Fashion SaaS" } },
          story: {
            eyebrow: "The Result",
            heading: "Sustainable Elegance",
            body: "We focus on thoughtful, ethical clothing. Our designs are simple, timeless, and crafted with a deep respect for sustainability. Each piece is created to last — designed with intention, not excess.",
            images: [
              { url: "/images/hero-image-2.jpg", alt: "Sustainable style" },
              { url: "/images/hero-image-3.jpg", alt: "Quality fabrics" },
              { url: "/images/hero-image-4.jpg", alt: "Ethical sourcing" },
            ],
            ctaLabel: "Learn More",
            ctaHref: "/blog",
          },
          quote: {
            text: "Fashion SaaS is built on kindness, integrity, and timeless design — creating premium value through simplicity and intention.",
            author: "Robert Anthony",
            role: "CEO & Founder, Fashion SaaS",
          },
          inspiration: {
            heading: "Your Style is Our Inspiration",
            body: "We look for the latest, best in quality clothing and accessories. Follow us on social media for new items, sales, and current updates. We look forward to your support.",
            image: { url: "/images/hero-image-1.jpg", alt: "Our Inspiration" },
            ctaLabel: "Shop the collection",
            ctaHref: "/shop",
          },
        },
      },
    });
  }
  if (!(await prisma.teamMember.count({ where: { organizationId } }))) {
    created.push("team members");
    await prisma.teamMember.createMany({
      data: [
        { name: "Demetria Fisher", role: "Web Designer", imageUrl: "/images/women/woman-dress-1.jpg" },
        { name: "Neil Cunningham", role: "Digital Marketer", imageUrl: "/images/women/woman-dress2.jpg" },
        { name: "Ahmed Hammad", role: "UI/UX Designer", imageUrl: "/images/women/woman-dress-3.jpg" },
      ].map((member, position) => ({ organizationId, position, ...member })),
    });
  }
}

async function ensureCategories(organizationId: string) {
  const idBySlug = new Map<string, string>();
  for (const [position, source] of data.categories.entries()) {
    const name = source.id[0].toUpperCase() + source.id.slice(1);
    const parent = await prisma.category.upsert({
      where: { organizationId_slug: { organizationId, slug: source.id } },
      update: {},
      create: {
        organizationId,
        name,
        slug: source.id,
        title: source.title,
        // The storefront used lorem ipsum here; left empty for real copy.
        description: source.description?.startsWith("Lorem") ? "" : (source.description ?? ""),
        imageUrl: source.image,
        imageAlt: source.imageAlt,
        position,
      },
    });
    idBySlug.set(source.id, parent.id);
    for (const [childPosition, childName] of source.subCategories.entries()) {
      const slug = `${source.id}-${slugify(childName)}`;
      await prisma.category.upsert({
        where: { organizationId_slug: { organizationId, slug } },
        update: {},
        create: { organizationId, name: childName, slug, parentId: parent.id, position: childPosition },
      });
    }
  }
  return idBySlug;
}

async function ensureProducts(organizationId: string, categoryIdBySlug: Map<string, string>) {
  const ids: string[] = [];
  for (const [index, source] of data.products.entries()) {
    const existing = await prisma.product.findUnique({ where: { organizationId_slug: { organizationId, slug: source.slug } } });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const sizeOptions = source.availableSizes;
    const colorOptions = source.availableColors;
    const variants: Prisma.ProductVariantCreateWithoutProductInput[] = [];
    for (const color of colorOptions) {
      for (const size of sizeOptions) {
        const options = [
          { name: "Color", value: color },
          { name: "Size", value: size },
        ];
        variants.push({
          organization: { connect: { id: organizationId } },
          title: `${color} / ${size}`,
          options,
          optionKey: optionKey(options),
          size,
          color,
          sku: `FS-${String(source.id).padStart(3, "0")}-${slugify(color)}-${slugify(size)}`.toUpperCase(),
          inventoryQuantity: DEFAULT_STOCK,
        });
      }
    }
    const categoryId = categoryIdBySlug.get(source.category.toLowerCase());
    const product = await prisma.product.create({
      data: {
        organizationId,
        title: source.name,
        slug: source.slug,
        summary: source.summary,
        description: source.description,
        features: source.features,
        productType: source.productType,
        vendor: "Fashion SaaS",
        status: "PUBLISHED",
        publishedAt: new Date(),
        price: source.price,
        // Discount is derived from compare-at price; the stored "discount" field was inconsistent.
        compareAtPrice: source.originalPrice > source.price ? source.originalPrice : null,
        trackQuantity: true,
        quantity: 0,
        variantOptionNames: ["Color", "Size"],
        // The home slider showed the first 8 products; keep that order as the featured list.
        isFeatured: index < 8,
        featuredPosition: index < 8 ? index : null,
        seoTitle: source.name,
        seoDescription: source.summary,
        images: {
          create: [...new Set([source.image, ...source.gallery])].map((url, position) => ({ url, alt: source.name, position })),
        },
        variants: { create: variants },
        categories: categoryId ? { create: [{ categoryId }] } : undefined,
      },
    });
    created.push(`product ${source.slug}`);
    ids.push(product.id);
  }
  return ids;
}

async function ensureBlog(organizationId: string) {
  for (const source of data.blogPosts) {
    const categorySlug = slugify(source.category);
    const category = await prisma.blogCategory.upsert({
      where: { organizationId_slug: { organizationId, slug: categorySlug } },
      update: {},
      create: { organizationId, name: source.category, slug: categorySlug },
    });
    const existing = await prisma.blogPost.findUnique({ where: { organizationId_slug: { organizationId, slug: source.slug } } });
    if (existing) continue;
    created.push(`blog post ${source.slug}`);
    await prisma.blogPost.create({
      data: {
        organizationId,
        title: source.title,
        slug: source.slug,
        excerpt: source.excerpt,
        // The storefront had no article bodies: every post rendered its excerpt plus two shared
        // paragraphs. Imported as-is so the site keeps working; replace with real articles in the admin.
        content: [
          source.excerpt,
          "Fashion SaaS focuses on clear storytelling, durable product thinking, and wardrobe decisions that age well. This article expands on those themes with a practical, editorial perspective designed for modern shoppers.",
          "When product pages, editorial content, and collection design speak the same language, the result is a stronger brand experience and a more useful shopping journey. That alignment is what this journal is intended to support.",
        ].join("\n\n"),
        coverImageUrl: source.image,
        coverImageAlt: source.title,
        categoryId: category.id,
        status: "PUBLISHED",
        publishedAt: new Date(`${source.date} 12:00:00 UTC`),
      },
    });
  }
}

async function ensureOutfitFinder(organizationId: string, productIds: string[]) {
  const options: { type: "BODY_TYPE" | "SKIN_TONE" | "OCCASION"; key: string; label: string; hex?: string; imageUrl?: string }[] = [
    { type: "BODY_TYPE", key: "hourglass", label: "Hourglass" },
    { type: "BODY_TYPE", key: "pear", label: "Pear" },
    { type: "BODY_TYPE", key: "rectangle", label: "Rectangle" },
    { type: "BODY_TYPE", key: "inverted-triangle", label: "Inverted Triangle" },
    { type: "BODY_TYPE", key: "apple", label: "Apple" },
    { type: "BODY_TYPE", key: "athletic", label: "Athletic" },
    { type: "SKIN_TONE", key: "porcelain", label: "Porcelain", hex: "#FDEBD0" },
    { type: "SKIN_TONE", key: "ivory", label: "Ivory", hex: "#F5CBA7" },
    { type: "SKIN_TONE", key: "sand", label: "Sand", hex: "#E8A87C" },
    { type: "SKIN_TONE", key: "peach", label: "Peach", hex: "#D4845A" },
    { type: "SKIN_TONE", key: "warm-tan", label: "Warm Tan", hex: "#C06A3A" },
    { type: "SKIN_TONE", key: "caramel", label: "Caramel", hex: "#8B4513" },
    { type: "SKIN_TONE", key: "espresso", label: "Espresso", hex: "#5C2E00" },
    { type: "SKIN_TONE", key: "ebony", label: "Deep Ebony", hex: "#3B1A08" },
    { type: "OCCASION", key: "grand-wedding", label: "Grand Wedding", imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&h=280&fit=crop" },
    { type: "OCCASION", key: "cocktail-party", label: "Cocktail Party", imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=280&fit=crop" },
    { type: "OCCASION", key: "weekend-casual", label: "Weekend Casual", imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=280&fit=crop" },
    { type: "OCCASION", key: "executive-formal", label: "Executive Formal", imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=280&fit=crop" },
  ];
  const positions = new Map<string, number>();
  const occasionIds = new Map<string, string>();
  for (const option of options) {
    const position = positions.get(option.type) ?? 0;
    positions.set(option.type, position + 1);
    const row = await prisma.outfitOption.upsert({
      where: { organizationId_type_key: { organizationId, type: option.type, key: option.key } },
      update: {},
      create: { organizationId, position, ...option },
    });
    if (option.type === "OCCASION") occasionIds.set(option.key, row.id);
  }

  // The storefront mock returned the same products for every occasion (first product as the hero,
  // next five as "complete the look"), with a style name per occasion. Imported as that starting point.
  const styleNames: Record<string, string> = {
    "grand-wedding": "The Amber Gala Set",
    "cocktail-party": "The Midnight Soiree Edit",
    "weekend-casual": "The Easy Weekend Edit",
    "executive-formal": "The Boardroom Power Set",
  };
  for (const [key, styleName] of Object.entries(styleNames)) {
    const occasionId = occasionIds.get(key)!;
    if (await prisma.styleLook.count({ where: { organizationId, occasionId } })) continue;
    created.push(`style look ${styleName}`);
    await prisma.styleLook.create({
      data: {
        organizationId,
        occasionId,
        styleName,
        description:
          "Exquisitely tailored for your moment, this edit is selected to complement your undertones and silhouette.",
        tags: ["Sustainable IRL", "Limited Edition", "Hand Finished"],
        heroProductId: productIds[0] ?? null,
        products: { create: productIds.slice(1, 6).map((productId, position) => ({ productId, position })) },
      },
    });
  }
}

const MIME_BY_EXT: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif" };

/**
 * The storefront's images were site-relative files in its own public/ folder
 * (e.g. /images/women/dress.jpg), which only the storefront can serve. Copy
 * each one into the media library and point records at /media/{id}, so the
 * admin can display and replace them. Only references still pointing at the
 * original path are rewritten, so admin edits are never overwritten.
 * Source folder: IMPORT_STOREFRONT_PUBLIC_DIR (default ../FashionSaas/public).
 */
async function migrateStorefrontImages(organizationId: string) {
  const publicDir = process.env.IMPORT_STOREFRONT_PUBLIC_DIR ?? join(__dirname, "..", "..", "FashionSaas", "public");
  const mediaUrlByPath = new Map<string, string>();
  const missing = new Set<string>();

  async function toMedia(path: string | null | undefined): Promise<string | null | undefined> {
    if (!path || !path.startsWith("/images/")) return path;
    if (mediaUrlByPath.has(path)) return mediaUrlByPath.get(path);
    const file = join(publicDir, path);
    let bytes: Buffer;
    try {
      bytes = readFileSync(file);
    } catch {
      missing.add(path);
      return path;
    }
    const filename = path.split("/").pop()!;
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    const asset = await prisma.mediaAsset.create({
      data: { organizationId, filename, mimeType: MIME_BY_EXT[ext] ?? "image/jpeg", sizeBytes: bytes.byteLength, data: new Uint8Array(bytes) },
      select: { id: true },
    });
    mediaUrlByPath.set(path, `/media/${asset.id}`);
    return `/media/${asset.id}`;
  }

  async function rewriteJson(value: Prisma.JsonValue): Promise<Prisma.JsonValue> {
    if (typeof value === "string") return (await toMedia(value)) ?? value;
    if (Array.isArray(value)) return Promise.all(value.map(rewriteJson));
    if (value && typeof value === "object") {
      const entries = await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await rewriteJson(v as Prisma.JsonValue)] as const));
      return Object.fromEntries(entries);
    }
    return value;
  }

  const images = await prisma.productImage.findMany({ where: { product: { organizationId }, url: { startsWith: "/images/" } } });
  for (const image of images) await prisma.productImage.update({ where: { id: image.id }, data: { url: (await toMedia(image.url))! } });

  const categories = await prisma.category.findMany({ where: { organizationId, imageUrl: { startsWith: "/images/" } } });
  for (const c of categories) await prisma.category.update({ where: { id: c.id }, data: { imageUrl: await toMedia(c.imageUrl) } });

  const posts = await prisma.blogPost.findMany({ where: { organizationId, coverImageUrl: { startsWith: "/images/" } } });
  for (const p of posts) await prisma.blogPost.update({ where: { id: p.id }, data: { coverImageUrl: await toMedia(p.coverImageUrl) } });

  const team = await prisma.teamMember.findMany({ where: { organizationId, imageUrl: { startsWith: "/images/" } } });
  for (const t of team) await prisma.teamMember.update({ where: { id: t.id }, data: { imageUrl: await toMedia(t.imageUrl) } });

  const config = await prisma.storefrontConfig.findUnique({ where: { organizationId } });
  if (config?.heroImageUrl?.startsWith("/images/")) {
    await prisma.storefrontConfig.update({ where: { organizationId }, data: { heroImageUrl: await toMedia(config.heroImageUrl) } });
  }

  for (const page of await prisma.pageContent.findMany({ where: { organizationId } })) {
    if (!JSON.stringify(page.content).includes('"/images/')) continue;
    await prisma.pageContent.update({ where: { id: page.id }, data: { content: (await rewriteJson(page.content)) as Prisma.InputJsonValue } });
  }

  if (mediaUrlByPath.size) created.push(`${mediaUrlByPath.size} images copied into the media library`);
  if (missing.size) console.warn(`Images not found in ${publicDir} (left unchanged): ${[...missing].join(", ")}`);
}

async function main() {
  const organization = await ensureOrganization();
  await ensureAdmin(organization.id);
  await ensureSettings(organization.id);
  await ensureNavigation(organization.id);
  await ensureAboutPage(organization.id);
  const categoryIds = await ensureCategories(organization.id);
  const productIds = await ensureProducts(organization.id, categoryIds);
  await ensureBlog(organization.id);
  await ensureOutfitFinder(organization.id, productIds);
  await migrateStorefrontImages(organization.id);

  console.log(`Organization: ${organization.name} (/${organization.slug})`);
  console.log(`Created (${created.length}): ${created.join(", ") || "nothing — already imported"}`);
  if (skipped.length) console.log(`Already present: ${skipped.join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
