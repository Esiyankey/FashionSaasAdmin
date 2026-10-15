import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { getStorefrontBlogPost } from "@/lib/server/storefront";

/** Full article including markdown `content`. Drafts, archived and scheduled posts return 404. */
export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/blog/[slug]">) => {
  const { orgSlug, slug } = await ctx.params;
  return publicJson(await getStorefrontBlogPost(orgSlug, slug, assetBaseFrom(request)));
});
