import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getCustomerDetailForOrg } from "@/lib/server/customers";

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/customers/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await getCustomerDetailForOrg(organizationId, id));
});
