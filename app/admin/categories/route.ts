import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { createCategoryForOrg, listCategoriesForOrg } from "@/lib/server/categories";

const createSchema = z.object({ name: z.string().min(1), parentId: z.string().nullable().optional() });

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await listCategoriesForOrg(organizationId));
});

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = createSchema.parse(await request.json());
  const category = await createCategoryForOrg(organizationId, input);
  return NextResponse.json(category, { status: 201 });
});
