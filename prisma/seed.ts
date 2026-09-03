import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

interface CategorySeed {
  name: string;
  children?: string[];
}

interface ProductSeed {
  title: string;
  productType: string;
  categoryNames: string[];
  price: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  quantity: number;
  lowStockThreshold: number;
  withVariants: boolean;
  isFeatured?: boolean;
}

const CATEGORY_SEEDS: CategorySeed[] = [
  { name: "Women", children: ["Dresses", "Tops"] },
  { name: "Men", children: ["Shirts", "Outerwear"] },
  { name: "Accessories" },
  { name: "Footwear" },
];

const PRODUCT_SEEDS: ProductSeed[] = [
  { title: "Linen Wrap Dress", productType: "Dress", categoryNames: ["Women", "Dresses"], price: 86, status: "PUBLISHED", quantity: 42, lowStockThreshold: 10, withVariants: true, isFeatured: true },
  { title: "Silk Slip Dress", productType: "Dress", categoryNames: ["Women", "Dresses"], price: 120, status: "PUBLISHED", quantity: 8, lowStockThreshold: 10, withVariants: true },
  { title: "Cotton Poplin Blouse", productType: "Top", categoryNames: ["Women", "Tops"], price: 54, status: "PUBLISHED", quantity: 36, lowStockThreshold: 8, withVariants: true },
  { title: "Ribbed Knit Tank", productType: "Top", categoryNames: ["Women", "Tops"], price: 32, status: "PUBLISHED", quantity: 5, lowStockThreshold: 10, withVariants: false },
  { title: "Oversized Denim Jacket", productType: "Outerwear", categoryNames: ["Women"], price: 138, status: "DRAFT", quantity: 18, lowStockThreshold: 5, withVariants: true },
  { title: "Tailored Wool Trousers", productType: "Trousers", categoryNames: ["Men"], price: 96, status: "PUBLISHED", quantity: 30, lowStockThreshold: 8, withVariants: true },
  { title: "Oxford Cotton Shirt", productType: "Shirt", categoryNames: ["Men", "Shirts"], price: 64, status: "PUBLISHED", quantity: 4, lowStockThreshold: 10, withVariants: true, isFeatured: true },
  { title: "Quilted Bomber Jacket", productType: "Outerwear", categoryNames: ["Men", "Outerwear"], price: 152, status: "DRAFT", quantity: 12, lowStockThreshold: 5, withVariants: false },
  { title: "Leather Crossbody Bag", productType: "Bag", categoryNames: ["Accessories"], price: 145, status: "PUBLISHED", quantity: 16, lowStockThreshold: 5, withVariants: false },
  { title: "Woven Straw Hat", productType: "Hat", categoryNames: ["Accessories"], price: 38, status: "PUBLISHED", quantity: 0, lowStockThreshold: 5, withVariants: false },
  { title: "Suede Chelsea Boots", productType: "Footwear", categoryNames: ["Footwear"], price: 168, status: "PUBLISHED", quantity: 9, lowStockThreshold: 10, withVariants: true },
  { title: "Canvas Low-Top Sneakers", productType: "Footwear", categoryNames: ["Footwear"], price: 78, status: "PUBLISHED", quantity: 33, lowStockThreshold: 8, withVariants: true, isFeatured: true },
];

const CUSTOMER_NAMES = [
  "Ama Boateng", "Kwame Asante", "Efua Mensah", "Kofi Owusu", "Adjoa Darko", "Yaw Appiah",
];

function buildVariants(basePrice: number) {
  const colors = ["Black", "Sand", "Navy"];
  const sizes = ["S", "M", "L"];
  const variants: { title: string; options: { name: string; value: string }[]; sku: string; inventoryQuantity: number }[] = [];
  for (const color of colors) {
    for (const size of sizes) {
      variants.push({
        title: `${color} / ${size}`,
        options: [{ name: "Color", value: color }, { name: "Size", value: size }],
        sku: `${slugify(color)}-${size}-${Math.round(basePrice)}`.toUpperCase(),
        inventoryQuantity: Math.max(0, Math.round((basePrice % 7) + Math.random() * 12)),
      });
    }
  }
  return variants;
}

async function seedOrganization(params: {
  name: string;
  slug: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  const passwordHash = await hash(params.adminPassword);

  const organization = await prisma.organization.create({
    data: {
      name: params.name,
      slug: params.slug,
      description: `${params.name} is a fashion brand managed on the Fashion SaaS platform.`,
      contactEmail: params.adminEmail,
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: params.adminName,
      email: params.adminEmail,
      passwordHash,
      role: "ORGANIZATION_ADMIN",
    },
  });

  await prisma.organizationSettings.create({
    data: { organizationId: organization.id, taxRatePercent: 7.5, shippingFlatRate: 6, freeShippingThreshold: 120 },
  });

  await prisma.storefrontConfig.create({
    data: {
      organizationId: organization.id,
      storeName: params.name,
      primaryColor: params.primaryColor,
      secondaryColor: params.secondaryColor,
      heroHeadline: `${params.name} — new season, now live`,
      heroSubheadline: "Shop the latest arrivals, made to last.",
      footerText: `© ${new Date().getFullYear()} ${params.name}. All rights reserved.`,
      contactEmail: params.adminEmail,
    },
  });

  const categoryIdByName = new Map<string, string>();
  for (const cat of CATEGORY_SEEDS) {
    const parent = await prisma.category.create({
      data: { organizationId: organization.id, name: cat.name, slug: slugify(cat.name) },
    });
    categoryIdByName.set(cat.name, parent.id);
    for (const childName of cat.children ?? []) {
      const child = await prisma.category.create({
        data: {
          organizationId: organization.id,
          name: childName,
          slug: slugify(`${cat.name}-${childName}`),
          parentId: parent.id,
        },
      });
      categoryIdByName.set(childName, child.id);
    }
  }

  const createdProducts: { id: string; price: number; status: string }[] = [];
  for (const seed of PRODUCT_SEEDS) {
    const categoryIds = seed.categoryNames.map((name) => categoryIdByName.get(name)).filter((id): id is string => Boolean(id));
    const product = await prisma.product.create({
      data: {
        organizationId: organization.id,
        title: seed.title,
        slug: slugify(seed.title),
        description: `${seed.title} crafted from premium materials, designed for everyday wear and built to last season after season.`,
        vendor: params.name,
        productType: seed.productType,
        status: seed.status,
        price: seed.price,
        compareAtPrice: seed.isFeatured ? Math.round(seed.price * 1.2) : null,
        costPerItem: Math.round(seed.price * 0.45),
        sku: `SKU-${slugify(seed.title)}`.toUpperCase(),
        trackQuantity: true,
        quantity: seed.quantity,
        lowStockThreshold: seed.lowStockThreshold,
        variantOptionNames: seed.withVariants ? ["Color", "Size"] : [],
        isFeatured: Boolean(seed.isFeatured),
        seoTitle: seed.title,
        seoDescription: `Shop the ${seed.title} at ${params.name}.`,
        weightKg: 0.5,
        requiresShipping: true,
        images: {
          create: [0, 1, 2].map((i) => ({
            url: `https://picsum.photos/seed/${organization.slug}-${slugify(seed.title)}-${i}/640/640`,
            alt: seed.title,
            position: i,
          })),
        },
        variants: seed.withVariants ? { create: buildVariants(seed.price) } : undefined,
        categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      },
    });
    createdProducts.push({ id: product.id, price: product.price, status: product.status });
  }

  const publishedProducts = createdProducts.filter((p) => p.status === "PUBLISHED");

  for (let i = 0; i < CUSTOMER_NAMES.length; i += 1) {
    const name = CUSTOMER_NAMES[i];
    const email = `${slugify(name)}@example.com`;
    const customer = await prisma.customer.create({
      data: {
        organizationId: organization.id,
        name,
        email,
        phone: `+233 24 ${100000 + i * 37}`,
        address: { line1: "12 High Street", city: "Accra", country: "Ghana" },
      },
    });

    const orderCount = i % 3 === 0 ? 2 : 1;
    for (let o = 0; o < orderCount; o += 1) {
      const item = publishedProducts[(i + o) % publishedProducts.length];
      if (!item) continue;
      const quantity = 1 + ((i + o) % 3);
      const unitPrice = item.price;
      const subtotal = unitPrice * quantity;
      const shipping = 6;
      const tax = Math.round(subtotal * 0.075 * 100) / 100;
      const total = subtotal + shipping + tax;
      const product = await prisma.product.findUnique({ where: { id: item.id }, select: { title: true, sku: true } });

      await prisma.order.create({
        data: {
          organizationId: organization.id,
          orderNumber: `ORD-${organization.slug.slice(0, 3).toUpperCase()}-${1000 + i * 10 + o}`,
          customerId: customer.id,
          status: o === 0 ? "FULFILLED" : "PENDING",
          paymentStatus: o === 0 ? "PAID" : "PENDING",
          shippingName: name,
          shippingEmail: email,
          shippingPhone: customer.phone,
          shippingAddress: { line1: "12 High Street", city: "Accra", country: "Ghana" },
          subtotal,
          discount: 0,
          shipping,
          tax,
          total,
          items: {
            create: [
              {
                productId: item.id,
                productName: product?.title ?? "Product",
                sku: product?.sku ?? undefined,
                quantity,
                unitPrice,
                total: subtotal,
              },
            ],
          },
        },
      });
    }
  }

  return organization;
}

async function main() {
  console.log("Seeding database...");

  await prisma.user.create({
    data: {
      name: "Platform Owner",
      email: "super@fashionsaas.com",
      passwordHash: await hash("SuperAdmin123!"),
      role: "SUPER_ADMIN",
    },
  });

  await seedOrganization({
    name: "Aurora Atelier",
    slug: "aurora-atelier",
    adminEmail: "admin@aurora-atelier.com",
    adminName: "Ama Owusu",
    adminPassword: "OrgAdmin123!",
    primaryColor: "#111111",
    secondaryColor: "#f5f0eb",
  });

  await seedOrganization({
    name: "Nova Denim Co.",
    slug: "nova-denim",
    adminEmail: "admin@nova-denim.com",
    adminName: "Kwesi Mensah",
    adminPassword: "OrgAdmin123!",
    primaryColor: "#1d2b53",
    secondaryColor: "#f1f3f8",
  });

  console.log("Seed complete.");
  console.log("");
  console.log("Login credentials:");
  console.log("  Super admin:  super@fashionsaas.com / SuperAdmin123!");
  console.log("  Org admin A:  admin@aurora-atelier.com / OrgAdmin123!");
  console.log("  Org admin B:  admin@nova-denim.com / OrgAdmin123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
