"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getStorefrontProducts } from "@/features/storefront/services/storefront.service";
import { useCart } from "./_components/CartProvider";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";

export default function StorefrontHomePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const [page, setPage] = useState(1);
  const cart = useCart();

  const { data, isLoading } = useQuery({
    queryKey: ["storefront-products", orgSlug, page],
    queryFn: () => getStorefrontProducts(orgSlug, { page, pageSize: 12 }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight">New arrivals</h1>
        <p className="mt-2 text-neutral-500">Shop the latest collection.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading products…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-neutral-500">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {data.items.map((product) => (
            <div key={product.id} className="flex flex-col gap-2">
              <Link href={`/store/${orgSlug}/products/${product.slug}`} className="block aspect-square overflow-hidden rounded-lg bg-neutral-100">
                {product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0].url} alt={product.title} className="size-full object-cover transition-transform hover:scale-105" />
                )}
              </Link>
              <Link href={`/store/${orgSlug}/products/${product.slug}`} className="text-sm font-medium hover:underline">
                {product.title}
              </Link>
              <p className="text-sm text-neutral-500">{formatCurrency(product.price)}</p>
              {product.variants.length === 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    cart.addItem({
                      productId: product.id,
                      title: product.title,
                      imageUrl: product.images[0]?.url,
                      price: product.price,
                      quantity: 1,
                    })
                  }
                >
                  Add to cart
                </Button>
              ) : (
                <Link href={`/store/${orgSlug}/products/${product.slug}`}>
                  <Button size="sm" variant="outline" className="w-full">
                    Select options
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.total > 12 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page * 12 >= data.total} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
