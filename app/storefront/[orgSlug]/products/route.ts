import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleRoute, parsePagination } from "@/lib/api/handler";
import { assetBaseFrom, publicJson } from "@/lib/api/public";
import { listStorefrontProducts } from "@/lib/server/storefront";

/** Repeatable and/or comma separated: `?category=women&category=men` or `?category=women,men`. */
function multi(params: URLSearchParams, name: string): string[] | undefined {
  const values = params
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length ? values.slice(0, 20) : undefined;
}

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  productType: z.string().trim().max(60).optional(),
  featured: z.enum(["true", "false"]).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  sort: z.enum(["featured", "newest", "price-asc", "price-desc", "name-asc"]).default("featured"),
});

export const GET = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/products">) => {
  const { orgSlug } = await ctx.params;
  const params = request.nextUrl.searchParams;
  const query = querySchema.parse({
    q: params.get("q") || params.get("search") || undefined,
    minPrice: params.get("minPrice") || undefined,
    maxPrice: params.get("maxPrice") || undefined,
    productType: params.get("productType") || undefined,
    featured: params.get("featured") || undefined,
    inStock: params.get("inStock") || undefined,
    sort: params.get("sort") || undefined,
  });
  return publicJson(
    await listStorefrontProducts(
      orgSlug,
      {
        ...query,
        featured: query.featured === "true",
        inStock: query.inStock === "true",
        categories: multi(params, "category"),
        categoryId: params.get("categoryId") || undefined,
        sizes: multi(params, "size"),
        colors: multi(params, "color"),
        ...parsePagination(params, 24, 100),
      },
      assetBaseFrom(request)
    )
  );
});
