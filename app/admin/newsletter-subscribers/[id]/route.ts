import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { deleteSubscriberForOrg, setSubscriberStatusForOrg } from "@/lib/server/inbox";

const updateSchema = z.object({ status: z.enum(["SUBSCRIBED", "UNSUBSCRIBED"]) }).strict();

export const PATCH = handleRoute(
  async (request: NextRequest, ctx: RouteContext<"/admin/newsletter-subscribers/[id]">) => {
    const { organizationId } = await requireOrgAdmin();
    const { id } = await ctx.params;
    const { status } = updateSchema.parse(await request.json());
    return NextResponse.json(await setSubscriberStatusForOrg(organizationId, id, status));
  }
);

export const DELETE = handleRoute(
  async (_request: NextRequest, ctx: RouteContext<"/admin/newsletter-subscribers/[id]">) => {
    const { organizationId } = await requireOrgAdmin();
    const { id } = await ctx.params;
    await deleteSubscriberForOrg(organizationId, id);
    return new NextResponse(null, { status: 204 });
  }
);
