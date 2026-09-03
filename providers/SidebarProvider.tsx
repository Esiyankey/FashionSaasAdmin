"use client";

import { useState, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { SidebarContext, type SidebarContextValue } from "@/contexts/sidebar-context";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage("admin_sidebar_collapsed", false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const value: SidebarContextValue = {
    isCollapsed,
    toggleCollapsed: () => setIsCollapsed(!isCollapsed),
    isMobileOpen,
    setMobileOpen,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
