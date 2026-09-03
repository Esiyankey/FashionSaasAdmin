import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getSettingsForOrg, updateSettingsForOrg } from "@/lib/server/settings";

const updateSchema = z.object({
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  shippingFlatRate: z.number().min(0).optional(),
  freeShippingThreshold: z.number().min(0).nullable().optional(),
  orderNumberPrefix: z.string().min(1).max(10).optional(),
  lowStockThresholdDefault: z.number().int().min(0).optional(),
});

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await getSettingsForOrg(organizationId));
});

export const PATCH = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = updateSchema.parse(await request.json());
  return NextResponse.json(await updateSettingsForOrg(organizationId, input));
});
