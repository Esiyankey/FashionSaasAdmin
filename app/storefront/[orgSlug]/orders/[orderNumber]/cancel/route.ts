import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { cancelGuestOrder } from "@/lib/server/storefront";

/** Customer self-cancel; only while the order is still pending. Returns stock to inventory. */
export const POST = handleRoute(
  async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/orders/[orderNumber]/cancel">) => {
    const { orgSlug, orderNumber } = await ctx.params;
    const token = request.headers.get("x-order-token") ?? request.nextUrl.searchParams.get("token");
    return publicJson(await cancelGuestOrder(orgSlug, orderNumber, token, assetBaseFrom(request)), { cache: false });
  }
);
