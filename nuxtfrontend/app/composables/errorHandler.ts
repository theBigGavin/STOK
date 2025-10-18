/**
 * 错误处理机制
 * 提供统一的API错误处理和用户提示
 */

// API错误类型
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: unknown;
  code?: string;
}

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 错误处理器类
 */
class ErrorHandler {
  /**
   * 获取错误类型
   */
  private getErrorType(error: unknown): ErrorType {
    if (!error) return ErrorType.UNKNOWN;

    // 类型守卫函数
    const hasName = (err: unknown): err is { name: string } =>
      typeof err === 'object' && err !== null && 'name' in err;

    const hasMessage = (err: unknown): err is { message: string } =>
      typeof err === 'object' && err !== null && 'message' in err;

    const hasStatus = (err: unknown): err is { status: number } =>
      typeof err === 'object' && err !== null && 'status' in err;

    // 网络错误
    if ((hasName(error) && error.name === 'FetchError') ||
      (hasMessage(error) && error.message?.includes('network'))) {
      return ErrorType.NETWORK_ERROR;
    }

    // 超时错误
    if ((hasName(error) && error.name === 'TimeoutError') ||
      (hasMessage(error) && error.message?.includes('timeout'))) {
      return ErrorType.TIMEOUT;
    }

    // HTTP状态码错误
    if (hasStatus(error)) {
      switch (error.status) {
        case 400:
          return ErrorType.VALIDATION_ERROR;
        case 401:
        case 403:
          return ErrorType.AUTH_ERROR;
        case 404:
          return ErrorType.NOT_FOUND;
        case 500:
        case 502:
        case 503:
          return ErrorType.SERVER_ERROR;
        default:
          return ErrorType.SERVER_ERROR;
      }
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * 获取用户友好的错误消息
   */
  private getFriendlyMessage(errorType: ErrorType, error?: unknown): string {
    const messages = {
      [ErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [ErrorType.SERVER_ERROR]: '服务器内部错误，请稍后重试',
      [ErrorType.VALIDATION_ERROR]: '请求参数错误，请检查输入',
      [ErrorType.AUTH_ERROR]: '认证失败，请重新登录',
      [ErrorType.NOT_FOUND]: '请求的资源不存在',
      [ErrorType.TIMEOUT]: '请求超时，请稍后重试',
      [ErrorType.UNKNOWN]: '未知错误，请稍后重试',
    };

    // 类型守卫检查error.data.message
    const hasDataMessage = (err: unknown): err is { data: { message: string } } => {
      if (typeof err !== 'object' || err === null) return false;
      if (!('data' in err)) return false;

      const data = (err as { data: unknown }).data;
      if (typeof data !== 'object' || data === null) return false;

      return 'message' in data && typeof (data as { message: unknown }).message === 'string';
    };

    // 如果有服务器返回的具体错误消息，优先使用
    if (hasDataMessage(error)) {
      return error.data.message;
    }

    return messages[errorType] || messages[ErrorType.UNKNOWN];
  }

  /**
   * 显示错误提示
   */
  private showErrorToast(message: string, type: 'error' | 'warning' = 'error') {
    // 使用Nuxt UI的toast组件
    const toast = useToast();

    toast.add({
      title: type === 'error' ? '错误' : '警告',
      description: message,
      color: type === 'error' ? 'error' : 'warning',
    });
  }

  /**
   * 处理API错误
   */
  handleApiError(error: unknown, showToast: boolean = true): ApiError {
    console.error('API Error:', error);

    const errorType = this.getErrorType(error);
    const friendlyMessage = this.getFriendlyMessage(errorType, error);

    // 创建标准化的错误对象
    const apiError: ApiError = new Error(friendlyMessage);

    // 类型守卫函数
    const hasStatus = (err: unknown): err is { status: number } =>
      typeof err === 'object' && err !== null && 'status' in err;

    const hasStatusText = (err: unknown): err is { statusText: string } =>
      typeof err === 'object' && err !== null && 'statusText' in err;

    const hasData = (err: unknown): err is { data: unknown } =>
      typeof err === 'object' && err !== null && 'data' in err;

    if (hasStatus(error)) {
      apiError.status = error.status;
    }

    if (hasStatusText(error)) {
      apiError.statusText = error.statusText;
    }

    if (hasData(error)) {
      apiError.data = error.data;
    }

    apiError.code = errorType;

    // 显示用户提示
    if (showToast) {
      const toastType = errorType === ErrorType.VALIDATION_ERROR ? 'warning' : 'error';
      this.showErrorToast(friendlyMessage, toastType);
    }

    // 根据错误类型执行特定操作
    switch (errorType) {
      case ErrorType.AUTH_ERROR:
        // 认证错误，可以跳转到登录页
        // navigateTo('/login')
        break;
      case ErrorType.NETWORK_ERROR:
        // 网络错误，可以显示重试按钮
        break;
      default:
        break;
    }

    return apiError;
  }

  /**
   * 处理业务逻辑错误
   */
  handleBusinessError(message: string, showToast: boolean = true): void {
    console.error('Business Error:', message);

    if (showToast) {
      this.showErrorToast(message, 'warning');
    }
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error: unknown, showToast: boolean = true): ApiError {
    const networkError: ApiError = new Error('网络连接失败');
    networkError.code = ErrorType.NETWORK_ERROR;

    if (showToast) {
      this.showErrorToast('网络连接失败，请检查网络设置', 'error');
    }

    return networkError;
  }

  /**
   * 处理超时错误
   */
  handleTimeoutError(error: unknown, showToast: boolean = true): ApiError {
    const timeoutError: ApiError = new Error('请求超时');
    timeoutError.code = ErrorType.TIMEOUT;

    if (showToast) {
      this.showErrorToast('请求超时，请稍后重试', 'error');
    }

    return timeoutError;
  }

  /**
   * 检查是否为特定类型的错误
   */
  isErrorType(error: unknown, errorType: ErrorType): boolean {
    if (error instanceof Error && 'code' in error) {
      return (error as ApiError).code === errorType;
    }
    return false;
  }
}

// 创建全局错误处理器实例
const errorHandler = new ErrorHandler();

/**
 * 使用错误处理器
 */
export const useErrorHandler = () => {
  return {
    handleApiError: errorHandler.handleApiError.bind(errorHandler),
    handleBusinessError: errorHandler.handleBusinessError.bind(errorHandler),
    handleNetworkError: errorHandler.handleNetworkError.bind(errorHandler),
    handleTimeoutError: errorHandler.handleTimeoutError.bind(errorHandler),
    isErrorType: errorHandler.isErrorType.bind(errorHandler),
    ErrorType,
  };
};

// 导出错误处理器实例
export default errorHandler;
