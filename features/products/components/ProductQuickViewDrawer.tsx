"use client";

import Image from "next/image";
import { Drawer } from "@/components/shared/Drawer";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusTone } from "@/components/shared/StatusChip";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { formatCurrency, formatDate } from "@/utils/format";
import { getProductPriceRange, getProductTotalInventory, type Product, type ProductStatus } from "../types";

const statusTones: Record<ProductStatus, StatusTone> = {
  published: "success",
  draft: "muted",
  archived: "info",
};

interface ProductQuickViewDrawerProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export function ProductQuickViewDrawer({ product, onClose, onEdit }: ProductQuickViewDrawerProps) {
  const { data: categories = [] } = useCategories();
  const { min, max } = product ? getProductPriceRange(product) : { min: 0, max: 0 };
  const categoryNames = product
    ? categories.filter((category) => product.categoryIds.includes(category.id)).map((category) => category.name)
    : [];

  return (
    <Drawer open={!!product} onOpenChange={(open) => !open && onClose()} title={product?.title ?? ""} description={product?.productType}>
      {product && (
        <div className="flex flex-col gap-4">
          {product.images[0] && (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
              <Image src={product.images[0].url} alt={product.title} fill sizes="24rem" className="object-cover" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <StatusChip label={product.status} tone={statusTones[product.status]} />
            {product.isFeatured && <StatusChip label="Featured" tone="info" />}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Price</dt>
              <dd className="font-medium">{min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Inventory</dt>
              <dd className="font-medium">{getProductTotalInventory(product)} in stock</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="font-medium">{product.sku ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="font-medium">{formatDate(product.updatedAt)}</dd>
            </div>
          </dl>

          {categoryNames.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm text-muted-foreground">Categories</p>
              <p className="text-sm">{categoryNames.join(", ")}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">{product.description}</p>

          <Button onClick={() => onEdit(product)} className="mt-2">
            Edit product
          </Button>
        </div>
      )}
    </Drawer>
  );
}
