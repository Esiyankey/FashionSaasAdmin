import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { SidebarProvider } from "./SidebarProvider";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <SidebarProvider>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </SidebarProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
