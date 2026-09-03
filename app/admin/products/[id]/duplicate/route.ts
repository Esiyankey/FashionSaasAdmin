import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { duplicateProductForOrg } from "@/lib/server/products";

export const POST = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/products/[id]/duplicate">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const product = await duplicateProductForOrg(organizationId, id);
  return NextResponse.json(product, { status: 201 });
});
