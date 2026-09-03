"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/shared/StatusChip";
import { useCustomer } from "@/features/customers/hooks/useCustomer";
import { formatCurrency, formatDate } from "@/utils/format";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: customer, isLoading, isError, refetch } = useCustomer(id);

  if (isLoading || !customer) {
    return (
      <PageContainer title="Customer">{isError ? <ErrorState onRetry={() => refetch()} /> : <LoadingState rows={6} />}</PageContainer>
    );
  }

  return (
    <PageContainer title={customer.name} description={customer.email}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{customer.orderCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total spent</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(customer.totalSpent)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Customer since</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatDate(customer.createdAt)}</CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <div className="flex flex-col divide-y">
              {customer.orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="flex items-center justify-between py-3 text-left text-sm hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusChip label={order.status} tone={order.status === "FULFILLED" ? "success" : "muted"} />
                    <span className="font-medium">{formatCurrency(order.total)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
