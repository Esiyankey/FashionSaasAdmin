import { useQuery } from "@tanstack/react-query";
import { platformKeys } from "@/services/queries/query-keys";
import { getPlatformSummary } from "../services/platform.service";

export function usePlatformSummary() {
  return useQuery({ queryKey: platformKeys.summary(), queryFn: getPlatformSummary });
}
