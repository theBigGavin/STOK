/**
 * 基础API请求封装
 * 提供统一的HTTP请求接口，包含请求/响应拦截器
 */

import type { APIResponse } from '~/types/api';

// API配置接口
interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// 请求选项接口
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

// API响应错误接口
interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: unknown;
}

/**
 * API服务类
 */
class ApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };
  }

  /**
   * 创建请求实例
   */
  private createRequest() {
    return $fetch.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
      onRequest: ({ request, options }) => {
        // 请求拦截器
        console.log('API Request:', options.method, request);

        // 可以在这里添加认证token等
        // const token = useCookie('auth-token')
        // if (token.value) {
        //   options.headers = {
        //     ...options.headers,
        //     Authorization: `Bearer ${token.value}`
        //   }
        // }
      },
      onRequestError: ({ error }) => {
        // 请求错误处理
        console.error('API Request Error:', error);
        throw this.createApiError(error, '网络请求失败');
      },
      onResponse: ({ response }) => {
        // 响应拦截器 - 检查HTTP状态码
        if (response.status >= 400) {
          throw this.createApiError(
            response,
            `API Error: ${response.status} ${response.statusText}`
          );
        }
      },
      onResponseError: ({ error }) => {
        // 响应错误处理
        console.error('API Response Error:', error);
        throw this.createApiError(error, '服务器响应错误');
      },
    });
  }

  /**
   * 创建API错误对象
   */
  private createApiError(error: unknown, defaultMessage: string): ApiError {
    // 类型守卫函数，检查错误对象是否有特定属性
    const hasMessage = (err: unknown): err is { message: string } =>
      typeof err === 'object' && err !== null && 'message' in err;

    const hasStatus = (err: unknown): err is { status: number } =>
      typeof err === 'object' && err !== null && 'status' in err;

    const hasStatusText = (err: unknown): err is { statusText: string } =>
      typeof err === 'object' && err !== null && 'statusText' in err;

    const hasData = (err: unknown): err is { data: unknown } =>
      typeof err === 'object' && err !== null && 'data' in err;

    const message = hasMessage(error) ? error.message : defaultMessage;
    const apiError: ApiError = new Error(message);

    if (hasStatus(error)) {
      apiError.status = error.status;
    }

    if (hasStatusText(error)) {
      apiError.statusText = error.statusText;
    }

    if (hasData(error)) {
      apiError.data = error.data;
    }

    return apiError;
  }

  /**
   * 发送HTTP请求
   */
  async request<T = unknown>(url: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    const request = this.createRequest();

    const response = await request<APIResponse<T>>(url, {
      method: options.method || 'GET',
      params: options.params,
      body: options.body,
      headers: options.headers,
      timeout: options.timeout,
    });

    return response;
  }

  /**
   * GET请求
   */
  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<APIResponse<T>> {
    return this.request<T>(url, { method: 'GET', params });
  }

  /**
   * POST请求
   */
  async post<T = unknown>(url: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>(url, { method: 'POST', body });
  }

  /**
   * PUT请求
   */
  async put<T = unknown>(url: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body });
  }

  /**
   * DELETE请求
   */
  async delete<T = unknown>(url: string): Promise<APIResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  /**
   * PATCH请求
   */
  async patch<T = unknown>(url: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body });
  }
}

// 创建全局API实例
const apiService = new ApiService({
  baseURL: 'http://localhost:8099/api/v1',
  timeout: 30000,
});

/**
 * 使用API服务
 */
export const useApi = () => {
  return {
    request: apiService.request.bind(apiService),
    get: apiService.get.bind(apiService),
    post: apiService.post.bind(apiService),
    put: apiService.put.bind(apiService),
    delete: apiService.delete.bind(apiService),
    patch: apiService.patch.bind(apiService),
  };
};

// 导出API服务实例
export default apiService;
