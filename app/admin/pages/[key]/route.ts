import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { notFound } from "@/lib/api/errors";
import { getPageForOrg, isPageKey, savePageForOrg } from "@/lib/server/content";

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/pages/[key]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { key } = await ctx.params;
  if (!isPageKey(key)) throw notFound("Unknown page");
  return NextResponse.json(await getPageForOrg(organizationId, key));
});

export const PUT = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/pages/[key]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { key } = await ctx.params;
  if (!isPageKey(key)) throw notFound("Unknown page");
  return NextResponse.json(await savePageForOrg(organizationId, key, await request.json()));
});
