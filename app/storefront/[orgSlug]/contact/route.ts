import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/api/handler";
import { clientIp, publicJson } from "@/lib/api/public";
import { rateLimit } from "@/lib/api/rate-limit";
import { emailSchema } from "@/lib/api/validation";
import { createContactMessage } from "@/lib/server/inbox";
import { resolveActiveOrg } from "@/lib/server/storefront";

const contactSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: emailSchema,
    phone: z.string().trim().max(40).optional(),
    subject: z.string().trim().min(1, "Subject is required").max(150),
    message: z.string().trim().min(1, "Message is required").max(5000),
    /** Honeypot: real users never fill this hidden field. */
    website: z.string().max(200).optional(),
  })
  .strict();

const THANKS = "Thanks, we will be in touch soon.";

/** Saves a contact-form submission to the admin inbox. 201 `{ id, message }`. */
export const POST = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/contact">) => {
  const { orgSlug } = await ctx.params;
  rateLimit(`contact:${orgSlug}:${clientIp(request)}`, 5, 600);
  const { website, ...input } = contactSchema.parse(await request.json());
  const organization = await resolveActiveOrg(orgSlug);
  if (website) {
    // Bot: respond like a success without storing anything.
    return publicJson({ id: null, message: THANKS }, { status: 201, cache: false });
  }
  const saved = await createContactMessage(organization.id, input);
  return publicJson({ id: saved.id, message: THANKS }, { status: 201, cache: false });
});
