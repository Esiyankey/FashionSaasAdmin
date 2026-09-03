import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  /** Restricts visibility to these roles. Omit to show to every role. */
  roles?: ("SUPER_ADMIN" | "ORGANIZATION_ADMIN")[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
