export const ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  organizations: "/organizations",
} as const;

export const PUBLIC_ROUTES: string[] = [ROUTES.login, ROUTES.forgotPassword, ROUTES.resetPassword];

/** Routes only a SUPER_ADMIN may view; an ORGANIZATION_ADMIN is redirected to /dashboard. */
export const SUPER_ADMIN_ONLY_PREFIXES: string[] = [ROUTES.organizations];

/** Routes only an ORGANIZATION_ADMIN may view; a SUPER_ADMIN is redirected to /dashboard. */
export const ORG_ADMIN_ONLY_PREFIXES: string[] = [
  "/products",
  "/categories",
  "/customers",
  "/orders",
  "/inventory",
  "/settings",
  "/storefront",
];
