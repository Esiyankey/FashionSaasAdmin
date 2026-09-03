import type { ReactNode } from "react";
import { Logo } from "@/assets/icons/logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">{children}</div>
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Fashion SaaS. All rights reserved.
        </p>
      </div>
      <div className="relative hidden flex-col justify-end overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--sidebar-accent),transparent_60%)]"
        />
        <blockquote className="relative z-10 space-y-3">
          <p className="font-heading text-2xl leading-relaxed">
            &ldquo;Everything I need to run my stores — inventory, orders, and staff — in one place.&rdquo;
          </p>
          <footer className="text-sm text-sidebar-foreground/70">
            Store owner, Fashion SaaS
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
