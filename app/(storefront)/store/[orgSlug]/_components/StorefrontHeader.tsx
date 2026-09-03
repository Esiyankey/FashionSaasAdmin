"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";

interface StorefrontHeaderProps {
  orgSlug: string;
  storeName: string;
  logoUrl?: string | null;
}

export function StorefrontHeader({ orgSlug, storeName, logoUrl }: StorefrontHeaderProps) {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href={`/store/${orgSlug}`} className="flex items-center gap-2 font-semibold">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="size-8 rounded object-cover" />
          ) : null}
          {storeName}
        </Link>
        <Link href={`/store/${orgSlug}/cart`} className="relative flex items-center gap-2 text-sm font-medium">
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
