import { ApiResponseEnvelope, ApiErrorDetail } from '../types/index.js';

export function createSuccessResponse<T>(data: T): ApiResponseEnvelope<T> {
  return {
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponseEnvelope<null> {
  const error: ApiErrorDetail = {
    code,
    message,
    ...(details ? { details } : {}),
  };

  return {
    data: null,
    error,
    timestamp: new Date().toISOString(),
  };
}
