# Categories

A minimal read-only slice already exists (`services/category.service.ts`, `hooks/useCategories.ts`)
because Phase 2's Product form needs a category list for its multi-select. It returns the shared
`Category` type from `types/category.ts` (`id`, `name`, `slug`, `parentId` — already hierarchy-ready).

**Phase 3 scope** — extend this slice into full management, following the
`components/ hooks/ services/ types.ts` shape used by `features/dashboard`:

- `components/` — `CategoryTree.tsx`, `CategoryForm.tsx`, category image upload (reuse
  `components/shared/FileUpload.tsx`)
- CRUD mutations (`useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`) alongside the
  existing `useCategories` query
- Product count per category (the product list in `features/products` already filters by
  `categoryIds`, so counting is a matter of aggregating that data or having the backend return it)
- Nested category management UI — the data shape (`parentId`) already supports arbitrary depth,
  only the UI for editing the hierarchy is missing

Do not duplicate the `Category` type or the mock data shape — extend what's here.
