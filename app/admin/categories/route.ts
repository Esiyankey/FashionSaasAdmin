import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { categoryFieldsSchema } from "@/lib/api/schemas/category";
import { createCategoryForOrg, listCategoriesForOrg } from "@/lib/server/categories";

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await listCategoriesForOrg(organizationId));
});

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = categoryFieldsSchema.parse(await request.json());
  const category = await createCategoryForOrg(organizationId, input);
  return NextResponse.json(category, { status: 201 });
});
