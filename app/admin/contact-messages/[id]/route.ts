import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import {
  deleteContactMessageForOrg,
  getContactMessageForOrg,
  updateContactMessageForOrg,
} from "@/lib/server/inbox";

const updateSchema = z
  .object({
    status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]).optional(),
    internalNote: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

/** Opening a message marks it read unless `?markRead=false`. */
export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/contact-messages/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const markRead = request.nextUrl.searchParams.get("markRead") !== "false";
  return NextResponse.json(await getContactMessageForOrg(organizationId, id, markRead));
});

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/contact-messages/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = updateSchema.parse(await request.json());
  return NextResponse.json(await updateContactMessageForOrg(organizationId, id, input));
});

export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/contact-messages/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await deleteContactMessageForOrg(organizationId, id);
  return new NextResponse(null, { status: 204 });
});
