import { apiClient } from "@/services/http-client";
import type { CustomerDetail, CustomerListResult, CustomerQueryParams } from "../types";

export function getCustomers(params: CustomerQueryParams): Promise<CustomerListResult> {
  return apiClient.get<CustomerListResult>("/admin/customers", { params });
}

export function getCustomer(id: string): Promise<CustomerDetail> {
  return apiClient.get<CustomerDetail>(`/admin/customers/${id}`);
}
