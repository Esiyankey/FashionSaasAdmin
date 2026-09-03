"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { checkout } from "@/features/storefront/services/storefront.service";
import { useCart } from "../_components/CartProvider";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/services/http-client";

export default function StorefrontCheckoutPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const router = useRouter();
  const cart = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", line1: "", city: "", country: "" });
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ orderNumber: string } | null>(null);

  const placeOrder = useMutation({
    mutationFn: () =>
      checkout(orgSlug, {
        customer: { name: form.name, email: form.email, phone: form.phone || undefined },
        shippingAddress: { line1: form.line1, city: form.city, country: form.country },
        items: cart.items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
      }),
    onSuccess: (order) => {
      cart.clear();
      setConfirmation({ orderNumber: order.orderNumber });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Unable to place order"),
  });

  if (confirmation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Thank you!</h1>
        <p className="mt-2 text-neutral-500">Your order {confirmation.orderNumber} has been placed.</p>
        <Link href={`/store/${orgSlug}`}>
          <Button className="mt-6">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-neutral-500">Your cart is empty.</p>
        <Link href={`/store/${orgSlug}`}>
          <Button className="mt-4">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          placeOrder.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="line1">Address</Label>
          <Input id="line1" required value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" required value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <p className="font-medium">Subtotal</p>
          <p className="font-medium">{formatCurrency(cart.subtotal)}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={placeOrder.isPending}>
          Place order
        </Button>
      </form>
    </div>
  );
}
