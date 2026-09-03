"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useInventory } from "@/features/inventory/hooks/useInventory";
import { useAdjustInventory } from "@/features/inventory/hooks/useAdjustInventory";
import type { InventoryQueryParams } from "@/features/inventory/types";

const DEFAULT_PARAMS: InventoryQueryParams = { search: "", lowStockOnly: false, page: 1, pageSize: 10 };

export default function InventoryPage() {
  const [params, setParams] = useState<InventoryQueryParams>(DEFAULT_PARAMS);
  const { data, isLoading, isError, refetch } = useInventory(params);
  const adjust = useAdjustInventory();

  function updateParams(patch: Partial<InventoryQueryParams>) {
    setParams((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  }

  return (
    <PageContainer title="Inventory" description="Track and adjust stock across your catalog.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={params.search} onChange={(value) => updateParams({ search: value })} placeholder="Search products" />
          <div className="flex items-center gap-2">
            <Switch
              id="low-stock-only"
              checked={params.lowStockOnly}
              onCheckedChange={(checked) => updateParams({ lowStockOnly: checked })}
            />
            <Label htmlFor="low-stock-only">Low stock only</Label>
          </div>
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <LoadingState rows={5} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No products tracked" description="Products with inventory tracking enabled will show up here." />
        ) : (
          <div className="flex flex-col gap-3">
            {data.items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="size-10 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.sku ?? "No SKU"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.isLowStock && <StatusChip label="Low stock" tone="warning" />}
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={item.quantity <= 0 || adjust.isPending}
                        onClick={() => adjust.mutate({ productId: item.id, input: { delta: -1 } })}
                      >
                        <Minus />
                      </Button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={adjust.isPending}
                        onClick={() => adjust.mutate({ productId: item.id, input: { delta: 1 } })}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                </div>

                {item.variants.length > 0 && (
                  <div className="mt-3 flex flex-col divide-y border-t pt-2">
                    {item.variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <p>{variant.title}</p>
                          <p className="text-xs text-muted-foreground">{variant.sku ?? "No SKU"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            disabled={variant.quantity <= 0 || adjust.isPending}
                            onClick={() => adjust.mutate({ productId: item.id, input: { variantId: variant.id, delta: -1 } })}
                          >
                            <Minus />
                          </Button>
                          <span className="w-8 text-center">{variant.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            disabled={adjust.isPending}
                            onClick={() => adjust.mutate({ productId: item.id, input: { variantId: variant.id, delta: 1 } })}
                          >
                            <Plus />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {data && (
          <Pagination page={params.page} pageSize={params.pageSize} total={data.total} onPageChange={(page) => updateParams({ page })} />
        )}
      </div>
    </PageContainer>
  );
}
