import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/api/handler";
import { assetBaseFrom, clientIp, publicJson } from "@/lib/api/public";
import { rateLimit } from "@/lib/api/rate-limit";
import { emailSchema } from "@/lib/api/validation";
import { createStorefrontOrder } from "@/lib/server/storefront";

const line = (max: number) => z.string().trim().min(1).max(max);

const addressSchema = z
  .object({
    fullName: line(100),
    email: emailSchema,
    phone: z.string().trim().regex(/^[+()\d\s.-]{6,30}$/, "Enter a valid phone number"),
    street: line(200),
    apartment: z.string().trim().max(100).optional(),
    city: line(100),
    state: line(100),
    zipCode: line(20),
    country: z.string().trim().max(60).optional(),
  })
  .strict();

/**
 * Order capture. The body carries only *what* is being bought and *where* it
 * ships — never prices, discounts or totals. Unknown fields (e.g. `price`,
 * `total`) are rejected with 422 so a tampered cart cannot slip through.
 * The server prices every line from the database and reserves stock in a
 * transaction. No payment is taken.
 */
const checkoutSchema = z
  .object({
    shippingAddress: addressSchema,
    billingAddress: addressSchema.omit({ email: true, phone: true }).optional(),
    items: z
      .array(
        z
          .object({
            productId: z.string().min(1).max(64),
            variantId: z.string().min(1).max(64).optional(),
            size: z.string().trim().max(60).optional(),
            color: z.string().trim().max(60).optional(),
            quantity: z.number().int("Quantity must be a whole number").min(1).max(99),
          })
          .strict()
      )
      .min(1, "Your cart is empty")
      .max(50),
    paymentMethod: z.enum(["cod", "card", "wallet"]).default("cod"),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export const POST = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/checkout">) => {
  const { orgSlug } = await ctx.params;
  rateLimit(`checkout:${orgSlug}:${clientIp(request)}`, 20, 600);
  const input = checkoutSchema.parse(await request.json());
  const order = await createStorefrontOrder(orgSlug, input, assetBaseFrom(request));
  return publicJson(order, { status: 201, cache: false });
});
