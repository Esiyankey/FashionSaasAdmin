import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/api/handler";
import { createStorefrontOrder } from "@/lib/server/storefront";
import type { Prisma } from "@/lib/generated/prisma/client";

const checkoutSchema = z.object({
  customer: z.object({ name: z.string().min(1), email: z.string().email(), phone: z.string().optional() }),
  shippingAddress: z.record(z.string(), z.unknown()),
  items: z
    .array(z.object({ productId: z.string(), variantId: z.string().optional(), quantity: z.number().int().positive() }))
    .min(1),
  discount: z.number().min(0).optional(),
});

export const POST = handleRoute(async (request: NextRequest, ctx: RouteContext<"/storefront/[orgSlug]/checkout">) => {
  const { orgSlug } = await ctx.params;
  const input = checkoutSchema.parse(await request.json());
  const order = await createStorefrontOrder(orgSlug, {
    ...input,
    shippingAddress: input.shippingAddress as Prisma.InputJsonValue,
  });
  return NextResponse.json(order, { status: 201 });
});
