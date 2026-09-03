import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getOrganizationDetail, updateOrganization } from "@/lib/server/organizations";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
});

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/organizations/[id]">) => {
  await requireSuperAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await getOrganizationDetail(id));
});

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/organizations/[id]">) => {
  await requireSuperAdmin();
  const { id } = await ctx.params;
  const input = updateSchema.parse(await request.json());
  return NextResponse.json(await updateOrganization(id, input));
});
