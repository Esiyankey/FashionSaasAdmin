import { z } from "zod";

/** Shared zod building blocks so every write endpoint validates the same way. */

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const idSchema = z.string().trim().min(1).max(64);

/** Internal path (`/shop`), absolute http(s) URL, or mailto:/tel: link. */
export const hrefSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) => /^\/(?!\/)/.test(value) || /^https?:\/\/[^\s]+$/i.test(value) || /^(mailto|tel):[^\s]+$/i.test(value),
    "Must be an internal path starting with / or an http(s), mailto: or tel: link"
  );

/** Image reference: uploaded media (`/media/...`), a site-relative path, or an http(s) URL. Never a local file path or blob: URL. */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (value) => /^\/(?!\/)[^\s\\]*$/.test(value) || /^https?:\/\/[^\s]+$/i.test(value),
    "Must be an uploaded image, a site path starting with /, or an http(s) URL"
  );

export const optionalImageUrl = imageUrlSchema.nullable().optional();

export const hexColorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a #RRGGBB colour");

export const moneySchema = z.number().finite().min(0).max(1_000_000);

export const emailSchema = z.string().trim().toLowerCase().max(254).email("Enter a valid email address");

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
