import { z } from "zod";
import { optionalImageUrl, slugSchema } from "@/lib/api/validation";

export const categoryFieldsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  slug: slugSchema.optional(),
  parentId: z.string().nullable().optional(),
  title: z.string().max(80).optional(),
  description: z.string().max(300).optional(),
  imageUrl: optionalImageUrl,
  imageAlt: z.string().max(200).optional(),
  position: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});
