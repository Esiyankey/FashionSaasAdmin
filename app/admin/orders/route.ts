import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute, parsePagination } from "@/lib/api/handler";
import { listOrdersForOrg } from "@/lib/server/orders";

const querySchema = z.object({
  status: z.enum(["all", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).default("all"),
  paymentStatus: z.enum(["all", "PENDING", "PAID", "REFUNDED", "FAILED"]).default("all"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const GET = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const params = request.nextUrl.searchParams;
  const query = querySchema.parse({
    status: params.get("status") || undefined,
    paymentStatus: params.get("paymentStatus") || undefined,
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
  });
  return NextResponse.json(
    await listOrdersForOrg(organizationId, {
      search: params.get("search")?.trim() ?? "",
      ...query,
      ...parsePagination(params),
    })
  );
});
