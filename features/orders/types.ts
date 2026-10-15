import type { PaginatedResult } from "@/types/common";

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export interface OrderItem {
  id: string;
  productId: string | null;
  productSlug: string | null;
  variantId: string | null;
  productName: string;
  variantTitle: string | null;
  sku: string | null;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  compareAtPrice: number | null;
  discount: number;
  total: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  changedBy: { id: string; name: string } | null;
  createdAt: string;
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
  paymentMethod: string;
  currency: string;
  customer: OrderCustomerSummary;
  shippingAddress: OrderShippingAddress;
  billingAddress: Record<string, unknown> | null;
  customerNote: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  internalNotes: string | null;
  statusHistory: OrderStatusHistoryEntry[];
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
  note?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  cancelReason?: string;
  internalNotes?: string | null;
}
