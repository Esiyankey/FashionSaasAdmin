import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute, parsePagination } from "@/lib/api/handler";
import { blogPostSchema } from "@/lib/api/schemas/blog";
import { createBlogPostForOrg, listBlogPostsForOrg } from "@/lib/server/blog";

const statusSchema = z.enum(["all", "DRAFT", "PUBLISHED", "ARCHIVED"]).default("all");

export const GET = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const params = request.nextUrl.searchParams;
  return NextResponse.json(
    await listBlogPostsForOrg(organizationId, {
      search: params.get("search")?.trim() || undefined,
      status: statusSchema.parse(params.get("status") || undefined),
      categoryId: params.get("categoryId") || undefined,
      ...parsePagination(params),
    })
  );
});

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = blogPostSchema.parse(await request.json());
  return NextResponse.json(await createBlogPostForOrg(organizationId, input), { status: 201 });
});
