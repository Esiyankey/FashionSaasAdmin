import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { archiveCategoryForOrg, updateCategoryForOrg } from "@/lib/server/categories";
import { categoryFieldsSchema } from "@/lib/api/schemas/category";

const updateSchema = categoryFieldsSchema.partial();

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
