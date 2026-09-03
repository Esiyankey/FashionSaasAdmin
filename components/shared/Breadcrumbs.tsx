"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { NAV_SECTIONS } from "@/constants/nav";
import { ROUTES } from "@/constants/routes";
import type { BreadcrumbItem } from "@/types/navigation";

function resolveLabel(segment: string): string {
  for (const section of NAV_SECTIONS) {
    const match = section.items.find((item) => item.href === `/${segment}`);
    if (match) return match.label;
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    label: resolveLabel(segment),
    href: index < segments.length - 1 ? `/${segments.slice(0, index + 1).join("/")}` : undefined,
  }));
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const items = buildBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href={ROUTES.dashboard} className="flex items-center hover:text-foreground">
        <Home className="size-3.5" />
      </Link>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
