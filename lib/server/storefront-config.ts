import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import { Prisma } from "@/lib/generated/prisma/client";
import type { StorefrontConfigUpdate } from "@/lib/api/schemas/content";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";

function serialize(config: Prisma.StorefrontConfigGetPayload<object>) {
  // featuredProductIds is deprecated (Product.isFeatured is the source of truth) and not exposed.
  const rest: Partial<typeof config> = { ...config };
  delete rest.id;
  delete rest.organizationId;
  delete rest.featuredProductIds;
  return { ...(rest as Omit<typeof config, "id" | "organizationId" | "featuredProductIds">), updatedAt: config.updatedAt.toISOString() };
}

export async function getStorefrontConfigForOrg(organizationId: string) {
  const config = await prisma.storefrontConfig.findUnique({ where: { organizationId } });
  if (!config) throw notFound("Storefront configuration not found");
  return serialize(config);
}

export async function updateStorefrontConfigForOrg(organizationId: string, input: StorefrontConfigUpdate) {
  const { socialLinks, ...rest } = input;
  const data = {
    ...rest,
    ...(socialLinks !== undefined ? { socialLinks: socialLinks === null ? Prisma.JsonNull : socialLinks } : {}),
  };
  const config = await prisma.storefrontConfig.upsert({
    where: { organizationId },
    update: data,
    create: { organizationId, ...data },
  });
  notifyStorefront(organizationId, [StorefrontTag.content, StorefrontTag.settings]);
  return serialize(config);
}
