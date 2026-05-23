/**
 * Severity levels for drug-drug interactions.
 * Maps from TDC's 86 interaction types (Y: 0-85) to 4 clinical categories.
 */
export enum SeverityLevel {
  MAJOR = 'major',
  MODERATE = 'moderate',
  MINOR = 'minor',
  UNKNOWN = 'unknown',
}

/**
 * Standard API response wrapper.
 * All endpoints return this shape for consistency.
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly meta?: ResponseMeta;
  readonly error?: ResponseError;
}

export interface ResponseMeta {
  readonly total?: number;
  readonly page?: number;
  readonly limit?: number;
  readonly took?: number; // query time in ms
}

export interface ResponseError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}
