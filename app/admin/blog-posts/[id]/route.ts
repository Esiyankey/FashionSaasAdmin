import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { blogPostSchema } from "@/lib/api/schemas/blog";
import { deleteBlogPostForOrg, getBlogPostForOrg, updateBlogPostForOrg } from "@/lib/server/blog";

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/blog-posts/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await getBlogPostForOrg(organizationId, id));
});

/** Also used to publish / unpublish (status DRAFT) / archive. */
export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/blog-posts/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = blogPostSchema.partial().parse(await request.json());
  return NextResponse.json(await updateBlogPostForOrg(organizationId, id, input));
});

export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/blog-posts/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await deleteBlogPostForOrg(organizationId, id);
  return new NextResponse(null, { status: 204 });
});
