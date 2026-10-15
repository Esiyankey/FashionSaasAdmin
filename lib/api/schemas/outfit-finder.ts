import { z } from "zod";
import { hexColorSchema, optionalImageUrl, slugSchema } from "@/lib/api/validation";

export const outfitOptionSchema = z.object({
  type: z.enum(["BODY_TYPE", "SKIN_TONE", "OCCASION"]),
  key: slugSchema,
  label: z.string().trim().min(1, "Label is required").max(60),
  hex: hexColorSchema.nullable().optional(),
  imageUrl: optionalImageUrl,
  position: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const outfitOptionUpdateSchema = outfitOptionSchema.omit({ type: true }).partial();

export const styleLookSchema = z.object({
  occasionId: z.string().min(1, "Choose an occasion"),
  styleName: z.string().trim().min(1, "Style name is required").max(120),
  description: z.string().trim().max(1000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  heroProductId: z.string().nullable().optional(),
  /** Ordered "complete the look" products. */
  productIds: z.array(z.string()).max(12).optional(),
  /** Body types this look suits; empty = all. */
  bodyTypeIds: z.array(z.string()).optional(),
  /** Skin tones this look suits; empty = all. */
  skinToneIds: z.array(z.string()).optional(),
  position: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export type StyleLookInput = z.infer<typeof styleLookSchema>;

/** What the storefront quiz submits: the option keys the shopper picked. */
export const recommendationRequestSchema = z
  .object({
    bodyType: z.string().trim().toLowerCase().min(1).max(60),
    skinTone: z.string().trim().toLowerCase().min(1).max(60),
    occasion: z.string().trim().toLowerCase().min(1).max(60),
  })
  .strict();
