import { useQuery } from "@tanstack/react-query";
import { authKeys } from "@/services/queries/query-keys";
import { getCurrentUser } from "../services/auth.service";

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: getCurrentUser,
  });
}
