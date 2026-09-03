import { apiClient } from "@/services/http-client";
import type { Order, OrderListResult, OrderQueryParams, UpdateOrderStatusInput } from "../types";

export function getOrders(params: OrderQueryParams): Promise<OrderListResult> {
  return apiClient.get<OrderListResult>("/admin/orders", { params });
}

export function getOrder(id: string): Promise<Order> {
  return apiClient.get<Order>(`/admin/orders/${id}`);
}

export function updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<Order> {
  return apiClient.patch<Order>(`/admin/orders/${id}`, { body: input });
}
