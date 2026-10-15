"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { checkout } from "@/features/storefront/services/storefront.service";
import type { CheckoutAddress, CheckoutResult } from "@/features/storefront/types";
import { useCart } from "../_components/CartProvider";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/services/http-client";

const FIELDS: { key: keyof CheckoutAddress; label: string; type?: string; optional?: boolean; half?: boolean }[] = [
  { key: "fullName", label: "Full name" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "street", label: "Street address" },
  { key: "apartment", label: "Apartment, suite (optional)", optional: true },
  { key: "city", label: "City", half: true },
  { key: "state", label: "State / region", half: true },
  { key: "zipCode", label: "ZIP / postal code", half: true },
  { key: "country", label: "Country (optional)", optional: true, half: true },
];

const EMPTY: CheckoutAddress = { fullName: "", email: "", phone: "", street: "", apartment: "", city: "", state: "", zipCode: "", country: "" };

export default function StorefrontCheckoutPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const cart = useCart();
  const [form, setForm] = useState<CheckoutAddress>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [confirmation, setConfirmation] = useState<CheckoutResult | null>(null);

  const placeOrder = useMutation({
    mutationFn: () =>
      checkout(orgSlug, {
        shippingAddress: {
          ...form,
          apartment: form.apartment || undefined,
          country: form.country || undefined,
        },
        paymentMethod: "cod",
        // Only identities and quantities are sent — the server prices the order.
        items: cart.items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
      }),
    onSuccess: (order) => {
      cart.clear();
      setConfirmation(order);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Unable to place order");
      setFieldErrors(err instanceof ApiError ? (err.fieldErrors ?? {}) : {});
    },
  });

  if (confirmation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Thank you!</h1>
        <p className="mt-2 text-neutral-500">Your order {confirmation.orderNumber} has been placed.</p>
        <div className="mx-auto mt-6 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(confirmation.subtotal, confirmation.currency)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(confirmation.shipping, confirmation.currency)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(confirmation.tax, confirmation.currency)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(confirmation.total, confirmation.currency)}</span></div>
        </div>
        <p className="mt-4 text-xs text-neutral-500">Payment is collected on delivery.</p>
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

  const itemErrors = Object.entries(fieldErrors).filter(([key]) => key.startsWith("items"));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>

      <form
        className="grid grid-cols-2 gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setFieldErrors({});
          placeOrder.mutate();
        }}
      >
        {FIELDS.map((field) => {
          const message = fieldErrors[`shippingAddress.${field.key}`]?.[0];
          return (
            <div key={field.key} className={`space-y-2 ${field.half ? "col-span-1" : "col-span-2"}`}>
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type ?? "text"}
                required={!field.optional}
                aria-invalid={Boolean(message)}
                value={form[field.key] ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
              />
              {message && <p className="text-xs text-red-600">{message}</p>}
            </div>
          );
        })}

        <div className="col-span-2 flex items-center justify-between border-t pt-4">
          <p className="font-medium">Estimated subtotal</p>
          <p className="font-medium">{formatCurrency(cart.subtotal)}</p>
        </div>
        <p className="col-span-2 -mt-2 text-xs text-neutral-500">
          Final prices, shipping and tax are confirmed when you place the order. Payment is collected on delivery.
        </p>

        {error && (
          <div className="col-span-2 text-sm text-red-600">
            <p>{error}</p>
            {itemErrors.map(([key, messages]) => (
              <p key={key}>{messages[0]}</p>
            ))}
          </div>
        )}

        <Button type="submit" className="col-span-2" disabled={placeOrder.isPending}>
          Place order
        </Button>
      </form>
    </div>
  );
}
