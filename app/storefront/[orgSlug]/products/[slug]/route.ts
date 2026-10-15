import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { getStorefrontProduct } from "@/lib/server/storefront";

/** Accepts the product slug or its id. Draft/archived products return 404. */
export const GET = handleRoute(
  async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/products/[slug]">) => {
    const { orgSlug, slug } = await ctx.params;
    return publicJson(await getStorefrontProduct(orgSlug, slug, assetBaseFrom(request)));
  }
);
