import type { ReactNode } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
