import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsKeys, storefrontConfigKeys } from "@/services/queries/query-keys";
import {
  getSettings,
  getStorefrontConfig,
  updateSettings,
  updateStorefrontConfig,
} from "../services/settings.service";
import type { UpdateOrganizationSettingsInput, UpdateStorefrontConfigInput } from "../types";

export function useSettings() {
  return useQuery({ queryKey: settingsKeys.detail(), queryFn: getSettings });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrganizationSettingsInput) => updateSettings(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}

export function useStorefrontConfig() {
  return useQuery({ queryKey: storefrontConfigKeys.detail(), queryFn: getStorefrontConfig });
}

export function useUpdateStorefrontConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStorefrontConfigInput) => updateStorefrontConfig(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storefrontConfigKeys.all }),
  });
}
