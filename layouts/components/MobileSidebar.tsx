"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/assets/icons/logo";
import { useSidebar } from "@/contexts/sidebar-context";
import { SidebarNav } from "./SidebarNav";

export function MobileSidebar() {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-4">
          <SheetTitle asChild>
            <span>
              <Logo />
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
