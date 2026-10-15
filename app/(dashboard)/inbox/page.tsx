"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusChip, type StatusTone } from "@/components/shared/StatusChip";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { Modal } from "@/components/shared/Modal";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContactMessage, useContactMessages, useDeleteContactMessage, useUpdateContactMessage } from "@/features/cms/hooks";
import type { ContactMessage, ContactMessageStatus, InboxQueryParams } from "@/features/cms/types";
import { formatRelativeTime } from "@/utils/format";

const STATUS_TONE: Record<ContactMessageStatus, StatusTone> = { NEW: "warning", READ: "muted", REPLIED: "success", ARCHIVED: "muted" };

export default function InboxPage() {
  const [params, setParams] = useState<InboxQueryParams>({ search: "", status: "all", page: 1, pageSize: 20 });
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useContactMessages(params);

  const columns: DataTableColumn<ContactMessage>[] = [
    { id: "status", header: "Status", cell: (m) => <StatusChip label={m.status.toLowerCase()} tone={STATUS_TONE[m.status]} /> },
    {
      id: "from",
      header: "From",
      cell: (m) => (
        <div>
          <p className={m.status === "NEW" ? "font-semibold" : ""}>{m.name}</p>
          <p className="text-xs text-muted-foreground">{m.email}</p>
        </div>
      ),
    },
    { id: "subject", header: "Subject", cell: (m) => <span className={m.status === "NEW" ? "font-semibold" : ""}>{m.subject}</span> },
    { id: "received", header: "Received", cell: (m) => formatRelativeTime(m.createdAt) },
  ];

  return (
    <PageContainer
      title="Inbox"
      description={`Messages sent from the storefront contact form.${data ? ` ${data.unreadCount} unread.` : ""}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={params.search} onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))} placeholder="Search name, email or subject" />
          <Select value={params.status} onValueChange={(status) => setParams((p) => ({ ...p, status: status as InboxQueryParams["status"], page: 1 }))}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All messages</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="READ">Read</SelectItem>
              <SelectItem value="REPLIED">Replied</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(m) => m.id}
          isLoading={isLoading}
          error={isError ? true : undefined}
          onRetry={() => refetch()}
          onRowClick={(m) => setOpenId(m.id)}
          emptyTitle="No messages"
          emptyDescription="Contact form submissions will appear here."
        />
        {data && (
          <Pagination page={params.page} pageSize={params.pageSize} total={data.total} onPageChange={(page) => setParams((p) => ({ ...p, page }))} />
        )}
      </div>
      {openId && <MessageDialog key={openId} id={openId} onClose={() => setOpenId(null)} />}
    </PageContainer>
  );
}

function MessageDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: message, isLoading } = useContactMessage(id);
  const update = useUpdateContactMessage();
  const remove = useDeleteContactMessage();
  const [note, setNote] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title={message?.subject ?? "Message"}>
      {isLoading || !message ? (
        <LoadingState rows={4} />
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="font-medium">
              {message.name} &lt;{message.email}&gt;
            </p>
            {message.phone && <p className="text-muted-foreground">{message.phone}</p>}
            <p className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
          </div>
          <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3">{message.message}</p>
          <div className="space-y-2">
            <Label htmlFor="message-note">Internal note</Label>
            <Textarea id="message-note" rows={2} value={note ?? message.internalNote ?? ""} onChange={(e) => setNote(e.target.value)} />
          </div>
          <ApiErrorAlert error={update.error ?? remove.error} />
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a
                href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                onClick={() => update.mutate({ id, status: "REPLIED" })}
              >
                <Mail />
                Reply by email
              </a>
            </Button>
            {note !== null && (
              <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id, internalNote: note || null })}>
                Save note
              </Button>
            )}
            <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id, status: "NEW" }, { onSuccess: onClose })}>
              Mark unread
            </Button>
            {message.status !== "REPLIED" && (
              <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id, status: "REPLIED" })}>
                Mark replied
              </Button>
            )}
            {message.status !== "ARCHIVED" && (
              <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id, status: "ARCHIVED" }, { onSuccess: onClose })}>
                Archive
              </Button>
            )}
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
          <ConfirmationDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title="Delete message?"
            description="The message is permanently removed (use for privacy requests)."
            confirmLabel="Delete"
            variant="destructive"
            isLoading={remove.isPending}
            onConfirm={() => remove.mutate(id, { onSuccess: onClose })}
          />
        </div>
      )}
    </Modal>
  );
}
