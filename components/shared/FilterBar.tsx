"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActiveFilter {
  id: string;
  label: string;
  onRemove: () => void;
}

interface FilterBarProps {
  children: ReactNode;
  activeFilters?: ActiveFilter[];
  onClearAll?: () => void;
  className?: string;
}

export function FilterBar({ children, activeFilters = [], onClearAll, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter.id} variant="secondary" className="gap-1 pr-1">
              {filter.label}
              <button
                type="button"
                onClick={filter.onRemove}
                aria-label={`Remove ${filter.label} filter`}
                className="rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {onClearAll && (
            <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 px-2 text-xs">
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
