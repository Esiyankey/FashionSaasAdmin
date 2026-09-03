# Products (Phase 2)

Not implemented yet. When built, this module owns product catalog management and should follow
the same internal shape as `features/dashboard` and `features/auth`:

```
products/
  components/   ProductTable.tsx, ProductForm.tsx, ProductFilters.tsx, ...
  hooks/        useProducts.ts, useCreateProduct.ts, useUpdateProduct.ts, useDeleteProduct.ts
  services/     product.service.ts (typed apiClient calls, mocked with TODO(backend) until the API exists)
  types.ts      Product, ProductVariant, ProductFilters, ...
```

- Add `productKeys` to `services/queries/query-keys.ts`.
- Reuse `components/shared/DataTable`, `PageContainer`, `EmptyState`/`ErrorState`/`LoadingState`.
- Enable the "Products" item in `constants/nav.ts` (remove `disabled: true`) once the route exists.
- If the storefront's `types/product.ts` shape is reusable, extract it to a shared package instead of
  redefining it here — don't duplicate the type.
