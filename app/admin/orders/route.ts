import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { listOrdersForOrg } from "@/lib/server/orders";
import type { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";

export const GET = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const params = request.nextUrl.searchParams;
  const search = params.get("search")?.trim() ?? "";
  const status = (params.get("status") ?? "all") as OrderStatus | "all";
  const paymentStatus = (params.get("paymentStatus") ?? "all") as PaymentStatus | "all";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize")) || 20));
  return NextResponse.json(await listOrdersForOrg(organizationId, { search, status, paymentStatus, page, pageSize }));
});
