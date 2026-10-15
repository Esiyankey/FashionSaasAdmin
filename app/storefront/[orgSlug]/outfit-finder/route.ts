import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { getPublicOutfitFinderOptions } from "@/lib/server/outfit-finder";

/** Active quiz options: body types, skin tones and occasions, in display order. */
export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/outfit-finder">) => {
  const { orgSlug } = await ctx.params;
  return publicJson(await getPublicOutfitFinderOptions(orgSlug, assetBaseFrom(request)));
});
