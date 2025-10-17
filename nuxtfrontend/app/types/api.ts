/**
 * API响应类型定义
 */

export interface APIResponse<T = any> {
  data?: T;
  message: string;
  status: "success" | "error";
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}