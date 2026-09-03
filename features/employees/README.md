# Employees (Phase 2)

Not implemented yet. Owns staff accounts, roles, and permissions for a business. `AuthUser.role`
(`features/auth/types.ts`) already models `"owner" | "manager" | "staff"` — this module should own
the authoritative `Employee` type and the auth role should reference it rather than duplicating
the role union once this exists. Follow the `components/ hooks/ services/ types.ts` shape used by
`features/dashboard`.
