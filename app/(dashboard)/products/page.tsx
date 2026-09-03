"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/features/products/hooks/useProducts";
import { useProductStats } from "@/features/products/hooks/useProductStats";
import { useDeleteProducts } from "@/features/products/hooks/useDeleteProducts";
import { useArchiveProducts } from "@/features/products/hooks/useArchiveProducts";
import { usePublishProducts } from "@/features/products/hooks/usePublishProducts";
import { useDuplicateProduct } from "@/features/products/hooks/useDuplicateProduct";
import { ProductStatsWidgets } from "@/features/products/components/ProductStatsWidgets";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductTable } from "@/features/products/components/ProductTable";
import { BulkActionsBar } from "@/features/products/components/BulkActionsBar";
import { ProductQuickViewDrawer } from "@/features/products/components/ProductQuickViewDrawer";
import type { Product, ProductQueryParams } from "@/features/products/types";

const DEFAULT_PARAMS: ProductQueryParams = {
  search: "",
  status: "all",
  categoryId: "all",
  sortBy: "updatedAt",
  sortDirection: "desc",
  page: 1,
  pageSize: 10,
};

export default function ProductsPage() {
  const router = useRouter();
  const [params, setParams] = useState<ProductQueryParams>(DEFAULT_PARAMS);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useProducts(params);
  const { data: stats, isLoading: isStatsLoading } = useProductStats();
  const deleteProducts = useDeleteProducts();
  const archiveProducts = useArchiveProducts();
  const publishProducts = usePublishProducts();
  const duplicateProduct = useDuplicateProduct();

  function updateParams(patch: Partial<ProductQueryParams>) {
    setParams((current) => ({ ...current, ...patch }));
  }

  function toggleRow(id: string | number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(rows: Product[]) {
    setSelectedIds((current) => {
      const allSelected = rows.every((row) => current.has(row.id));
      const next = new Set(current);
      rows.forEach((row) => (allSelected ? next.delete(row.id) : next.add(row.id)));
      return next;
    });
  }

  function goToEdit(product: Product) {
    router.push(`/products/${product.id}`);
  }

  const isBulkPending = deleteProducts.isPending || archiveProducts.isPending || publishProducts.isPending;

  return (
    <PageContainer
      title="Products"
      description="Manage your catalog, inventory, and product visibility."
      actions={
        <Button onClick={() => router.push("/products/new")}>
          <Plus />
          Add product
        </Button>
      }
    >
      <ProductStatsWidgets stats={stats} isLoading={isStatsLoading} />

      <div className="flex flex-col gap-4">
        <ProductFilters params={params} onChange={updateParams} />

        <BulkActionsBar
          count={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          isPending={isBulkPending}
          onPublish={() =>
            publishProducts.mutate(Array.from(selectedIds, String), { onSuccess: () => setSelectedIds(new Set()) })
          }
          onArchive={() =>
            archiveProducts.mutate(Array.from(selectedIds, String), { onSuccess: () => setSelectedIds(new Set()) })
          }
          onDelete={() => setBulkDeleteOpen(true)}
        />

        <ProductTable
          products={data?.items ?? []}
          isLoading={isLoading}
          error={isError ? true : undefined}
          onRetry={() => refetch()}
          selection={{ selectedIds, onToggleRow: toggleRow, onToggleAll: toggleAll }}
          sort={{
            sortBy: params.sortBy,
            sortDirection: params.sortDirection,
            onSortChange: (columnId) =>
              updateParams({
                sortBy: columnId as ProductQueryParams["sortBy"],
                sortDirection: params.sortBy === columnId && params.sortDirection === "asc" ? "desc" : "asc",
              }),
          }}
          onQuickView={setQuickViewProduct}
          onEdit={goToEdit}
          onDuplicate={(product) => duplicateProduct.mutate(product.id)}
          onArchive={(product) => archiveProducts.mutate([product.id])}
          onPublish={(product) => publishProducts.mutate([product.id])}
          onDelete={setProductToDelete}
        />

        {data && (
          <Pagination
            page={params.page}
            pageSize={params.pageSize}
            total={data.total}
            onPageChange={(page) => updateParams({ page })}
          />
        )}
      </div>

      <ProductQuickViewDrawer product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onEdit={goToEdit} />

      <ConfirmationDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title="Delete product?"
        description={`"${productToDelete?.title}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteProducts.isPending}
        onConfirm={() => {
          if (!productToDelete) return;
          deleteProducts.mutate([productToDelete.id], { onSuccess: () => setProductToDelete(null) });
        }}
      />

      <ConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.size} products?`}
        description="These products will be permanently removed. This can't be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteProducts.isPending}
        onConfirm={() => {
          deleteProducts.mutate(Array.from(selectedIds, String), {
            onSuccess: () => {
              setSelectedIds(new Set());
              setBulkDeleteOpen(false);
            },
          });
        }}
      />
    </PageContainer>
  );
}
