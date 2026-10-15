import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { styleLookSchema } from "@/lib/api/schemas/outfit-finder";
import { createStyleLookForOrg, listStyleLooksForOrg } from "@/lib/server/outfit-finder";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await listStyleLooksForOrg(organizationId));
});

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = styleLookSchema.parse(await request.json());
  return NextResponse.json(await createStyleLookForOrg(organizationId, input), { status: 201 });
});
