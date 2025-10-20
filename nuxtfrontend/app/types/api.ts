/**
 * API响应类型定义
 */

export const APIStatus = {
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type APIStatus = typeof APIStatus[keyof typeof APIStatus];

export interface APIResponse<T = unknown> {
  data?: T;
  message: string;
  status: APIStatus;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ErrorResponse {
  message: string;
  status: 'error';
  timestamp: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface SuccessResponse<T = unknown> {
  data: T;
  message: string;
  status: 'success';
  timestamp: string;
}
