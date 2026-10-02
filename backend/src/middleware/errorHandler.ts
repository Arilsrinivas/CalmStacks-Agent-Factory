import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from './response.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(createErrorResponse(err.code, err.message, err.details));
    return;
  }

  // Handle SyntaxError for bad JSON in request body
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(400).json(createErrorResponse('BAD_REQUEST', 'Malformed JSON in request body'));
    return;
  }

  // Unhandled internal server error
  console.error('[UNHANDLED_ERROR]', err);
  res.status(500).json(
    createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    )
  );
}
