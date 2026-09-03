"use client";

import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { DataTable, type DataTableColumn, type DataTableSelection, type DataTableSort } from "@/components/shared/DataTable";
import { StatusChip, type StatusTone } from "@/components/shared/StatusChip";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { getProductPriceRange, getProductTotalInventory, isLowStock, type Product, type ProductStatus } from "../types";
import { ProductRowActions } from "./ProductRowActions";

const statusTones: Record<ProductStatus, StatusTone> = {
  published: "success",
  draft: "muted",
  archived: "info",
};

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  selection: DataTableSelection<Product>;
  sort: DataTableSort;
  onQuickView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onArchive: (product: Product) => void;
  onPublish: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({
  products,
  isLoading,
  error,
  onRetry,
  selection,
  sort,
  onQuickView,
  onEdit,
  onDuplicate,
  onArchive,
  onPublish,
  onDelete,
}: ProductTableProps) {
  const columns: DataTableColumn<Product>[] = [
    {
      id: "title",
      header: "Product",
      sortable: true,
      cell: (product) => (
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex items-center gap-3 text-left hover:underline"
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {product.images[0] && (
              <Image src={product.images[0].url} alt={product.title} fill sizes="40px" className="object-cover" />
            )}
          </span>
          <span>
            <span className="block font-medium">{product.title}</span>
            <span className="block text-xs text-muted-foreground">{product.productType}</span>
          </span>
        </button>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (product) => <StatusChip label={product.status} tone={statusTones[product.status]} />,
    },
    {
      id: "inventory",
      header: "Inventory",
      sortable: true,
      cell: (product) => {
        const total = getProductTotalInventory(product);
        const lowStock = isLowStock(product);
        return (
          <span className={cn("flex items-center gap-1.5", lowStock && "text-warning")}>
            {lowStock && <AlertTriangle className="size-3.5" />}
            {total} in stock
          </span>
        );
      },
    },
    {
      id: "price",
      header: "Price",
      sortable: true,
      cell: (product) => {
        const { min, max } = getProductPriceRange(product);
        return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;
      },
    },
    {
      id: "updatedAt",
      header: "Updated",
      sortable: true,
      cell: (product) => formatRelativeTime(product.updatedAt),
    },
    {
      id: "actions",
      header: "",
      className: "w-10 text-right",
      cell: (product) => (
        <ProductRowActions
          product={product}
          onQuickView={onQuickView}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onPublish={onPublish}
          onDelete={onDelete}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      getRowId={(product) => product.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      selection={selection}
      sort={sort}
      emptyTitle="No products found"
      emptyDescription="Try adjusting your filters, or add your first product."
    />
  );
}
