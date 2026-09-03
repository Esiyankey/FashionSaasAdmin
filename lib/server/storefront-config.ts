import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import { Prisma } from "@/lib/generated/prisma/client";

function serialize(config: {
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  heroImageUrl: string | null;
  featuredProductIds: string[];
  featuredCategoryIds: string[];
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: Prisma.JsonValue;
  updatedAt: Date;
}) {
  return { ...config, updatedAt: config.updatedAt.toISOString() };
}

export async function getStorefrontConfigForOrg(organizationId: string) {
  const config = await prisma.storefrontConfig.findUnique({ where: { organizationId } });
  if (!config) throw notFound("Storefront configuration not found");
  return serialize(config);
}

export interface UpdateStorefrontConfigInput {
  storeName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  heroImageUrl?: string | null;
  featuredProductIds?: string[];
  featuredCategoryIds?: string[];
  footerText?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialLinks?: Prisma.InputJsonValue | null;
}

export async function updateStorefrontConfigForOrg(organizationId: string, input: UpdateStorefrontConfigInput) {
  const { socialLinks, ...rest } = input;
  const config = await prisma.storefrontConfig.update({
    where: { organizationId },
    data: {
      ...rest,
      ...(socialLinks !== undefined ? { socialLinks: socialLinks === null ? Prisma.JsonNull : socialLinks } : {}),
    },
  });
  return serialize(config);
}
