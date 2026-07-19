import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Custom application error with HTTP status code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler middleware.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown[] | undefined;

  logger.error(`[${err.name}] ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    errors = err.issues.map((issue: ZodIssue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    switch (err.code) {
      case 'P2002':
        message = 'A record with this value already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        message = 'Referenced record not found';
        break;
      default:
        message = 'Database error';
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 handler for unknown routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}
