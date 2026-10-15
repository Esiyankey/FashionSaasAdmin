import type { NextRequest } from "next/server";
import { handleRoute, parsePagination } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { listStorefrontBlogPosts } from "@/lib/server/storefront";

/** Published posts (publishedAt ≤ now), newest first. Items omit `content`. */
export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/blog">) => {
  const { orgSlug } = await ctx.params;
  const params = request.nextUrl.searchParams;
  return publicJson(
    await listStorefrontBlogPosts(
      orgSlug,
      {
        category: params.get("category")?.trim() || undefined,
        featured: params.get("featured") === "true",
        ...parsePagination(params, 9, 50),
      },
      assetBaseFrom(request)
    )
  );
});
