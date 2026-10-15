import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { recommendationRequestSchema } from "@/lib/api/schemas/outfit-finder";
import { recommendOutfit } from "@/lib/server/outfit-finder";

/** `{ bodyType, skinTone, occasion }` option keys → the curated look and its published products. */
export const POST = handleRoute(
  async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/outfit-finder/recommendations">) => {
    const { orgSlug } = await ctx.params;
    const input = recommendationRequestSchema.parse(await request.json());
    return publicJson(await recommendOutfit(orgSlug, input, assetBaseFrom(request)), { cache: false });
  }
);
