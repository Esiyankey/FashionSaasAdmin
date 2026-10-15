import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { styleLookSchema } from "@/lib/api/schemas/outfit-finder";
import { deleteStyleLookForOrg, getStyleLookForOrg, updateStyleLookForOrg } from "@/lib/server/outfit-finder";

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/outfit-finder/looks/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await getStyleLookForOrg(organizationId, id));
});

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/outfit-finder/looks/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = styleLookSchema.partial().parse(await request.json());
  return NextResponse.json(await updateStyleLookForOrg(organizationId, id, input));
});

export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/outfit-finder/looks/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await deleteStyleLookForOrg(organizationId, id);
  return new NextResponse(null, { status: 204 });
});
