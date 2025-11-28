export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  success: boolean;
  message: string;
  timestamp: string;
  meta: PaginationMeta;
}

export interface StandardResponse<T> {
  data: T | T[];
  success: boolean;
  message: string;
  timestamp: string;
}

