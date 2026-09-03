import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface DataTableSelection<T> {
  selectedIds: Set<string | number>;
  onToggleRow: (id: string | number) => void;
  onToggleAll: (rows: T[]) => void;
}

export interface DataTableSort {
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSortChange: (columnId: string) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string | number;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  selection?: DataTableSelection<T>;
  sort?: DataTableSort;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading,
  error,
  onRetry,
  emptyTitle = "No results",
  emptyDescription = "There's nothing to show here yet.",
  className,
  selection,
  sort,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingState rows={5} />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (data.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  const allSelected = selection ? data.every((row) => selection.selectedIds.has(getRowId(row))) : false;
  const someSelected = selection ? data.some((row) => selection.selectedIds.has(getRowId(row))) : false;

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {selection && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={() => selection.onToggleAll(data)}
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.sortable && sort ? (
                  <button
                    type="button"
                    onClick={() => sort.onSortChange(column.id)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    {column.header}
                    {sort.sortBy === column.id ? (
                      sort.sortDirection === "asc" ? (
                        <ArrowUp className="size-3.5" />
                      ) : (
                        <ArrowDown className="size-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const rowId = getRowId(row);
            return (
              <TableRow
                key={rowId}
                data-state={selection?.selectedIds.has(rowId) ? "selected" : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
              >
                {selection && (
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={selection.selectedIds.has(rowId)}
                      onCheckedChange={() => selection.onToggleRow(rowId)}
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
