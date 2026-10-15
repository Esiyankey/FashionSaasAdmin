import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { listStorefrontCategories } from "@/lib/server/storefront";

/** Active categories in display order; `productCount` counts published products incl. subcategories. */
export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/categories">) => {
  const { orgSlug } = await ctx.params;
  return publicJson({ items: await listStorefrontCategories(orgSlug, assetBaseFrom(request)) });
});
