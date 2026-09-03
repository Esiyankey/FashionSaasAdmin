"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/constants/nav";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || (user && item.roles.includes(user.role))),
  })).filter((section) => section.items.length > 0);

  return (
    <nav className="flex flex-col gap-4 px-2">
      {sections.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-1">
          {section.title && !collapsed && (
            <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              {section.title}
            </span>
          )}
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const link = (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                aria-disabled={item.disabled}
                onClick={(event) => {
                  if (item.disabled) event.preventDefault();
                  else onNavigate?.();
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                  !isActive && !item.disabled && "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  item.disabled && "cursor-not-allowed opacity-40",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && item.disabled && (
                  <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[0.625rem] text-sidebar-foreground/60">
                    Soon
                  </span>
                )}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
