import { useQuery } from "@tanstack/react-query";
import { notificationKeys } from "@/services/queries/query-keys";
import { getNotifications } from "../services/notification.service";
import { useAuth } from "@/contexts/auth-context";

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getNotifications,
    enabled: user?.role === "ORGANIZATION_ADMIN",
  });
}
