import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getOrderForOrg, updateOrderForOrg } from "@/lib/server/orders";

/**
 * Status changes are validated against ORDER_TRANSITIONS (409 otherwise) and
 * recorded in the order's status history. Totals and line items are immutable.
 */
const updateSchema = z
  .object({
    status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED", "FAILED"]).optional(),
    note: z.string().trim().max(500).optional(),
    trackingNumber: z.string().trim().max(100).nullable().optional(),
    carrier: z.string().trim().max(60).nullable().optional(),
    cancelReason: z.string().trim().max(500).optional(),
    internalNotes: z.string().trim().max(5000).nullable().optional(),
  })
  .strict();

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/orders/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await getOrderForOrg(organizationId, id));
});

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/orders/[id]">) => {
  const { organizationId, userId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = updateSchema.parse(await request.json());
  return NextResponse.json(await updateOrderForOrg(organizationId, id, userId, input));
});
