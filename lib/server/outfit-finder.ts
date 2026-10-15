import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { notFound, validationError } from "@/lib/api/errors";
import { PUBLIC_PRODUCT_INCLUDE, resolveAssetUrl, serializePublicProduct } from "@/lib/api/serializers/public";
import type { outfitOptionSchema, outfitOptionUpdateSchema, StyleLookInput } from "@/lib/api/schemas/outfit-finder";
import { resolveActiveOrg } from "@/lib/server/storefront";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";
import type { OutfitOptionType, Prisma } from "@/lib/generated/prisma/client";

// ---------------------------------------------------------------------------
// Admin: options (body types, skin tones, occasions)
// ---------------------------------------------------------------------------

function serializeOption(option: Prisma.OutfitOptionGetPayload<object>) {
  return {
    id: option.id,
    type: option.type,
    key: option.key,
    label: option.label,
    hex: option.hex,
    imageUrl: option.imageUrl,
    position: option.position,
    isActive: option.isActive,
  };
}

export async function listOutfitOptionsForOrg(organizationId: string) {
  const options = await prisma.outfitOption.findMany({
    where: { organizationId },
    orderBy: [{ type: "asc" }, { position: "asc" }, { label: "asc" }],
  });
  return options.map(serializeOption);
}

export async function createOutfitOptionForOrg(organizationId: string, input: z.infer<typeof outfitOptionSchema>) {
  if (input.type === "SKIN_TONE" && !input.hex) throw validationError({ hex: ["Skin tones need a colour"] });
  const position =
    input.position ?? (await prisma.outfitOption.count({ where: { organizationId, type: input.type } }));
  const option = await prisma.outfitOption.create({
    data: {
      organizationId,
      type: input.type,
      key: input.key,
      label: input.label,
      hex: input.hex ?? null,
      imageUrl: input.imageUrl ?? null,
      position,
      isActive: input.isActive ?? true,
    },
  });
  notifyStorefront(organizationId, [StorefrontTag.outfitFinder]);
  return serializeOption(option);
}

export async function updateOutfitOptionForOrg(
  organizationId: string,
  id: string,
  input: z.infer<typeof outfitOptionUpdateSchema>
) {
  const existing = await prisma.outfitOption.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!existing) throw notFound("Option not found");
  const option = await prisma.outfitOption.update({
    where: { id },
    data: {
      ...(input.key !== undefined ? { key: input.key } : {}),
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.hex !== undefined ? { hex: input.hex } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  notifyStorefront(organizationId, [StorefrontTag.outfitFinder]);
  return serializeOption(option);
}

/** Deleting an occasion also deletes its looks (FK cascade); deactivate to keep them. */
export async function deleteOutfitOptionForOrg(organizationId: string, id: string) {
  const result = await prisma.outfitOption.deleteMany({ where: { id, organizationId } });
  if (result.count === 0) throw notFound("Option not found");
  notifyStorefront(organizationId, [StorefrontTag.outfitFinder]);
}

// ---------------------------------------------------------------------------
// Admin: style looks
// ---------------------------------------------------------------------------

const LOOK_INCLUDE = {
  occasion: { select: { id: true, key: true, label: true } },
  heroProduct: { select: { id: true, title: true, slug: true, status: true } },
  conditions: { include: { option: { select: { id: true, type: true, key: true, label: true } } } },
  products: {
    orderBy: { position: "asc" },
    include: { product: { select: { id: true, title: true, slug: true, status: true } } },
  },
} satisfies Prisma.StyleLookInclude;

type DbLook = Prisma.StyleLookGetPayload<{ include: typeof LOOK_INCLUDE }>;

function serializeLook(look: DbLook) {
  return {
    id: look.id,
    occasionId: look.occasionId,
    occasion: look.occasion,
    styleName: look.styleName,
    description: look.description,
    tags: look.tags,
    heroProductId: look.heroProductId,
    heroProduct: look.heroProduct,
    productIds: look.products.map((entry) => entry.productId),
    products: look.products.map((entry) => entry.product),
    bodyTypeIds: look.conditions.filter((entry) => entry.option.type === "BODY_TYPE").map((entry) => entry.optionId),
    skinToneIds: look.conditions.filter((entry) => entry.option.type === "SKIN_TONE").map((entry) => entry.optionId),
    position: look.position,
    isActive: look.isActive,
    updatedAt: look.updatedAt.toISOString(),
  };
}

async function assertLookReferences(organizationId: string, input: Partial<StyleLookInput>) {
  const errors: Record<string, string[]> = {};
  if (input.occasionId) {
    const occasion = await prisma.outfitOption.count({ where: { id: input.occasionId, organizationId, type: "OCCASION" } });
    if (!occasion) errors.occasionId = ["Occasion does not exist"];
  }
  const checkOptions = async (ids: string[] | undefined, type: OutfitOptionType, field: string) => {
    if (!ids?.length) return;
    const count = await prisma.outfitOption.count({ where: { id: { in: ids }, organizationId, type } });
    if (count !== new Set(ids).size) errors[field] = ["One or more options do not exist"];
  };
  await checkOptions(input.bodyTypeIds, "BODY_TYPE", "bodyTypeIds");
  await checkOptions(input.skinToneIds, "SKIN_TONE", "skinToneIds");
  const productIds = [...(input.productIds ?? []), ...(input.heroProductId ? [input.heroProductId] : [])];
  if (productIds.length) {
    const count = await prisma.product.count({ where: { id: { in: productIds }, organizationId } });
    if (count !== new Set(productIds).size) errors.productIds = ["One or more products do not exist"];
  }
  if (Object.keys(errors).length) throw validationError(errors);
}

export async function listStyleLooksForOrg(organizationId: string) {
  const looks = await prisma.styleLook.findMany({
    where: { organizationId },
    include: LOOK_INCLUDE,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return looks.map(serializeLook);
}

export async function getStyleLookForOrg(organizationId: string, id: string) {
  const look = await prisma.styleLook.findFirst({ where: { id, organizationId }, include: LOOK_INCLUDE });
  if (!look) throw notFound("Look not found");
  return serializeLook(look);
}

function relationsData(input: Partial<StyleLookInput>) {
  return {
    ...(input.bodyTypeIds !== undefined || input.skinToneIds !== undefined
      ? {
          conditions: {
            create: [...new Set([...(input.bodyTypeIds ?? []), ...(input.skinToneIds ?? [])])].map((optionId) => ({ optionId })),
          },
        }
      : {}),
    ...(input.productIds !== undefined
      ? { products: { create: [...new Set(input.productIds)].map((productId, position) => ({ productId, position })) } }
      : {}),
  };
}

export async function createStyleLookForOrg(organizationId: string, input: StyleLookInput) {
  await assertLookReferences(organizationId, input);
  const look = await prisma.styleLook.create({
    data: {
      organizationId,
      occasionId: input.occasionId,
      styleName: input.styleName,
      description: input.description ?? "",
      tags: input.tags ?? [],
      heroProductId: input.heroProductId ?? null,
      position: input.position ?? 0,
      isActive: input.isActive ?? true,
      ...relationsData(input),
    },
    include: LOOK_INCLUDE,
  });
  notifyStorefront(organizationId, [StorefrontTag.outfitFinder]);
  return serializeLook(look);
}

export async function updateStyleLookForOrg(organizationId: string, id: string, input: Partial<StyleLookInput>) {
  const existing = await getStyleLookForOrg(organizationId, id);
  await assertLookReferences(organizationId, input);
  // Restriction lists are replaced together so a partial update keeps the other dimension.
  const conditionsChanged = input.bodyTypeIds !== undefined || input.skinToneIds !== undefined;
  const look = await prisma.$transaction(async (tx) => {
    if (conditionsChanged) await tx.styleLookCondition.deleteMany({ where: { lookId: id } });
    if (input.productIds !== undefined) await tx.styleLookProduct.deleteMany({ where: { lookId: id } });
    return tx.styleLook.update({
      where: { id },
      data: {
        ...(input.occasionId !== undefined ? { occasionId: input.occasionId } : {}),
        ...(input.styleName !== undefined ? { styleName: input.styleName } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.heroProductId !== undefined ? { heroProductId: input.heroProductId } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...relationsData({
          ...input,
          ...(conditionsChanged
            ? {
                bodyTypeIds: input.bodyTypeIds ?? existing.bodyTypeIds,
                skinToneIds: input.skinToneIds ?? existing.skinToneIds,
              }
            : {}),
        }),
      },
      include: LOOK_INCLUDE,
    });
  });
  notifyStorefront(organizationId, [StorefrontTag.outfitFinder]);
  return serializeLook(look);
}

export async function deleteStyleLookForOrg(organizationId: string, id: string) {
  const result = await prisma.styleLook.deleteMany({ where: { id, organizationId } });
  if (result.count === 0) throw notFound("Look not found");
  notifyStorefront(organizationId, [StorefrontTag.outfitFinder]);
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export async function getPublicOutfitFinderOptions(orgSlug: string, assetBase: string) {
  const organization = await resolveActiveOrg(orgSlug);
  const options = await prisma.outfitOption.findMany({
    where: { organizationId: organization.id, isActive: true },
    orderBy: [{ position: "asc" }, { label: "asc" }],
  });
  const pick = (type: OutfitOptionType) =>
    options
      .filter((option) => option.type === type)
      .map((option) => ({
        key: option.key,
        label: option.label,
        ...(type === "SKIN_TONE" ? { hex: option.hex } : { imageUrl: resolveAssetUrl(option.imageUrl, assetBase) }),
      }));
  return { bodyTypes: pick("BODY_TYPE"), skinTones: pick("SKIN_TONE"), occasions: pick("OCCASION") };
}

/**
 * Database-backed recommendation (no AI). Rule:
 *  1. Consider active looks for the chosen occasion.
 *  2. A look qualifies when, for body type and for skin tone, it either has
 *     no restriction or its restriction list contains the shopper's choice.
 *  3. The most specific qualifying look wins (restricted on more dimensions),
 *     then the lowest position.
 * Only published products are returned. Step 3's tie-break is a proposed
 * rule pending business confirmation (see docs/INTEGRATION.md).
 */
export async function recommendOutfit(
  orgSlug: string,
  input: { bodyType: string; skinTone: string; occasion: string },
  assetBase: string
) {
  const organization = await resolveActiveOrg(orgSlug);
  const options = await prisma.outfitOption.findMany({
    where: { organizationId: organization.id, isActive: true, key: { in: [input.bodyType, input.skinTone, input.occasion] } },
  });
  const find = (type: OutfitOptionType, key: string) => options.find((option) => option.type === type && option.key === key);
  const bodyType = find("BODY_TYPE", input.bodyType);
  const skinTone = find("SKIN_TONE", input.skinTone);
  const occasion = find("OCCASION", input.occasion);
  const errors: Record<string, string[]> = {};
  if (!bodyType) errors.bodyType = ["Unknown body type"];
  if (!skinTone) errors.skinTone = ["Unknown skin tone"];
  if (!occasion) errors.occasion = ["Unknown occasion"];
  if (Object.keys(errors).length) throw validationError(errors);

  const looks = await prisma.styleLook.findMany({
    where: { organizationId: organization.id, occasionId: occasion!.id, isActive: true },
    include: {
      conditions: { include: { option: { select: { type: true } } } },
      heroProduct: { include: PUBLIC_PRODUCT_INCLUDE },
      products: { orderBy: { position: "asc" }, include: { product: { include: PUBLIC_PRODUCT_INCLUDE } } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const ranked = looks
    .map((look) => {
      const body = look.conditions.filter((entry) => entry.option.type === "BODY_TYPE").map((entry) => entry.optionId);
      const skin = look.conditions.filter((entry) => entry.option.type === "SKIN_TONE").map((entry) => entry.optionId);
      const qualifies = (body.length === 0 || body.includes(bodyType!.id)) && (skin.length === 0 || skin.includes(skinTone!.id));
      return { look, qualifies, specificity: (body.length ? 1 : 0) + (skin.length ? 1 : 0) };
    })
    .filter((entry) => entry.qualifies)
    .sort((a, b) => b.specificity - a.specificity || a.look.position - b.look.position);

  const match = ranked[0]?.look;
  if (!match) {
    throw notFound("No look is configured for this occasion yet");
  }

  const settings = await prisma.organizationSettings.findUnique({
    where: { organizationId: organization.id },
    select: { currency: true },
  });
  const ctx = { assetBase, currency: settings?.currency ?? "USD" };
  const isPublished = (product: { status: string } | null): product is NonNullable<typeof product> =>
    product?.status === "PUBLISHED";

  return {
    lookId: match.id,
    styleName: match.styleName,
    description: match.description,
    tags: match.tags,
    occasion: { key: occasion!.key, label: occasion!.label },
    recommendedProducts: isPublished(match.heroProduct) ? [serializePublicProduct(match.heroProduct, ctx)] : [],
    completeTheLook: match.products
      .map((entry) => entry.product)
      .filter(isPublished)
      .filter((product) => product.id !== match.heroProductId)
      .map((product) => serializePublicProduct(product, ctx)),
  };
}
