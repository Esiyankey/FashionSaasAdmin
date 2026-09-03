import { apiClient } from "@/services/http-client";
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationStatus,
  UpdateOrganizationInput,
} from "../types";

export function getOrganizations(): Promise<Organization[]> {
  return apiClient.get<Organization[]>("/admin/organizations");
}

export function getOrganization(id: string): Promise<Organization> {
  return apiClient.get<Organization>(`/admin/organizations/${id}`);
}

export function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  return apiClient.post<Organization>("/admin/organizations", { body: input });
}

export function updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
  return apiClient.patch<Organization>(`/admin/organizations/${id}`, { body: input });
}

export function setOrganizationStatus(id: string, status: OrganizationStatus): Promise<Organization> {
  return apiClient.patch<Organization>(`/admin/organizations/${id}/status`, { body: { status } });
}
