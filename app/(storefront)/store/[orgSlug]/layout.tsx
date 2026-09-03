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

  const home = await getStorefrontHome(orgSlug).catch(() => null);
  if (!home) notFound();

  const storeName = home.storefront?.storeName || home.organization.name;
  const logoUrl = home.storefront?.logoUrl ?? home.organization.logoUrl;

  return (
    <CartProvider orgSlug={orgSlug}>
      <div className="flex min-h-screen flex-col bg-white text-neutral-900">
        <StorefrontHeader orgSlug={orgSlug} storeName={storeName} logoUrl={logoUrl} />
        <main className="flex-1">{children}</main>
        <StorefrontFooter
          storeName={storeName}
          footerText={home.storefront?.footerText}
          contactEmail={home.storefront?.contactEmail ?? home.organization.contactEmail}
        />
      </div>
    </CartProvider>
  );
}
