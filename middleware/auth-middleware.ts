import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/constants/auth";
import { ORG_ADMIN_ONLY_PREFIXES, PUBLIC_ROUTES, ROUTES, SUPER_ADMIN_ONLY_PREFIXES } from "@/constants/routes";
import { decryptSession } from "@/lib/auth/session";

const PUBLIC_API_PREFIXES = ["/storefront/", "/media/"];

/**
 * Origins allowed to call the public storefront API from a browser.
 * STOREFRONT_ORIGINS is a comma-separated list, e.g.
 * "https://shop.example.com,http://localhost:3001". Server-to-server calls
 * (Next.js server components, the sitemap) don't need CORS.
 */
function allowedOrigins(): string[] {
  return (process.env.STOREFRONT_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Order-Token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Public storefront API: answer CORS preflights and tag responses for allowed
 * origins. No cookies are accepted cross-origin (no Allow-Credentials), so
 * admin sessions can never be used from the storefront's origin.
 */
function publicApiProxy(request: NextRequest): NextResponse {
  const headers = corsHeaders(request.headers.get("origin"));
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return publicApiProxy(request);
  }

  const session = await decryptSession(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!session && !isPublicRoute) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  }

  if (session) {
    const isSuperAdminRoute = SUPER_ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isOrgAdminRoute = ORG_ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (session.role === "ORGANIZATION_ADMIN" && isSuperAdminRoute) {
      return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
    }
    if (session.role === "SUPER_ADMIN" && isOrgAdminRoute) {
      return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
    }
  }

  return NextResponse.next();
}
