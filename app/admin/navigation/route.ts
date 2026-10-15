import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { navigationUpdateSchema } from "@/lib/api/schemas/content";
import { getNavigationForOrg, replaceNavigationForOrg } from "@/lib/server/content";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await getNavigationForOrg(organizationId));
});

/** Replaces the header and footer menus; array order is display order. */
export const PUT = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = navigationUpdateSchema.parse(await request.json());
  return NextResponse.json(await replaceNavigationForOrg(organizationId, input));
});
