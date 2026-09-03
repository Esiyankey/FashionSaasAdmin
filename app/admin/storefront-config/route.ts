import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getStorefrontConfigForOrg, updateStorefrontConfigForOrg } from "@/lib/server/storefront-config";

const updateSchema = z.object({
  storeName: z.string().min(1).optional(),
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  heroHeadline: z.string().nullable().optional(),
  heroSubheadline: z.string().nullable().optional(),
  heroImageUrl: z.string().nullable().optional(),
  featuredProductIds: z.array(z.string()).optional(),
  featuredCategoryIds: z.array(z.string()).optional(),
  footerText: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  socialLinks: z.record(z.string(), z.string()).nullable().optional(),
});

export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  return NextResponse.json(await getStorefrontConfigForOrg(organizationId));
});

export const PATCH = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = updateSchema.parse(await request.json());
  return NextResponse.json(await updateStorefrontConfigForOrg(organizationId, input));
});
