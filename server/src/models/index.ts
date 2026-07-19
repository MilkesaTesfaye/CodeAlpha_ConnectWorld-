// ─── Shared Types for Server-side Models ─────────────────────────────────────

/**
 * Standardized API response wrapper.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Paginated request query params.
 */
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Date range filter.
 */
export interface DateRange {
  from?: string;
  to?: string;
}

/**
 * Generic search/filter params.
 */
export interface FilterParams {
  search?: string;
  status?: string;
  dateRange?: DateRange;
}

/**
 * File upload result.
 */
export interface FileUploadResult {
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
  originalName: string;
}

/**
 * Audience targeting for broadcasts.
 */
export interface BroadcastTarget {
  roles?: string[];
  specificUserIds?: string[];
  excludeUserIds?: string[];
}
