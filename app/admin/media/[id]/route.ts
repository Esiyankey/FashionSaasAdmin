import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { deleteMediaForOrg } from "@/lib/server/media";

/** Refused with 409 MEDIA_IN_USE while any product, category, post, etc. still uses the image. */
export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/media/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await deleteMediaForOrg(organizationId, id);
  return new NextResponse(null, { status: 204 });
});
