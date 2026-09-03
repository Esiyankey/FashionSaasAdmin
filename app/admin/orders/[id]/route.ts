import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getOrderForOrg, updateOrderStatusForOrg } from "@/lib/server/orders";

const updateSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "FULFILLED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED", "FAILED"]).optional(),
});

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/orders/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await getOrderForOrg(organizationId, id));
});

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/orders/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = updateSchema.parse(await request.json());
  return NextResponse.json(await updateOrderStatusForOrg(organizationId, id, input));
});
