import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { listCustomersForOrg } from "@/lib/server/customers";

export const GET = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const params = request.nextUrl.searchParams;
  const search = params.get("search")?.trim() ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize")) || 20));
  return NextResponse.json(await listCustomersForOrg(organizationId, { search, page, pageSize }));
});
