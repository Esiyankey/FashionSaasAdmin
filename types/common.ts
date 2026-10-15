export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface ApiErrorShape {
  message: string;
  status: number;
  code?: string;
  /** Per-field validation messages, keyed by dotted path (e.g. `shippingAddress.city`). */
  fieldErrors?: Record<string, string[]>;
}
