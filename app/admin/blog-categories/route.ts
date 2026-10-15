import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { blogCategorySchema } from "@/lib/api/schemas/blog";
import { createBlogCategoryForOrg, listBlogCategoriesForOrg } from "@/lib/server/blog";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await listBlogCategoriesForOrg(organizationId));
});

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = blogCategorySchema.parse(await request.json());
  return NextResponse.json(await createBlogCategoryForOrg(organizationId, input), { status: 201 });
});
