import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { archiveCategoryForOrg, updateCategoryForOrg } from "@/lib/server/categories";

const updateSchema = z.object({ name: z.string().min(1), parentId: z.string().nullable().optional() });

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/categories/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = updateSchema.parse(await request.json());
  const category = await updateCategoryForOrg(organizationId, id, input);
  return NextResponse.json(category);
});

export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/categories/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await archiveCategoryForOrg(organizationId, id);
  return new NextResponse(null, { status: 204 });
});
