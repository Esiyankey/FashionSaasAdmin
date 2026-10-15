import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { publicJson } from "@/lib/api/public";
import { getStorefrontProductFilters } from "@/lib/server/storefront";

/** Price bounds and available sizes/colours/types across published products, for building filter UI. */
export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/product-filters">) => {
  const { orgSlug } = await ctx.params;
  return publicJson(await getStorefrontProductFilters(orgSlug));
});
