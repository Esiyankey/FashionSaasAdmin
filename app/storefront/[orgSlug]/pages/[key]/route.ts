import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { getStorefrontPage } from "@/lib/server/storefront";

/** Structured page content (currently `about`, which also returns visible team members). */
export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/pages/[key]">) => {
  const { orgSlug, key } = await ctx.params;
  return publicJson(await getStorefrontPage(orgSlug, key, assetBaseFrom(request)));
});
