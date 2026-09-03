import { NextResponse, type NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { listStorefrontCategories } from "@/lib/server/storefront";

export const GET = handleRoute(
  async (_request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/categories">) => {
    const { orgSlug } = await ctx.params;
    return NextResponse.json(await listStorefrontCategories(orgSlug));
  }
);
