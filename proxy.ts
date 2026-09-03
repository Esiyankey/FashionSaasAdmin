import { authMiddleware } from "@/middleware/auth-middleware";

export const proxy = authMiddleware;

// The `config` object below must be a static literal — Next.js parses it at
// compile time, so it can't be imported from elsewhere. See `middleware/auth-middleware.ts`
// for the actual proxy logic.
//
// `admin` is our API route namespace (app/admin/**/route.ts) — those routes enforce
// their own session/role checks and must return JSON, not an HTML redirect to /login.
// `store` and `storefront` are the public storefront UI and its public API — both must
// stay reachable by anonymous shoppers.
export const config = {
  matcher: [
    "/((?!api|admin|store|storefront|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};
