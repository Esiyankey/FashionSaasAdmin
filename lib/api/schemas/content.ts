import { z } from "zod";
import { emailSchema, hexColorSchema, hrefSchema, imageUrlSchema, optionalImageUrl } from "@/lib/api/validation";

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).nullable().optional();

/** Partial update of store info, contact details, branding, announcement bar and hero. */
export const storefrontConfigUpdateSchema = z
  .object({
    storeName: text(80).min(1).optional(),
    logoUrl: optionalImageUrl,
    faviconUrl: optionalImageUrl,
    primaryColor: hexColorSchema.optional(),
    secondaryColor: hexColorSchema.optional(),
    fontFamily: text(60).optional(),
    siteUrl: z.string().trim().url().max(200).nullable().optional().or(z.literal("").transform(() => null)),
    seoTitle: optionalText(70),
    seoDescription: optionalText(320),
    footerText: optionalText(500),
    contactEmail: emailSchema.nullable().optional().or(z.literal("").transform(() => null)),
    contactPhone: optionalText(40),
    addressLines: z.array(text(120).min(1)).max(4).optional(),
    workingHours: optionalText(120),
    mapEmbedUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((value) => value === "" || /^https:\/\/www\.google\.com\/maps\/embed\?/.test(value), {
        message: "Must be a https://www.google.com/maps/embed?... URL",
      })
      .transform((value) => value || null)
      .nullable()
      .optional(),
    socialLinks: z
      .record(z.enum(["instagram", "facebook", "x", "twitter", "tiktok", "youtube", "pinterest", "linkedin"]), z.string().trim().url().max(300))
      .nullable()
      .optional(),
    heroBadgeText: optionalText(80),
    heroHeadline: optionalText(160),
    heroSubheadline: optionalText(300),
    heroImageUrl: optionalImageUrl,
    heroImageAlt: text(200).optional(),
    heroCtaLabel: optionalText(40),
    heroCtaHref: hrefSchema.nullable().optional().or(z.literal("").transform(() => null)),
    announcementEnabled: z.boolean().optional(),
    announcementMessage: optionalText(160),
    announcementHighlight: optionalText(80),
    announcementLinkLabel: optionalText(40),
    announcementLinkHref: hrefSchema.nullable().optional().or(z.literal("").transform(() => null)),
    announcementShowPhone: z.boolean().optional(),
  })
  .strict();

export type StorefrontConfigUpdate = z.infer<typeof storefrontConfigUpdateSchema>;

export const navigationLinkSchema = z.object({
  label: text(40).min(1, "Label is required"),
  href: hrefSchema,
  isVisible: z.boolean().default(true),
});

/** The full ordered list for both menus; array order becomes `position`. */
export const navigationUpdateSchema = z.object({
  header: z.array(navigationLinkSchema).max(12),
  footer: z.array(navigationLinkSchema).max(20),
});

const imageWithAlt = z.object({ url: imageUrlSchema, alt: text(200).default("") });
const cta = { ctaLabel: optionalText(40), ctaHref: hrefSchema.nullable().optional().or(z.literal("").transform(() => null)) };

/** Structured About page (matches the storefront's About sections). */
export const aboutPageSchema = z.object({
  hero: z.object({
    eyebrow: text(80).default(""),
    title: text(120).min(1, "Hero title is required"),
    image: imageWithAlt.nullable().default(null),
  }),
  story: z.object({
    eyebrow: text(80).default(""),
    heading: text(120).default(""),
    body: text(2000).default(""),
    images: z.array(imageWithAlt).max(3).default([]),
    ...cta,
  }),
  quote: z
    .object({
      text: text(500).min(1),
      author: text(80).default(""),
      role: text(120).default(""),
    })
    .nullable()
    .default(null),
  inspiration: z.object({
    heading: text(120).default(""),
    body: text(2000).default(""),
    image: imageWithAlt.nullable().default(null),
    ...cta,
  }),
});

export const PAGE_SCHEMAS = { about: aboutPageSchema } as const;
export type PageKey = keyof typeof PAGE_SCHEMAS;

export const teamMemberSchema = z.object({
  name: text(80).min(1, "Name is required"),
  role: text(80).optional(),
  imageUrl: optionalImageUrl,
  position: z.number().int().min(0).max(1000).optional(),
  isVisible: z.boolean().optional(),
});
