import "server-only";
import { prisma } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/api/errors";
import { paginated, type Pagination } from "@/lib/api/handler";
import type { BlogPostInput } from "@/lib/api/schemas/blog";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";
import { slugify } from "@/utils/slugify";
import type { ContentStatus, Prisma } from "@/lib/generated/prisma/client";

const ADMIN_INCLUDE = { category: { select: { id: true, name: true, slug: true } } } satisfies Prisma.BlogPostInclude;
type DbPost = Prisma.BlogPostGetPayload<{ include: typeof ADMIN_INCLUDE }>;

function serializePost(post: DbPost, withContent = true) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    ...(withContent ? { content: post.content } : {}),
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,
    authorName: post.authorName,
    categoryId: post.categoryId,
    category: post.category,
    status: post.status,
    isFeatured: post.isFeatured,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

async function resolveSlug(organizationId: string, requested: string | undefined, title: string, excludeId?: string) {
  if (requested) {
    const clash = await prisma.blogPost.findFirst({
      where: { organizationId, slug: requested, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (clash) throw validationError({ slug: ["Another post already uses this slug"] });
    return requested;
  }
  const base = slugify(title) || "post";
  let slug = base;
  let suffix = 2;
  while (
    await prisma.blogPost.findFirst({
      where: { organizationId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function assertCategory(organizationId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const exists = await prisma.blogCategory.count({ where: { id: categoryId, organizationId } });
  if (!exists) throw validationError({ categoryId: ["Blog category does not exist"] });
}

/** Publishing requires the fields the storefront renders. */
function assertPublishable(post: { title: string; excerpt: string; content: string; coverImageUrl: string | null }) {
  const errors: Record<string, string[]> = {};
  if (!post.excerpt.trim()) errors.excerpt = ["An excerpt is required to publish"];
  if (!post.content.trim()) errors.content = ["Content is required to publish"];
  if (!post.coverImageUrl) errors.coverImageUrl = ["A cover image is required to publish"];
  if (Object.keys(errors).length > 0) throw validationError(errors, "This post is not ready to publish");
}

export interface ListBlogPostsParams extends Pagination {
  search?: string;
  status?: ContentStatus | "all";
  categoryId?: string;
}

export async function listBlogPostsForOrg(organizationId: string, params: ListBlogPostsParams) {
  const where: Prisma.BlogPostWhereInput = {
    organizationId,
    ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: ADMIN_INCLUDE,
      orderBy: [{ updatedAt: "desc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.blogPost.count({ where }),
  ]);
  return paginated(
    items.map((post) => serializePost(post, false)),
    total,
    params
  );
}

export async function getBlogPostForOrg(organizationId: string, id: string) {
  const post = await prisma.blogPost.findFirst({ where: { id, organizationId }, include: ADMIN_INCLUDE });
  if (!post) throw notFound("Post not found");
  return serializePost(post);
}

export async function createBlogPostForOrg(organizationId: string, input: BlogPostInput) {
  await assertCategory(organizationId, input.categoryId);
  const slug = await resolveSlug(organizationId, input.slug, input.title);
  const status = input.status ?? "DRAFT";
  const data = {
    title: input.title,
    excerpt: input.excerpt ?? "",
    content: input.content ?? "",
    coverImageUrl: input.coverImageUrl ?? null,
    coverImageAlt: input.coverImageAlt ?? "",
    authorName: input.authorName ?? "",
    categoryId: input.categoryId ?? null,
    status,
    isFeatured: input.isFeatured ?? false,
    publishedAt: status === "PUBLISHED" ? (input.publishedAt ?? new Date()) : (input.publishedAt ?? null),
    seoTitle: input.seoTitle ?? "",
    seoDescription: input.seoDescription ?? "",
  };
  if (status === "PUBLISHED") assertPublishable(data);
  const post = await prisma.blogPost.create({ data: { organizationId, slug, ...data }, include: ADMIN_INCLUDE });
  notifyStorefront(organizationId, [StorefrontTag.blog, StorefrontTag.blogPost(post.slug)]);
  return serializePost(post);
}

export async function updateBlogPostForOrg(organizationId: string, id: string, input: Partial<BlogPostInput>) {
  const existing = await prisma.blogPost.findFirst({ where: { id, organizationId } });
  if (!existing) throw notFound("Post not found");
  if (input.categoryId !== undefined) await assertCategory(organizationId, input.categoryId);
  const slug =
    input.slug !== undefined && input.slug !== existing.slug
      ? await resolveSlug(organizationId, input.slug, input.title ?? existing.title, id)
      : existing.slug;

  const status = input.status ?? existing.status;
  const merged = {
    title: input.title ?? existing.title,
    excerpt: input.excerpt ?? existing.excerpt,
    content: input.content ?? existing.content,
    coverImageUrl: input.coverImageUrl !== undefined ? input.coverImageUrl : existing.coverImageUrl,
  };
  if (status === "PUBLISHED") assertPublishable(merged);

  // First publish stamps the date unless the editor chose one (future = scheduled).
  let publishedAt = input.publishedAt !== undefined ? input.publishedAt : existing.publishedAt;
  if (status === "PUBLISHED" && !publishedAt) publishedAt = new Date();

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...merged,
      slug,
      status,
      publishedAt,
      ...(input.coverImageAlt !== undefined ? { coverImageAlt: input.coverImageAlt } : {}),
      ...(input.authorName !== undefined ? { authorName: input.authorName } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
    },
    include: ADMIN_INCLUDE,
  });
  notifyStorefront(organizationId, [StorefrontTag.blog, StorefrontTag.blogPost(existing.slug), StorefrontTag.blogPost(post.slug)]);
  return serializePost(post);
}

/** Only drafts can be deleted; published or archived posts are archived instead. */
export async function deleteBlogPostForOrg(organizationId: string, id: string) {
  const existing = await prisma.blogPost.findFirst({ where: { id, organizationId }, select: { status: true, slug: true } });
  if (!existing) throw notFound("Post not found");
  if (existing.status !== "DRAFT") throw conflict("Only drafts can be deleted. Archive this post instead.");
  await prisma.blogPost.delete({ where: { id } });
  notifyStorefront(organizationId, [StorefrontTag.blog, StorefrontTag.blogPost(existing.slug)]);
}

// ---------------------------------------------------------------------------
// Blog categories
// ---------------------------------------------------------------------------

export async function listBlogCategoriesForOrg(organizationId: string) {
  const categories = await prisma.blogCategory.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    postCount: category._count.posts,
  }));
}

export async function createBlogCategoryForOrg(organizationId: string, input: { name: string; slug?: string }) {
  const slug = input.slug ?? (slugify(input.name) || "category");
  const clash = await prisma.blogCategory.findFirst({ where: { organizationId, slug }, select: { id: true } });
  if (clash) throw validationError({ name: ["A blog category with this name already exists"] });
  const category = await prisma.blogCategory.create({ data: { organizationId, name: input.name, slug } });
  notifyStorefront(organizationId, [StorefrontTag.blog]);
  return { id: category.id, name: category.name, slug: category.slug, postCount: 0 };
}

export async function updateBlogCategoryForOrg(organizationId: string, id: string, input: { name?: string; slug?: string }) {
  const existing = await prisma.blogCategory.findFirst({ where: { id, organizationId } });
  if (!existing) throw notFound("Blog category not found");
  const slug = input.slug ?? existing.slug;
  if (slug !== existing.slug) {
    const clash = await prisma.blogCategory.findFirst({ where: { organizationId, slug, id: { not: id } } });
    if (clash) throw validationError({ slug: ["Another category already uses this slug"] });
  }
  const category = await prisma.blogCategory.update({
    where: { id },
    data: { ...(input.name ? { name: input.name } : {}), slug },
    include: { _count: { select: { posts: true } } },
  });
  notifyStorefront(organizationId, [StorefrontTag.blog]);
  return { id: category.id, name: category.name, slug: category.slug, postCount: category._count.posts };
}

/** Posts in a deleted category become uncategorized (FK is ON DELETE SET NULL). */
export async function deleteBlogCategoryForOrg(organizationId: string, id: string) {
  const result = await prisma.blogCategory.deleteMany({ where: { id, organizationId } });
  if (result.count === 0) throw notFound("Blog category not found");
  notifyStorefront(organizationId, [StorefrontTag.blog]);
}
