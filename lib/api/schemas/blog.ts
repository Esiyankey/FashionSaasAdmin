import { z } from "zod";
import { optionalImageUrl, slugSchema } from "@/lib/api/validation";

export const blogPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().max(100_000).optional(),
  coverImageUrl: optionalImageUrl,
  coverImageAlt: z.string().trim().max(200).optional(),
  authorName: z.string().trim().max(80).optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  /** ISO date-time. A future date schedules the post; omitted on publish = now. */
  publishedAt: z.coerce.date().nullable().optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(320).optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const blogCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  slug: slugSchema.optional(),
});
