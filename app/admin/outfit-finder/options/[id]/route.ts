import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { outfitOptionUpdateSchema } from "@/lib/api/schemas/outfit-finder";
import { deleteOutfitOptionForOrg, updateOutfitOptionForOrg } from "@/lib/server/outfit-finder";

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/outfit-finder/options/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = outfitOptionUpdateSchema.parse(await request.json());
  return NextResponse.json(await updateOutfitOptionForOrg(organizationId, id, input));
});

export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/outfit-finder/options/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await deleteOutfitOptionForOrg(organizationId, id);
  return new NextResponse(null, { status: 204 });
});
