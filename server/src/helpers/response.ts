import { Response } from 'express';

/**
 * Standard API response formats.
 * Ensures consistent response shape across all endpoints.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Send a success response.
 */
export function sendSuccess<T>(res: Response, data?: T, message?: string, statusCode = 200): void {
  const body: ApiResponse<T> = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
}

/**
 * Send a paginated success response.
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): void {
  res.status(200).json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Send an error response.
 */
export function sendError(res: Response, statusCode: number, message: string, errors?: unknown[]): void {
  const body: ApiResponse = { success: false, message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}
