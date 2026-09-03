export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ApiErrorShape {
  message: string;
  status: number;
  code?: string;
}
