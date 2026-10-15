"use client";

import { Archive, EyeOff, Loader2, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  onArchive: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  isPending?: boolean;
}

export function BulkActionsBar({ count, onClear, onArchive, onPublish, onUnpublish, onDelete, isPending }: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
      <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={onClear}>
        <X className="size-4" />
      </Button>
      <span className="text-sm font-medium">{count} selected</span>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPublish} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
          Publish
        </Button>
        <Button variant="outline" size="sm" onClick={onUnpublish} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <EyeOff />}
          Unpublish
        </Button>
        <Button variant="outline" size="sm" onClick={onArchive} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Archive />}
          Archive
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={isPending}>
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  );
}
