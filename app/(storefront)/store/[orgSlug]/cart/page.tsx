"use client";

import { use } from "react";
import Link from "next/link";
import { useCart } from "../_components/CartProvider";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";

export default function StorefrontCartPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-neutral-500">Your cart is empty.</p>
        <Link href={`/store/${orgSlug}`}>
          <Button className="mt-4">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Your cart</h1>
      <div className="flex flex-col divide-y">
        {cart.items.map((item) => (
          <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-center gap-4 py-4">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.title} className="size-16 rounded object-cover" />
            )}
            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              {item.variantTitle && <p className="text-xs text-neutral-500">{item.variantTitle}</p>}
              <p className="text-sm text-neutral-500">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => cart.updateQuantity(item.productId, item.variantId, item.quantity - 1)}
              >
                −
              </Button>
              <span className="w-8 text-center">{item.quantity}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => cart.updateQuantity(item.productId, item.variantId, item.quantity + 1)}
              >
                +
              </Button>
            </div>
            <p className="w-20 text-right font-medium">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <p className="text-lg font-semibold">Subtotal</p>
        <p className="text-lg font-semibold">{formatCurrency(cart.subtotal)}</p>
      </div>

      <Link href={`/store/${orgSlug}/checkout`}>
        <Button className="mt-6 w-full">Checkout</Button>
      </Link>
    </div>
  );
}
