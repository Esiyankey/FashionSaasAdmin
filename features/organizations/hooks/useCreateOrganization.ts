import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationKeys } from "@/services/queries/query-keys";
import { createOrganization } from "../services/organization.service";

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  });
}
