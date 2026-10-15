import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { teamMemberSchema } from "@/lib/api/schemas/content";
import { deleteTeamMemberForOrg, updateTeamMemberForOrg } from "@/lib/server/content";

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/team-members/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = teamMemberSchema.partial().parse(await request.json());
  return NextResponse.json(await updateTeamMemberForOrg(organizationId, id, input));
});

export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/team-members/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await deleteTeamMemberForOrg(organizationId, id);
  return new NextResponse(null, { status: 204 });
});
