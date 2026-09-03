import { NextResponse, type NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { getStorefrontHome } from "@/lib/server/storefront";

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]">) => {
  const { orgSlug } = await ctx.params;
  return NextResponse.json(await getStorefrontHome(orgSlug));
});
