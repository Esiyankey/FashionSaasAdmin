"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusChip, type StatusTone } from "@/components/shared/StatusChip";
import { FormSection } from "@/components/shared/FormSection";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBlogCategories, useBlogPosts, useCreateBlogCategory, useDeleteBlogCategory } from "@/features/cms/hooks";
import type { BlogPost, BlogQueryParams, ContentStatus } from "@/features/cms/types";
import { formatDate } from "@/utils/format";

const STATUS_TONE: Record<ContentStatus, StatusTone> = { DRAFT: "muted", PUBLISHED: "success", ARCHIVED: "warning" };

export default function BlogListPage() {
  const router = useRouter();
  const [params, setParams] = useState<BlogQueryParams>({ search: "", status: "all", page: 1, pageSize: 20 });
  const { data, isLoading, isError, refetch } = useBlogPosts(params);

  const columns: DataTableColumn<BlogPost>[] = [
    {
      id: "cover",
      header: "",
      cell: (post) =>
        post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt="" className="h-10 w-16 rounded object-cover" />
        ) : (
          <div className="h-10 w-16 rounded bg-muted" />
        ),
    },
    {
      id: "title",
      header: "Title",
      cell: (post) => (
        <div>
          <p className="font-medium">{post.title}</p>
          <p className="font-mono text-xs text-muted-foreground">/blog/{post.slug}</p>
        </div>
      ),
    },
    { id: "category", header: "Category", cell: (post) => post.category?.name ?? "—" },
    {
      id: "status",
      header: "Status",
      cell: (post) => {
        const scheduled = post.status === "PUBLISHED" && post.publishedAt && new Date(post.publishedAt) > new Date();
        return <StatusChip label={scheduled ? "Scheduled" : post.status.toLowerCase()} tone={scheduled ? "info" : STATUS_TONE[post.status]} />;
      },
    },
    { id: "publishedAt", header: "Published", cell: (post) => (post.publishedAt ? formatDate(post.publishedAt) : "—") },
    { id: "updatedAt", header: "Updated", cell: (post) => formatDate(post.updatedAt) },
  ];

  return (
    <PageContainer
      title="Blog"
      description="The single source for journal posts on the storefront. Only published posts are public."
      actions={
        <Button onClick={() => router.push("/blog/new")}>
          <Plus />
          New post
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={params.search} onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))} placeholder="Search titles" />
          <Select value={params.status} onValueChange={(status) => setParams((p) => ({ ...p, status: status as BlogQueryParams["status"], page: 1 }))}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(post) => post.id}
          isLoading={isLoading}
          error={isError ? true : undefined}
          onRetry={() => refetch()}
          onRowClick={(post) => router.push(`/blog/${post.id}`)}
          emptyTitle="No posts yet"
          emptyDescription="Write your first journal post."
        />
        {data && (
          <Pagination page={params.page} pageSize={params.pageSize} total={data.total} onPageChange={(page) => setParams((p) => ({ ...p, page }))} />
        )}
        <BlogCategoriesSection />
      </div>
    </PageContainer>
  );
}

function BlogCategoriesSection() {
  const { data: categories } = useBlogCategories();
  const create = useCreateBlogCategory();
  const remove = useDeleteBlogCategory();
  const [name, setName] = useState("");

  return (
    <FormSection title="Blog categories" description="Deleting a category leaves its posts uncategorised.">
      <div className="flex flex-wrap gap-2">
        {categories?.map((category) => (
          <span key={category.id} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
            {category.name} <span className="text-muted-foreground">({category.postCount})</span>
            <button type="button" aria-label={`Delete ${category.name}`} onClick={() => remove.mutate(category.id)}>
              <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </span>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(name, { onSuccess: () => setName("") });
        }}
      >
        <Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button type="submit" variant="outline" disabled={!name.trim() || create.isPending}>
          Add
        </Button>
      </form>
      <ApiErrorAlert error={create.error ?? remove.error} />
    </FormSection>
  );
}
