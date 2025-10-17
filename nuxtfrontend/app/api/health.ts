/**
 * 健康检查API服务
 * 提供系统状态监控、服务健康检查、性能指标等功能
 */

import type { 
  APIResponse 
} from '~/types/api'

// 健康检查响应类型
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      responseTime?: number
      message?: string
      lastChecked: string
    }
  }
  system: {
    uptime: number
    memoryUsage: number
    cpuUsage?: number
    diskUsage?: number
  }
  version: string
}

// 性能指标类型
interface PerformanceMetrics {
  timestamp: string
  metrics: {
    requestCount: number
    errorCount: number
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    activeConnections: number
    memoryUsage: number
    cpuUsage: number
  }
  endpoints: {
    [endpoint: string]: {
      requestCount: number
      errorCount: number
      averageResponseTime: number
    }
  }
}

// 系统信息类型
interface SystemInfo {
  version: string
  environment: string
  startTime: string
  uptime: number
  dependencies: {
    [name: string]: {
      version: string
      status: 'ok' | 'warning' | 'error'
    }
  }
  configuration: {
    database: {
      type: string
      connected: boolean
    }
    redis: {
      connected: boolean
    }
    cache: {
      enabled: boolean
      size: number
    }
  }
}

// 日志级别类型
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 日志条目类型
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  service?: string
}

/**
 * 健康检查API服务
 */
export const healthApi = {
  /**
   * 基础健康检查
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<HealthCheckResponse>('/health', {
        method: 'GET'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 详细健康检查
   */
  async checkHealthDetailed(): Promise<HealthCheckResponse> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<HealthCheckResponse>('/health/detailed', {
        method: 'GET'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 检查数据库连接
   */
  async checkDatabase(): Promise<{ status: 'connected' | 'disconnected'; message: string }> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<{ status: 'connected' | 'disconnected'; message: string }>('/health/database', {
        method: 'GET'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 检查Redis连接
   */
  async checkRedis(): Promise<{ status: 'connected' | 'disconnected'; message: string }> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<{ status: 'connected' | 'disconnected'; message: string }>('/health/redis', {
        method: 'GET'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<PerformanceMetrics>('/health/metrics', {
        method: 'GET'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 获取系统信息
   */
  async getSystemInfo(): Promise<SystemInfo> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<SystemInfo>('/health/system', {
        method: 'GET'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 获取应用日志
   */
  async getLogs(
    level?: LogLevel,
    service?: string,
    limit: number = 100,
    startTime?: string,
    endTime?: string
  ): Promise<LogEntry[]> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<LogEntry[]>('/health/logs', {
        method: 'GET',
        params: {
          level,
          service,
          limit,
          start_time: startTime,
          end_time: endTime
        }
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 清除应用缓存
   */
  async clearCache(): Promise<{ success: boolean; cleared: string[]; message: string }> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<{ success: boolean; cleared: string[]; message: string }>('/health/cache/clear', {
        method: 'POST'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 重启服务
   */
  async restartService(service: string): Promise<{ success: boolean; message: string }> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<{ success: boolean; message: string }>(`/health/restart/${service}`, {
        method: 'POST'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 获取依赖状态
   */
  async getDependencies(): Promise<SystemInfo['dependencies']> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<SystemInfo['dependencies']>('/health/dependencies', {
        method: 'GET'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 获取配置信息
   */
  async getConfiguration(): Promise<SystemInfo['configuration']> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<SystemInfo['configuration']>('/health/configuration', {
        method: 'GET'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * 性能测试
   */
  async runPerformanceTest(): Promise<{
    success: boolean;
    results: {
      averageResponseTime: number;
      requestsPerSecond: number;
      errorRate: number;
      throughput: number;
    };
    message: string;
  }> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<{
        success: boolean;
        results: {
          averageResponseTime: number;
          requestsPerSecond: number;
          errorRate: number;
          throughput: number;
        };
        message: string;
      }>('/health/performance-test', {
        method: 'POST'
      })
      
      if (!response.data) {
        throw new Error('API响应数据为空')
      }
      
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }
}

/**
 * 带缓存的健康检查API服务
 */
export const useCachedHealthApi = () => {
  const { cachedGet, clearApiCache } = useCachedApi()

  return {
    /**
     * 基础健康检查（带缓存）
     */
    async checkHealth(ttl: number = 30 * 1000): Promise<HealthCheckResponse> {
      const cacheKey = 'health:basic'
      return cachedGet<HealthCheckResponse>('/health', undefined, cacheKey, ttl)
    },

    /**
     * 获取系统信息（带缓存）
     */
    async getSystemInfo(ttl: number = 5 * 60 * 1000): Promise<SystemInfo> {
      const cacheKey = 'health:system-info'
      return cachedGet<SystemInfo>('/health/system', undefined, cacheKey, ttl)
    },

    /**
     * 获取依赖状态（带缓存）
     */
    async getDependencies(ttl: number = 10 * 60 * 1000): Promise<SystemInfo['dependencies']> {
      const cacheKey = 'health:dependencies'
      return cachedGet<SystemInfo['dependencies']>('/health/dependencies', undefined, cacheKey, ttl)
    },

    /**
     * 获取配置信息（带缓存）
     */
    async getConfiguration(ttl: number = 10 * 60 * 1000): Promise<SystemInfo['configuration']> {
      const cacheKey = 'health:configuration'
      return cachedGet<SystemInfo['configuration']>('/health/configuration', undefined, cacheKey, ttl)
    },

    /**
     * 清除健康检查缓存
     */
    clearHealthCache(): void {
      clearApiCache('health')
    }
  }
}

/**
 * 组合API和错误处理的工具函数
 */
const useApiWithErrorHandler = () => {
  const { request } = useApi()
  const { handleApiError } = useErrorHandler()

  return {
    request,
    handleApiError
  }
}

// 导出默认的健康检查API服务
export default healthApi