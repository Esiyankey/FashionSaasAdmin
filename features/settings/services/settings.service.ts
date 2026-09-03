import { apiClient } from "@/services/http-client";
import type {
  OrganizationSettings,
  StorefrontConfig,
  UpdateOrganizationSettingsInput,
  UpdateStorefrontConfigInput,
} from "../types";

export function getSettings(): Promise<OrganizationSettings> {
  return apiClient.get<OrganizationSettings>("/admin/settings");
}

export function updateSettings(input: UpdateOrganizationSettingsInput): Promise<OrganizationSettings> {
  return apiClient.patch<OrganizationSettings>("/admin/settings", { body: input });
}

export function getStorefrontConfig(): Promise<StorefrontConfig> {
  return apiClient.get<StorefrontConfig>("/admin/storefront-config");
}

export function updateStorefrontConfig(input: UpdateStorefrontConfigInput): Promise<StorefrontConfig> {
  return apiClient.patch<StorefrontConfig>("/admin/storefront-config", { body: input });
}
