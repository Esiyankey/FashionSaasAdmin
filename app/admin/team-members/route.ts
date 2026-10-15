import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { teamMemberSchema } from "@/lib/api/schemas/content";
import { createTeamMemberForOrg, listTeamMembersForOrg } from "@/lib/server/content";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await listTeamMembersForOrg(organizationId));
});

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = teamMemberSchema.parse(await request.json());
  return NextResponse.json(await createTeamMemberForOrg(organizationId, input), { status: 201 });
});
