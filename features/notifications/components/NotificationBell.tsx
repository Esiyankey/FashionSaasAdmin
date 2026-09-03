"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "../hooks/useNotifications";
import { formatRelativeTime } from "@/utils/format";
import { useAuth } from "@/contexts/auth-context";

export function NotificationBell() {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  if (user?.role !== "ORGANIZATION_ADMIN") return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[0.65rem]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
        </div>
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <BellOff className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="flex gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/50">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary"}`}
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.description}</p>
                  <p className="text-xs text-muted-foreground/70">{formatRelativeTime(notification.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
