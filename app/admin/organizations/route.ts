import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { createOrganizationWithAdmin, listOrganizations } from "@/lib/server/organizations";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

export const GET = handleRoute(async () => {
  await requireSuperAdmin();
  return NextResponse.json(await listOrganizations());
});

export const POST = handleRoute(async (request: NextRequest) => {
  await requireSuperAdmin();
  const input = createSchema.parse(await request.json());
  const organization = await createOrganizationWithAdmin(input);
  return NextResponse.json(organization, { status: 201 });
});
