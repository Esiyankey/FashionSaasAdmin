import { apiClient } from "@/services/http-client";
import type { Notification } from "../types";

export function getNotifications(): Promise<Notification[]> {
  return apiClient.get<Notification[]>("/admin/notifications");
}
