import { NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getDashboardSummaryForOrg } from "@/lib/server/dashboard";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await getDashboardSummaryForOrg(organizationId));
});
