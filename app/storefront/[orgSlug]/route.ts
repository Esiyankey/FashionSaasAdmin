import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { getStorefrontHome } from "@/lib/server/storefront";

/** Store info, contact, social links, announcement bar, hero, navigation and commerce settings. */
export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]">) => {
  const { orgSlug } = await ctx.params;
  return publicJson(await getStorefrontHome(orgSlug, assetBaseFrom(request)));
});
