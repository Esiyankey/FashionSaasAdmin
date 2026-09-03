import { NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getProductStatsForOrg } from "@/lib/server/products";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  const stats = await getProductStatsForOrg(organizationId);
  return NextResponse.json(stats);
});
