import type { PaginatedResult } from "@/types/common";

export type OrderStatus = "PENDING" | "PROCESSING" | "FULFILLED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderCustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface OrderShippingAddress {
  name: string;
  email: string;
  phone: string | null;
  address: Record<string, unknown>;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: OrderCustomerSummary;
  shippingAddress: OrderShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderQueryParams {
  search: string;
  status: OrderStatus | "all";
  paymentStatus: PaymentStatus | "all";
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

export type OrderListResult = PaginatedResult<Order>;

export interface UpdateOrderStatusInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}
