"use client";

import { Archive, Copy, Eye, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "../types";

interface ProductRowActionsProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onArchive: (product: Product) => void;
  onPublish: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductRowActions({
  product,
  onQuickView,
  onEdit,
  onDuplicate,
  onArchive,
  onPublish,
  onDelete,
}: ProductRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Product actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onQuickView(product)}>
          <Eye />
          Quick view
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(product)}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDuplicate(product)}>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {product.status === "published" ? (
          <DropdownMenuItem onSelect={() => onArchive(product)}>
            <Archive />
            Archive
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onPublish(product)}>
            <Send />
            Publish
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onDelete(product)} variant="destructive">
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
