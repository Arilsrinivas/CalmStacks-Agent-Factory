/**
 * CalmStacks Data Transfer Type Definitions
 * Shared between Frontend, Backend, AI/ML, and QA agents.
 */

export interface SystemMetadataPayload {
  id: string;
  keyName: string;
  valuePayload: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponseEnvelope<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  timestamp: string;
}
