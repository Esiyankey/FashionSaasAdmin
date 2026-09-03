"use client";

import { useEffect, useState } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterBar, type ActiveFilter } from "@/components/shared/FilterBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCategories } from "@/features/categories/hooks/useCategories";
import type { ProductQueryParams, ProductStatus } from "../types";

const STATUS_OPTIONS: { value: ProductStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

interface ProductFiltersProps {
  params: ProductQueryParams;
  onChange: (patch: Partial<ProductQueryParams>) => void;
}

export function ProductFilters({ params, onChange }: ProductFiltersProps) {
  const [searchText, setSearchText] = useState(params.search);
  const debouncedSearch = useDebouncedValue(searchText, 400);
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    if (debouncedSearch !== params.search) {
      onChange({ search: debouncedSearch, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const activeFilters: ActiveFilter[] = [];
  if (params.status !== "all") {
    activeFilters.push({
      id: "status",
      label: STATUS_OPTIONS.find((option) => option.value === params.status)?.label ?? params.status,
      onRemove: () => onChange({ status: "all", page: 1 }),
    });
  }
  if (params.categoryId !== "all") {
    activeFilters.push({
      id: "category",
      label: categories.find((category) => category.id === params.categoryId)?.name ?? "Category",
      onRemove: () => onChange({ categoryId: "all", page: 1 }),
    });
  }

  return (
    <FilterBar
      activeFilters={activeFilters}
      onClearAll={
        activeFilters.length > 0
          ? () => {
              setSearchText("");
              onChange({ search: "", status: "all", categoryId: "all", page: 1 });
            }
          : undefined
      }
    >
      <SearchInput
        value={searchText}
        onChange={setSearchText}
        placeholder="Search products by title or SKU..."
        className="w-full sm:w-72"
      />
      <Select value={params.status} onValueChange={(value) => onChange({ status: value as ProductStatus | "all", page: 1 })}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.categoryId} onValueChange={(value) => onChange({ categoryId: value, page: 1 })}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.parentId ? `— ${category.name}` : category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterBar>
  );
}
