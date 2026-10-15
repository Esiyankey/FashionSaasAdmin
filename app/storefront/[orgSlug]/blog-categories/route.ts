import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { publicJson } from "@/lib/api/public";
import { listStorefrontBlogCategories } from "@/lib/server/storefront";

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/blog-categories">) => {
  const { orgSlug } = await ctx.params;
  return publicJson({ items: await listStorefrontBlogCategories(orgSlug) });
});
