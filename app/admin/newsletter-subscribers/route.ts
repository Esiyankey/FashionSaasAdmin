import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute, parsePagination } from "@/lib/api/handler";
import { listSubscribersForOrg } from "@/lib/server/inbox";

const statusSchema = z.enum(["all", "SUBSCRIBED", "UNSUBSCRIBED"]).default("all");

export const GET = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const params = request.nextUrl.searchParams;
  return NextResponse.json(
    await listSubscribersForOrg(organizationId, {
      search: params.get("search")?.trim() || undefined,
      status: statusSchema.parse(params.get("status") || undefined),
      ...parsePagination(params),
    })
  );
});
