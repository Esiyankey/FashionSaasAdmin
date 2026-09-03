"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useSidebar } from "@/contexts/sidebar-context";
import { UserMenu } from "./UserMenu";

export function Header() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
      >
        <Menu />
      </Button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <UserMenu />
      </div>
    </header>
  );
}
