import { NextResponse, type NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { getStorefrontProductBySlug } from "@/lib/server/storefront";

export const GET = handleRoute(
  async (_request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/products/[slug]">) => {
    const { orgSlug, slug } = await ctx.params;
    return NextResponse.json(await getStorefrontProductBySlug(orgSlug, slug));
  }
);
