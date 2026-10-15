"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { FileUpload } from "@/components/shared/FileUpload";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingState } from "@/components/shared/LoadingState";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { deleteMedia, getMedia, uploadMedia } from "@/features/media/services/media.service";
import { mediaKeys } from "@/services/queries/query-keys";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 24;

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const params = { page, pageSize: PAGE_SIZE, search: search || undefined };
  const { data, isLoading } = useQuery({ queryKey: mediaKeys.list(params), queryFn: () => getMedia(params), placeholderData: keepPreviousData });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) await uploadMedia(file);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
  const remove = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });

  return (
    <PageContainer
      title="Media library"
      description="Uploaded images are stored in the database and served publicly from /media/{id}. JPG, PNG, WEBP, GIF or AVIF, up to 5 MB."
    >
      <div className="flex flex-col gap-4">
        <FileUpload onFilesSelected={(files) => upload.mutate(files)} hint={upload.isPending ? "Uploading…" : "JPG, PNG, WEBP, GIF or AVIF"} />
        <ApiErrorAlert error={upload.error ?? remove.error} />
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search file names" />
        {isLoading ? (
          <LoadingState rows={4} />
        ) : !data?.items.length ? (
          <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {data.items.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.alt} className="aspect-square w-full object-cover" />
                <div className="space-y-1 p-2 text-xs">
                  <p className="truncate font-medium" title={asset.filename}>{asset.filename}</p>
                  <p className="text-muted-foreground">{Math.round(asset.sizeBytes / 1024)} KB · {formatDate(asset.createdAt)}</p>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label="Copy URL" onClick={() => navigator.clipboard.writeText(asset.url)}>
                      <Copy className="size-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Delete image" disabled={remove.isPending} onClick={() => remove.mutate(asset.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
      </div>
    </PageContainer>
  );
}
