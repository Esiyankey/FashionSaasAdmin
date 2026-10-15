import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/api/handler";
import { clientIp, publicJson } from "@/lib/api/public";
import { rateLimit } from "@/lib/api/rate-limit";
import { emailSchema } from "@/lib/api/validation";
import { subscribeToNewsletter } from "@/lib/server/inbox";
import { resolveActiveOrg } from "@/lib/server/storefront";

const subscribeSchema = z
  .object({
    email: emailSchema,
    source: z.string().trim().max(40).regex(/^[a-z0-9_-]*$/i).optional(),
  })
  .strict();

const MESSAGES = {
  subscribed: "You are subscribed.",
  already_subscribed: "You are already subscribed.",
  resubscribed: "Welcome back, you are subscribed again.",
} as const;

/**
 * Idempotent subscribe. 201 `{ status: "subscribed" }` for a new address,
 * 200 `{ status: "already_subscribed" | "resubscribed" }` otherwise.
 * Never reveals other subscribers.
 */
export const POST = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/newsletter">) => {
  const { orgSlug } = await ctx.params;
  rateLimit(`newsletter:${orgSlug}:${clientIp(request)}`, 10, 600);
  const input = subscribeSchema.parse(await request.json());
  const organization = await resolveActiveOrg(orgSlug);
  const status = await subscribeToNewsletter(organization.id, input.email, input.source || "website");
  return publicJson({ status, message: MESSAGES[status] }, { status: status === "subscribed" ? 201 : 200, cache: false });
});
