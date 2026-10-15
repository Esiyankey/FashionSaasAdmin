import { authMiddleware } from "@/middleware/auth-middleware";

export const proxy = authMiddleware;

// The `config` object below must be a static literal — Next.js parses it at
// compile time, so it can't be imported from elsewhere. See `middleware/auth-middleware.ts`
// for the actual proxy logic.
//
// `admin` is our API route namespace (app/admin/**/route.ts) — those routes enforce
// their own session/role checks and must return JSON, not an HTML redirect to /login.
// `store` is the embedded demo storefront UI and must stay reachable by anonymous shoppers.
// `storefront` (public API) and `media` (uploaded images) are matched separately so the
// proxy can add CORS headers for the external storefront; they are never redirected to /login.
export const config = {
  matcher: [
    "/((?!api|admin|store|storefront|media/|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
    "/storefront/:path*",
    "/media/:path*",
  ],
};
