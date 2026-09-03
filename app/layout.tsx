import type { Metadata } from "next";
import "./globals.css";
import { RootProviders } from "@/providers/RootProviders";

export const metadata: Metadata = {
  title: {
    default: "Fashion SaaS — Business Admin",
    template: "%s — Fashion SaaS Admin",
  },
  description: "Manage your store, products, orders, and team.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
