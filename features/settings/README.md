# Settings (Phase 2)

Not implemented yet. Owns business profile, branding, and preference management. The storefront's
`types/business.ts` `Business`/`BusinessBranding` shapes (mirrored in this repo at
`types/business.ts`) are the likely backing types — extend them here rather than redefining
parallel ones. The `UserMenu` profile/settings menu items in `layouts/components/UserMenu.tsx` are
already wired up but disabled — enable them once this module's routes exist.
