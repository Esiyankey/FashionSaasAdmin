import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { getStorefrontCategory } from "@/lib/server/storefront";

export const GET = handleRoute(
  async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/categories/[slug]">) => {
    const { orgSlug, slug } = await ctx.params;
    return publicJson(await getStorefrontCategory(orgSlug, slug, assetBaseFrom(request)));
  }
);
