import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { blogCategorySchema } from "@/lib/api/schemas/blog";
import { deleteBlogCategoryForOrg, updateBlogCategoryForOrg } from "@/lib/server/blog";

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/blog-categories/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = blogCategorySchema.partial().parse(await request.json());
  return NextResponse.json(await updateBlogCategoryForOrg(organizationId, id, input));
});

export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/blog-categories/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await deleteBlogCategoryForOrg(organizationId, id);
  return new NextResponse(null, { status: 204 });
});
