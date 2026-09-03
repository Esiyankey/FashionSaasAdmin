import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  ShoppingCart,
  Users,
  Settings,
  Building2,
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
    title: "Workspace",
    items: [{ label: "Settings", href: "/settings", icon: Settings, roles: ["ORGANIZATION_ADMIN"] }],
  },
];
