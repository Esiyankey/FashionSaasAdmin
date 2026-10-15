import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  ShoppingCart,
  Users,
  Settings,
  Building2,
  LayoutTemplate,
  Newspaper,
  Inbox,
  MailPlus,
  Sparkles,
  Images,
} from "lucide-react";
import type { NavSection } from "@/types/navigation";
import { ROUTES } from "@/constants/routes";

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard }],
  },
  {
    title: "Platform",
    items: [{ label: "Organizations", href: ROUTES.organizations, icon: Building2, roles: ["SUPER_ADMIN"] }],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package, roles: ["ORGANIZATION_ADMIN"] },
      { label: "Categories", href: "/categories", icon: Tags, roles: ["ORGANIZATION_ADMIN"] },
      { label: "Inventory", href: "/inventory", icon: Boxes, roles: ["ORGANIZATION_ADMIN"] },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingCart, roles: ["ORGANIZATION_ADMIN"] },
      { label: "Customers", href: "/customers", icon: Users, roles: ["ORGANIZATION_ADMIN"] },
    ],
  },
  {
    title: "Storefront",
    items: [
      { label: "Content", href: "/content", icon: LayoutTemplate, roles: ["ORGANIZATION_ADMIN"] },
      { label: "Blog", href: "/blog", icon: Newspaper, roles: ["ORGANIZATION_ADMIN"] },
      { label: "Outfit Finder", href: "/outfit-finder", icon: Sparkles, roles: ["ORGANIZATION_ADMIN"] },
      { label: "Media", href: "/media-library", icon: Images, roles: ["ORGANIZATION_ADMIN"] },
    ],
  },
  {
    title: "Customers",
    items: [
      { label: "Inbox", href: "/inbox", icon: Inbox, roles: ["ORGANIZATION_ADMIN"] },
      { label: "Subscribers", href: "/subscribers", icon: MailPlus, roles: ["ORGANIZATION_ADMIN"] },
    ],
  },
  {
    title: "Workspace",
    items: [{ label: "Settings", href: "/settings", icon: Settings, roles: ["ORGANIZATION_ADMIN"] }],
  },
];
