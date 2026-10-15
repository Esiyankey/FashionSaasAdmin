import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getStorefrontHome } from "@/lib/server/storefront";
import { CartProvider } from "./_components/CartProvider";
import { StorefrontHeader } from "./_components/StorefrontHeader";
import { StorefrontFooter } from "./_components/StorefrontFooter";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  // Same-origin render, so uploaded media can stay relative ("/media/...").
  const home = await getStorefrontHome(orgSlug, "").catch(() => null);
  if (!home) notFound();

  const storeName = home.store.name;
  const logoUrl = home.store.logoUrl;

  return (
    <CartProvider orgSlug={orgSlug}>
      <div className="flex min-h-screen flex-col bg-white text-neutral-900">
        <StorefrontHeader orgSlug={orgSlug} storeName={storeName} logoUrl={logoUrl} />
        <main className="flex-1">{children}</main>
        <StorefrontFooter
          storeName={storeName}
          footerText={home.store.footerText}
          contactEmail={home.contact.email}
        />
      </div>
    </CartProvider>
  );
}
