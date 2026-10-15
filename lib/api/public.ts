import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Freshness contract for public storefront GET endpoints: a shared cache (CDN)
 * may serve a response for up to PUBLIC_CACHE_SECONDS and keep serving it
 * stale for another PUBLIC_CACHE_SECONDS while it refetches, so an admin
 * change reaches every shopper within 2 × PUBLIC_CACHE_SECONDS even with no
 * revalidation webhook. Browsers never cache (max-age=0).
 */
export const PUBLIC_CACHE_SECONDS = 30;

export function publicJson(data: unknown, init: { status?: number; cache?: boolean } = {}): NextResponse {
  const { status = 200, cache = true } = init;
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": cache
        ? `public, max-age=0, s-maxage=${PUBLIC_CACHE_SECONDS}, stale-while-revalidate=${PUBLIC_CACHE_SECONDS}`
        : "no-store",
      Vary: "Origin",
    },
  });
}

/**
 * Absolute base URL for assets served by this app (e.g. `/media/{id}`), so
 * a storefront on another origin receives URLs it can load. PUBLIC_ASSET_BASE_URL
 * overrides the request origin when the app sits behind a proxy.
 */
export function assetBaseFrom(request: NextRequest): string {
  return (process.env.PUBLIC_ASSET_BASE_URL || request.nextUrl.origin).replace(/\/$/, "");
}

export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function readJson(request: NextRequest): Promise<unknown> {
  return request.json();
}
