import { useQuery } from "@tanstack/react-query";
import { organizationKeys } from "@/services/queries/query-keys";
import { getOrganizations } from "../services/organization.service";

export function useOrganizations() {
  return useQuery({ queryKey: organizationKeys.list(), queryFn: getOrganizations });
}
