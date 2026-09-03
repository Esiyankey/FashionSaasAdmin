"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Logo } from "@/assets/icons/logo";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./SidebarNav";

export function Sidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        isCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center overflow-hidden border-b border-sidebar-border px-4", isCollapsed && "justify-center px-2")}>
        <Logo size={isCollapsed ? "sm" : "md"} />
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav collapsed={isCollapsed} />
      </div>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          className="w-full justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </Button>
      </div>
    </aside>
  );
}
