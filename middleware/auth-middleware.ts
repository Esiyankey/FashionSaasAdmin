import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/constants/auth";
import { ORG_ADMIN_ONLY_PREFIXES, PUBLIC_ROUTES, ROUTES, SUPER_ADMIN_ONLY_PREFIXES } from "@/constants/routes";
import { decryptSession } from "@/lib/auth/session";

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
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
