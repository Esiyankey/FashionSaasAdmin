import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Cache tags shared with the storefront. The storefront tags its data
 * fetches with these names and, on receiving the webhook below, calls
 * `revalidateTag(tag, "max")` for each one.
 */
export const StorefrontTag = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  categories: "categories",
  content: "content",
  blog: "blog",
  blogPost: (slug: string) => `blog:${slug}`,
  outfitFinder: "outfit-finder",
  settings: "settings",
} as const;

/**
 * Tells the storefront that public data changed so it can revalidate cached
 * pages immediately instead of waiting for the time-based window.
 *
 * Configure STOREFRONT_REVALIDATE_URL (e.g. https://shop.example.com/api/revalidate)
 * and STOREFRONT_REVALIDATE_SECRET. Unset → no-op (time-based freshness only).
 * Runs after the response is sent and never fails the admin mutation.
 */
export function notifyStorefront(organizationId: string, tags: string[]): void {
  const url = process.env.STOREFRONT_REVALIDATE_URL;
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET;
  if (!url || !secret || tags.length === 0) return;

  const uniqueTags = [...new Set(tags)];
  const send = async () => {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { slug: true },
      });
      if (!organization) return;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ organizationSlug: organization.slug, tags: uniqueTags }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        console.warn(`[revalidate] storefront responded ${response.status} for tags ${uniqueTags.join(", ")}`);
      }
    } catch (error) {
      console.warn(`[revalidate] could not reach storefront: ${(error as Error).message}`);
    }
  };

  try {
    after(send);
  } catch {
    // Outside a request scope (scripts/tests): send without blocking.
    void send();
  }
}
