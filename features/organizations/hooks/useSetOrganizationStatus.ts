import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationKeys } from "@/services/queries/query-keys";
import { setOrganizationStatus } from "../services/organization.service";
import type { OrganizationStatus } from "../types";

export function useSetOrganizationStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: OrganizationStatus) => setOrganizationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
