import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "./PageHeader";

interface PageContainerProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageContainer({ title, description, actions, children, className }: PageContainerProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6 p-4 md:p-6", className)}>
      {(title || actions) && <PageHeader title={title ?? ""} description={description} actions={actions} />}
      {children}
    </div>
  );
}
