"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusChip } from "@/components/shared/StatusChip";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeleteSubscriber, useSetSubscriberStatus, useSubscribers } from "@/features/cms/hooks";
import type { Subscriber, SubscriberQueryParams } from "@/features/cms/types";
import { formatDate } from "@/utils/format";

export default function SubscribersPage() {
  const [params, setParams] = useState<SubscriberQueryParams>({ search: "", status: "all", page: 1, pageSize: 25 });
  const { data, isLoading, isError, refetch } = useSubscribers(params);
  const setStatus = useSetSubscriberStatus();
  const remove = useDeleteSubscriber();
  const [toDelete, setToDelete] = useState<Subscriber | null>(null);

  const columns: DataTableColumn<Subscriber>[] = [
    { id: "email", header: "Email", cell: (s) => <span className="font-medium">{s.email}</span> },
    {
      id: "status",
      header: "Status",
      cell: (s) => <StatusChip label={s.status.toLowerCase()} tone={s.status === "SUBSCRIBED" ? "success" : "muted"} />,
    },
    { id: "source", header: "Source", cell: (s) => s.source },
    { id: "createdAt", header: "Subscribed", cell: (s) => formatDate(s.consentAt) },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (s) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate({ id: s.id, status: s.status === "SUBSCRIBED" ? "UNSUBSCRIBED" : "SUBSCRIBED" })}
          >
            {s.status === "SUBSCRIBED" ? "Unsubscribe" : "Resubscribe"}
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Delete subscriber" onClick={() => setToDelete(s)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Newsletter subscribers"
      description="Sign-ups from the storefront newsletter form. Only visible to admins."
      actions={
        <Button asChild variant="outline">
          {/* File download from an API route, not page navigation. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/newsletter-subscribers/export" download>
            <Download />
            Export CSV
          </a>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <ApiErrorAlert error={setStatus.error ?? remove.error} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={params.search} onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))} placeholder="Search email" />
          <Select value={params.status} onValueChange={(status) => setParams((p) => ({ ...p, status: status as SubscriberQueryParams["status"], page: 1 }))}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="SUBSCRIBED">Subscribed</SelectItem>
              <SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(s) => s.id}
          isLoading={isLoading}
          error={isError ? true : undefined}
          onRetry={() => refetch()}
          emptyTitle="No subscribers yet"
        />
        {data && (
          <Pagination page={params.page} pageSize={params.pageSize} total={data.total} onPageChange={(page) => setParams((p) => ({ ...p, page }))} />
        )}
      </div>
      <ConfirmationDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete subscriber?"
        description={`${toDelete?.email} will be permanently erased (use for privacy requests). To stop emails only, unsubscribe instead.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      />
    </PageContainer>
  );
}
