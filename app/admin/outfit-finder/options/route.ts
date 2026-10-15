import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { outfitOptionSchema } from "@/lib/api/schemas/outfit-finder";
import { createOutfitOptionForOrg, listOutfitOptionsForOrg } from "@/lib/server/outfit-finder";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await listOutfitOptionsForOrg(organizationId));
});

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = outfitOptionSchema.parse(await request.json());
  return NextResponse.json(await createOutfitOptionForOrg(organizationId, input), { status: 201 });
});
