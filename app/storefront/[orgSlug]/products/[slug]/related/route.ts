import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { getRelatedStorefrontProducts } from "@/lib/server/storefront";

export const GET = handleRoute(
  async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/products/[slug]/related">) => {
    const { orgSlug, slug } = await ctx.params;
    const limit = Math.min(12, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 4));
    return publicJson(await getRelatedStorefrontProducts(orgSlug, slug, limit, assetBaseFrom(request)));
  }
);
