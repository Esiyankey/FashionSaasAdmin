import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { setOrganizationStatus } from "@/lib/server/organizations";

const bodySchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/organizations/[id]/status">) => {
  await requireSuperAdmin();
  const { id } = await ctx.params;
  const { status } = bodySchema.parse(await request.json());
  return NextResponse.json(await setOrganizationStatus(id, status));
});
