import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../helpers/response';

/**
 * Base controller class providing standardized response methods.
 */
export class BaseController {
  protected ok<T>(res: Response, data?: T, message?: string) {
    sendSuccess(res, data, message);
  }

  protected created<T>(res: Response, data?: T, message = 'Created successfully') {
    sendSuccess(res, data, message, 201);
  }

  protected noContent(res: Response) {
    res.status(204).send();
  }

  protected badRequest(res: Response, message: string) {
    sendError(res, 400, message);
  }

  protected unauthorized(res: Response, message = 'Unauthorized') {
    sendError(res, 401, message);
  }

  protected forbidden(res: Response, message = 'Forbidden') {
    sendError(res, 403, message);
  }

  protected notFound(res: Response, message = 'Not found') {
    sendError(res, 404, message);
  }

  protected conflict(res: Response, message: string) {
    sendError(res, 409, message);
  }

  protected handleError(res: Response, error: unknown) {
    if (error instanceof Error) {
      sendError(res, 500, error.message);
    } else {
      sendError(res, 500, 'Internal server error');
    }
  }
}

/**
 * Async handler wrapper to avoid try-catch repetition in controllers.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
