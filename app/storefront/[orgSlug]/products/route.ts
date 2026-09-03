import { NextResponse, type NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { listStorefrontProducts } from "@/lib/server/storefront";

export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/products">) => {
  const { orgSlug } = await ctx.params;
  const params = request.nextUrl.searchParams;
  const search = params.get("search")?.trim() ?? "";
  const categoryId = params.get("categoryId") ?? undefined;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize")) || 20));
  return NextResponse.json(await listStorefrontProducts(orgSlug, { search, categoryId, page, pageSize }));
});
