/**
 * Pagination helper for list endpoints.
 * Parses query params and provides consistent offset/limit calculations.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from request query.
 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(DEFAULT_PAGE, parseInt(query.page as string, 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit as string, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination metadata.
 */
export function createPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
