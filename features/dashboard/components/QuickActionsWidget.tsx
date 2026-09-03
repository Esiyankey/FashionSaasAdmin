"use client";

import { useRouter } from "next/navigation";
import { Package, ShoppingCart, Tags, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActionsWidget() {
  const router = useRouter();
  const actions = [
    { label: "Add product", icon: Package, href: "/products/new" },
    { label: "View orders", icon: ShoppingCart, href: "/orders" },
    { label: "Manage categories", icon: Tags, href: "/categories" },
    { label: "View customers", icon: Users, href: "/customers" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => router.push(action.href)}
          >
            <action.icon className="size-4" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
