/**
 * 模型相关API服务
 * 提供机器学习模型管理、性能监控、权重配置等功能
 */

import type { 
  ModelInfo 
} from '~/types/models'
import type { 
  APIResponse,
  PaginatedResponse 
} from '~/types/api'

// 模型性能指标类型
interface ModelPerformance {
  modelId: number
  modelName: string
  metrics: {
    accuracy?: number
    precision?: number
    recall?: number
    f1Score?: number
    totalReturn?: number
    sharpeRatio?: number
    maxDrawdown?: number
    winRate?: number
  }
  lastUpdated: string
  dataPoints: number
}

// 模型权重配置类型
interface ModelWeightConfig {
  modelId: number
  weight: number
  isActive: boolean
  reason?: string
}

// 模型训练请求类型
interface ModelTrainingRequest {
  modelType: string
  parameters: Record<string, any>
  trainingData: {
    startDate: string
    endDate: string
    symbols: string[]
  }
}

// 模型训练响应类型
interface ModelTrainingResponse {
  trainingId: string
  modelId: number
  status: 'pending' | 'training' | 'completed' | 'failed'
  progress?: number
  estimatedCompletion?: string
  message?: string
}

/**
 * 模型API服务
 */
export const modelApi = {
  /**
   * 获取所有模型列表
   */
  async getModels(): Promise<ModelInfo[]> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelInfo[]>('/models', {
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
   * 获取活跃模型列表
   */
  async getActiveModels(): Promise<ModelInfo[]> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelInfo[]>('/models/active', {
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
   * 获取模型详情
   */
  async getModelDetail(modelId: number): Promise<ModelInfo> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelInfo>(`/models/${modelId}`, {
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
   * 获取模型性能指标
   */
  async getModelPerformance(modelId: number): Promise<ModelPerformance> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelPerformance>(`/models/${modelId}/performance`, {
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
   * 获取所有模型性能指标
   */
  async getAllModelPerformance(): Promise<ModelPerformance[]> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelPerformance[]>('/models/performance', {
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
   * 更新模型权重
   */
  async updateModelWeight(
    modelId: number, 
    weight: number
  ): Promise<ModelWeightConfig> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelWeightConfig>(`/models/${modelId}/weight`, {
        method: 'PUT',
        body: { weight }
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
   * 批量更新模型权重
   */
  async updateModelWeights(
    weights: Record<number, number>
  ): Promise<ModelWeightConfig[]> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelWeightConfig[]>('/models/weights', {
        method: 'PUT',
        body: { weights }
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
   * 启用/禁用模型
   */
  async toggleModelActive(
    modelId: number, 
    isActive: boolean
  ): Promise<ModelInfo> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelInfo>(`/models/${modelId}/active`, {
        method: 'PUT',
        body: { isActive }
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
   * 训练新模型
   */
  async trainModel(requestData: ModelTrainingRequest): Promise<ModelTrainingResponse> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelTrainingResponse>('/models/train', {
        method: 'POST',
        body: requestData
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
   * 获取训练状态
   */
  async getTrainingStatus(trainingId: string): Promise<ModelTrainingResponse> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelTrainingResponse>(`/models/training/${trainingId}`, {
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
   * 删除模型
   */
  async deleteModel(modelId: number): Promise<{ success: boolean; message: string }> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<{ success: boolean; message: string }>(`/models/${modelId}`, {
        method: 'DELETE'
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
   * 重新评估模型性能
   */
  async reevaluateModel(modelId: number): Promise<ModelPerformance> {
    const { request, handleApiError } = useApiWithErrorHandler()
    
    try {
      const response = await request<ModelPerformance>(`/models/${modelId}/reevaluate`, {
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
 * 带缓存的模型API服务
 */
export const useCachedModelApi = () => {
  const { cachedGet, clearApiCache } = useCachedApi()

  return {
    /**
     * 获取所有模型列表（带缓存）
     */
    async getModels(ttl: number = 10 * 60 * 1000): Promise<ModelInfo[]> {
      const cacheKey = 'models:all'
      return cachedGet<ModelInfo[]>('/models', undefined, cacheKey, ttl)
    },

    /**
     * 获取活跃模型列表（带缓存）
     */
    async getActiveModels(ttl: number = 5 * 60 * 1000): Promise<ModelInfo[]> {
      const cacheKey = 'models:active'
      return cachedGet<ModelInfo[]>('/models/active', undefined, cacheKey, ttl)
    },

    /**
     * 获取模型详情（带缓存）
     */
    async getModelDetail(modelId: number, ttl: number = 15 * 60 * 1000): Promise<ModelInfo> {
      const cacheKey = `model:detail:${modelId}`
      return cachedGet<ModelInfo>(`/models/${modelId}`, undefined, cacheKey, ttl)
    },

    /**
     * 获取模型性能指标（带缓存）
     */
    async getModelPerformance(modelId: number, ttl: number = 30 * 60 * 1000): Promise<ModelPerformance> {
      const cacheKey = `model:performance:${modelId}`
      return cachedGet<ModelPerformance>(`/models/${modelId}/performance`, undefined, cacheKey, ttl)
    },

    /**
     * 获取所有模型性能指标（带缓存）
     */
    async getAllModelPerformance(ttl: number = 30 * 60 * 1000): Promise<ModelPerformance[]> {
      const cacheKey = 'models:performance:all'
      return cachedGet<ModelPerformance[]>('/models/performance', undefined, cacheKey, ttl)
    },

    /**
     * 清除模型相关缓存
     */
    clearModelCache(): void {
      clearApiCache('model')
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

// 导出默认的模型API服务
export default modelApi