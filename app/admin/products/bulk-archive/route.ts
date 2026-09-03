import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { bulkSetProductStatus } from "@/lib/server/products";

const bodySchema = z.object({ ids: z.array(z.string()).min(1) });

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const { ids } = bodySchema.parse(await request.json());
  await bulkSetProductStatus(organizationId, ids, "ARCHIVED");
  return new NextResponse(null, { status: 204 });
});
