"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Customer, CustomerQueryParams } from "@/features/customers/types";

const DEFAULT_PARAMS: CustomerQueryParams = { search: "", page: 1, pageSize: 10 };

export default function CustomersPage() {
  const router = useRouter();
  const [params, setParams] = useState<CustomerQueryParams>(DEFAULT_PARAMS);
  const { data, isLoading, isError, refetch } = useCustomers(params);

  function updateParams(patch: Partial<CustomerQueryParams>) {
    setParams((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      id: "name",
      header: "Customer",
      cell: (customer) => (
        <div className="flex flex-col">
          <span className="font-medium">{customer.name}</span>
          <span className="text-xs text-muted-foreground">{customer.email}</span>
        </div>
      ),
    },
    { id: "orders", header: "Orders", cell: (customer) => customer.orderCount },
    { id: "totalSpent", header: "Total spent", cell: (customer) => formatCurrency(customer.totalSpent) },
    {
      id: "lastOrderAt",
      header: "Last order",
      cell: (customer) => (customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"),
    },
    { id: "createdAt", header: "Customer since", cell: (customer) => formatDate(customer.createdAt) },
  ];

  return (
    <PageContainer title="Customers" description="Everyone who has shopped your storefront.">
      <div className="flex flex-col gap-4">
        <SearchInput value={params.search} onChange={(value) => updateParams({ search: value })} placeholder="Search customers" />

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(customer) => customer.id}
          isLoading={isLoading}
          error={isError ? true : undefined}
          onRetry={() => refetch()}
          onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
          emptyTitle="No customers yet"
          emptyDescription="Customers appear here after their first order on your storefront."
        />

        {data && (
          <Pagination page={params.page} pageSize={params.pageSize} total={data.total} onPageChange={(page) => updateParams({ page })} />
        )}
      </div>
    </PageContainer>
  );
}
