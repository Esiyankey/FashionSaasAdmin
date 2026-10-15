"use client";

import { PageContainer } from "@/components/shared/PageContainer";
import { BlogPostEditor } from "@/features/cms/components/BlogPostEditor";

export default function NewBlogPostPage() {
  return (
    <PageContainer title="New post" description="Drafts are private until you publish them.">
      <BlogPostEditor />
    </PageContainer>
  );
}
