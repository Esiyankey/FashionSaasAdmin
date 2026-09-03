"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notFound, useRouter } from "next/navigation";
import { getStorefrontProduct } from "@/features/storefront/services/storefront.service";
import { useCart } from "../../_components/CartProvider";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/services/http-client";

export default function StorefrontProductPage({ params }: { params: Promise<{ orgSlug: string; slug: string }> }) {
  const { orgSlug, slug } = use(params);
  const router = useRouter();
  const cart = useCart();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["storefront-product", orgSlug, slug],
    queryFn: () => getStorefrontProduct(orgSlug, slug),
    retry: false,
  });

  const selectedVariant = useMemo(() => {
    if (!product || product.variants.length === 0) return null;
    return product.variants.find((variant) =>
      variant.options.every((option) => selectedOptions[option.name] === option.value)
    );
  }, [product, selectedOptions]);

  if (error instanceof ApiError && error.status === 404) notFound();
  if (isLoading || !product) return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-500">Loading…</div>;

  const price = selectedVariant?.price ?? product.price;
  const image = product.images[0]?.url;
  const canAddToCart = product.variants.length === 0 || Boolean(selectedVariant);

  function handleAddToCart() {
    cart.addItem({
      productId: product!.id,
      variantId: selectedVariant?.id,
      title: product!.title,
      variantTitle: selectedVariant?.title,
      imageUrl: image,
      price,
      quantity,
    });
    router.push(`/store/${orgSlug}/cart`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.title} className="size-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{product.title}</h1>
            <p className="mt-1 text-lg text-neutral-600">{formatCurrency(price)}</p>
          </div>
          <p className="text-sm text-neutral-500">{product.description}</p>

          {product.variantOptionNames.map((optionName) => {
            const values = Array.from(
              new Set(
                product.variants.flatMap((variant) =>
                  variant.options.filter((o) => o.name === optionName).map((o) => o.value)
                )
              )
            );
            return (
              <div key={optionName}>
                <p className="mb-2 text-sm font-medium">{optionName}</p>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <button
                      key={value}
                      onClick={() => setSelectedOptions((current) => ({ ...current, [optionName]: value }))}
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        selectedOptions[optionName] === value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">Quantity</p>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                −
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button size="icon" variant="outline" onClick={() => setQuantity((q) => q + 1)}>
                +
              </Button>
            </div>
          </div>

          <Button disabled={!canAddToCart} onClick={handleAddToCart}>
            {canAddToCart ? "Add to cart" : "Select options"}
          </Button>
        </div>
      </div>
    </div>
  );
}
