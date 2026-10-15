"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusChip } from "@/components/shared/StatusChip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Order, OrderQueryParams } from "@/features/orders/types";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/status";

const DEFAULT_PARAMS: OrderQueryParams = {
  search: "",
  status: "all",
  paymentStatus: "all",
  page: 1,
  pageSize: 10,
};


export default function OrdersPage() {
  const router = useRouter();
  const [params, setParams] = useState<OrderQueryParams>(DEFAULT_PARAMS);
  const { data, isLoading, isError, refetch } = useOrders(params);

  function updateParams(patch: Partial<OrderQueryParams>) {
    setParams((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  }

  const columns: DataTableColumn<Order>[] = [
    { id: "orderNumber", header: "Order", cell: (order) => <span className="font-medium">{order.orderNumber}</span> },
    {
      id: "customer",
      header: "Customer",
      cell: (order) => (
        <div>
          <p>{order.shippingAddress.name}</p>
          <p className="text-xs text-muted-foreground">{order.shippingAddress.email}</p>
        </div>
      ),
    },
    { id: "items", header: "Items", cell: (order) => order.items.reduce((sum, item) => sum + item.quantity, 0) },
    { id: "status", header: "Status", cell: (order) => <StatusChip label={ORDER_STATUS_LABEL[order.status]} tone={ORDER_STATUS_TONE[order.status]} /> },
    {
      id: "paymentStatus",
      header: "Payment",
      cell: (order) => <StatusChip label={order.paymentStatus} tone={order.paymentStatus === "PAID" ? "success" : "muted"} />,
    },
    { id: "total", header: "Total", cell: (order) => formatCurrency(order.total, order.currency) },
    { id: "createdAt", header: "Placed", cell: (order) => formatDate(order.createdAt) },
  ];

  return (
    <PageContainer title="Orders" description="Every order placed on your storefront.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={params.search}
            onChange={(value) => updateParams({ search: value })}
            placeholder="Search order number, name, email or phone"
          />
          <Select value={params.status} onValueChange={(value) => updateParams({ status: value as OrderQueryParams["status"] })}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={params.paymentStatus}
            onValueChange={(value) => updateParams({ paymentStatus: value as OrderQueryParams["paymentStatus"] })}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(order) => order.id}
          isLoading={isLoading}
          error={isError ? true : undefined}
          onRetry={() => refetch()}
          onRowClick={(order) => router.push(`/orders/${order.id}`)}
          emptyTitle="No orders yet"
          emptyDescription="Orders placed on your storefront will show up here."
        />

        {data && (
          <Pagination page={params.page} pageSize={params.pageSize} total={data.total} onPageChange={(page) => updateParams({ page })} />
        )}
      </div>
    </PageContainer>
  );
}
