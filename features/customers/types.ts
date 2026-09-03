import type { Order } from "@/features/orders/types";
import type { PaginatedResult } from "@/types/common";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: Record<string, unknown> | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface CustomerDetail extends Customer {
  orders: Order[];
}

export interface CustomerQueryParams {
  search: string;
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

export type CustomerListResult = PaginatedResult<Customer>;
