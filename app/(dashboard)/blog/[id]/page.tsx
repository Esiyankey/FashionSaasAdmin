"use client";

import { use } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { BlogPostEditor } from "@/features/cms/components/BlogPostEditor";
import { useBlogPost } from "@/features/cms/hooks";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: post, isLoading, isError, refetch } = useBlogPost(id);

  return (
    <PageContainer title={post?.title ?? "Edit post"}>
      {isError ? (
        <ErrorState title="Post not found" onRetry={() => refetch()} />
      ) : isLoading || !post ? (
        <LoadingState rows={8} />
      ) : (
        <BlogPostEditor post={post} />
      )}
    </PageContainer>
  );
}
