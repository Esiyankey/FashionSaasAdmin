import { useQuery } from "@tanstack/react-query";
import { organizationKeys } from "@/services/queries/query-keys";
import { getOrganization } from "../services/organization.service";

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => getOrganization(id),
    enabled: Boolean(id),
  });
}
