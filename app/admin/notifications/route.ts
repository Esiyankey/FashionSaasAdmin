import { NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getNotificationsForOrg } from "@/lib/server/notifications";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await getNotificationsForOrg(organizationId));
});
