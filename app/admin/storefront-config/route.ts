import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { storefrontConfigUpdateSchema } from "@/lib/api/schemas/content";
import { getStorefrontConfigForOrg, updateStorefrontConfigForOrg } from "@/lib/server/storefront-config";

/** Store info, contact details, branding, social links, announcement bar and home hero. */
export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await getStorefrontConfigForOrg(organizationId));
});

export const PATCH = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = storefrontConfigUpdateSchema.parse(await request.json());
  return NextResponse.json(await updateStorefrontConfigForOrg(organizationId, input));
});
