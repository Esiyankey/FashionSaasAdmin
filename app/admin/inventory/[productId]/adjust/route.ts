import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { adjustInventoryForOrg } from "@/lib/server/inventory";

const bodySchema = z.object({ variantId: z.string().optional(), delta: z.number().int().refine((n) => n !== 0) });

export const POST = handleRoute(
  async (request: NextRequest, ctx: RouteContext<"/admin/inventory/[productId]/adjust">) => {
    const { organizationId } = await requireOrgAdmin();
    const { productId } = await ctx.params;
    const input = bodySchema.parse(await request.json());
    await adjustInventoryForOrg(organizationId, productId, input);
    return new NextResponse(null, { status: 204 });
  }
);
