import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { getGuestOrder } from "@/lib/server/storefront";

/**
 * Guest order lookup. Requires the `accessToken` returned at checkout, as
 * `?token=` or the `X-Order-Token` header. Wrong token → 404.
 */
export const GET = handleRoute(
  async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/orders/[orderNumber]">) => {
    const { orgSlug, orderNumber } = await ctx.params;
    const token = request.headers.get("x-order-token") ?? request.nextUrl.searchParams.get("token");
    return publicJson(await getGuestOrder(orgSlug, orderNumber, token, assetBaseFrom(request)), { cache: false });
  }
);
