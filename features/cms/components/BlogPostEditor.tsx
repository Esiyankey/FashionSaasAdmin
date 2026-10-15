"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormSection } from "@/components/shared/FormSection";
import { SaveStatus } from "@/components/shared/SaveStatus";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageField } from "@/features/media/components/ImageField";
import { useBlogCategories, useCreateBlogPost, useDeleteBlogPost, useUpdateBlogPost } from "../hooks";
import type { BlogPost, BlogPostInput, ContentStatus } from "../types";
import { Field } from "./StoreInfoForm";

/** `<input type="datetime-local">` works in local time without a zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function BlogPostEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const { data: categories } = useBlogCategories();
  const create = useCreateBlogPost();
  const update = useUpdateBlogPost();
  const remove = useDeleteBlogPost();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    coverImageUrl: post?.coverImageUrl ?? null,
    coverImageAlt: post?.coverImageAlt ?? "",
    authorName: post?.authorName ?? "",
    categoryId: post?.categoryId ?? null,
    isFeatured: post?.isFeatured ?? false,
    publishedAt: toLocalInput(post?.publishedAt ?? null),
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));
  const mutation = post ? update : create;

  function submit(status: ContentStatus) {
    const input: BlogPostInput = {
      ...form,
      slug: form.slug || undefined,
      status,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    };
    if (post) {
      update.mutate({ id: post.id, ...input });
    } else {
      create.mutate(input, { onSuccess: (created) => router.replace(`/blog/${created.id}`) });
    }
  }

  const status = post?.status ?? "DRAFT";

  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <FormSection title="Post">
          <Field label="Title" id="post-title">
            <Input id="post-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Slug" id="post-slug" hint="The article URL: /blog/{slug}. Generated from the title if empty.">
            <Input id="post-slug" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} />
          </Field>
          <Field label="Excerpt" id="post-excerpt" hint="Shown on the blog list. Required to publish.">
            <Textarea id="post-excerpt" rows={3} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </Field>
          <Field label="Content (Markdown)" id="post-content" hint="Required to publish.">
            <Textarea id="post-content" rows={16} className="font-mono text-sm" value={form.content} onChange={(e) => set("content", e.target.value)} />
          </Field>
        </FormSection>
        <FormSection title="SEO" description="Defaults to the title and excerpt.">
          <Field label="SEO title" id="post-seo-title">
            <Input id="post-seo-title" maxLength={70} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
          </Field>
          <Field label="SEO description" id="post-seo-description">
            <Textarea id="post-seo-description" rows={2} maxLength={320} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
          </Field>
        </FormSection>
      </div>

      <div className="flex flex-col gap-6">
        <FormSection title="Publishing" actions={<StatusChip label={status.toLowerCase()} tone={status === "PUBLISHED" ? "success" : "muted"} />}>
          <Field label="Publish date" id="post-published-at" hint="Leave empty to publish now. A future date schedules the post.">
            <Input id="post-published-at" type="datetime-local" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
          </Field>
          <div className="flex items-center justify-between">
            <Label htmlFor="post-featured">Featured</Label>
            <Switch id="post-featured" checked={form.isFeatured} onCheckedChange={(v) => set("isFeatured", v)} />
          </div>
          <SaveStatus isSuccess={mutation.isSuccess} error={mutation.error} />
          <div className="flex flex-wrap gap-2">
            <Button disabled={mutation.isPending || !form.title} onClick={() => submit(status === "PUBLISHED" ? "PUBLISHED" : "DRAFT")}>
              {status === "PUBLISHED" ? "Update" : "Save draft"}
            </Button>
            {status !== "PUBLISHED" && (
              <Button variant="outline" disabled={mutation.isPending || !form.title} onClick={() => submit("PUBLISHED")}>
                Publish
              </Button>
            )}
            {status === "PUBLISHED" && (
              <Button variant="outline" disabled={mutation.isPending} onClick={() => submit("DRAFT")}>
                Unpublish
              </Button>
            )}
            {post && status !== "ARCHIVED" && (
              <Button variant="outline" disabled={mutation.isPending} onClick={() => submit("ARCHIVED")}>
                Archive
              </Button>
            )}
            {post && status === "DRAFT" && (
              <Button variant="destructive" disabled={remove.isPending} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        </FormSection>
        <FormSection title="Details">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.categoryId ?? "none"} onValueChange={(v) => set("categoryId", v === "none" ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorised</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Author" id="post-author">
            <Input id="post-author" value={form.authorName} onChange={(e) => set("authorName", e.target.value)} />
          </Field>
          <div className="space-y-2">
            <Label>Cover image (required to publish)</Label>
            <ImageField value={form.coverImageUrl} alt={form.coverImageAlt || form.title} onChange={(url) => set("coverImageUrl", url)} />
          </div>
          <Field label="Cover alt text" id="post-cover-alt">
            <Input id="post-cover-alt" value={form.coverImageAlt} onChange={(e) => set("coverImageAlt", e.target.value)} />
          </Field>
        </FormSection>
      </div>

      {post && (
        <ConfirmationDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete draft?"
          description="This draft will be permanently deleted."
          confirmLabel="Delete"
          variant="destructive"
          isLoading={remove.isPending}
          onConfirm={() => remove.mutate(post.id, { onSuccess: () => router.push("/blog") })}
        />
      )}
    </div>
  );
}
