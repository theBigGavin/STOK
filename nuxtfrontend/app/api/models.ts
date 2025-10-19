/**
 * 模型相关API服务
 * 提供机器学习模型管理、性能监控、权重配置等功能
 */

import type { ModelInfo } from '~/types/models';

// 模型性能指标类型 - 匹配后端API返回的数据结构
interface ModelPerformance {
  modelId: string;
  modelName: string;
  accuracy: number;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
  lastUpdated: string;
}

// 模型权重配置类型
interface ModelWeightConfig {
  modelId: string;
  weight: number;
  isActive: boolean;
  reason?: string;
}

// 模型训练请求类型
interface ModelTrainingRequest {
  modelType: string;
  parameters: Record<string, unknown>;
  trainingData: {
    startDate: string;
    endDate: string;
    symbols: string[];
  };
}

// 模型训练响应类型
interface ModelTrainingResponse {
  trainingId: string;
  modelId: number;
  status: 'pending' | 'training' | 'completed' | 'failed';
  progress?: number;
  estimatedCompletion?: string;
  message?: string;
}

// 性能趋势数据类型
interface PerformanceTrendData {
  date: string;
  label: string;
  accuracy: number;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
}

interface PerformanceTrendResponse {
  trend: PerformanceTrendData[];
  metric: string;
  days: number;
}

/**
 * 模型API服务
 */
export const modelApi = {
  /**
   * 获取所有模型列表
   */
  async getModels(): Promise<ModelInfo[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/models', {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      // 后端返回的是APIResponse格式，需要提取data字段
      const apiResponse = response.data;
      let rawModels: Record<string, unknown>[] = [];

      if (apiResponse.data && apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
        // 处理分页响应格式
        rawModels = apiResponse.data.data;
      } else if (Array.isArray(apiResponse.data)) {
        // 处理直接数组格式
        rawModels = apiResponse.data;
      } else {
        throw new Error('API响应数据格式错误');
      }

      // 转换后端数据为前端格式
      return rawModels.map(transformApiModelToFrontend);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取活跃模型列表
   */
  async getActiveModels(): Promise<ModelInfo[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/models/active', {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      // 后端返回的是APIResponse格式，需要提取data字段
      const apiResponse = response.data;
      let rawModels: Record<string, unknown>[] = [];

      if (apiResponse.data && apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
        // 处理分页响应格式
        rawModels = apiResponse.data.data;
      } else if (Array.isArray(apiResponse.data)) {
        // 处理直接数组格式
        rawModels = apiResponse.data;
      } else {
        throw new Error('API响应数据格式错误');
      }

      // 转换后端数据为前端格式
      return rawModels.map(transformApiModelToFrontend);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取模型详情
   */
  async getModelDetail(modelId: string): Promise<ModelInfo> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/models/${modelId}`, {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      // 后端返回的是APIResponse格式，需要提取data字段
      const apiResponse = response.data;
      if (apiResponse.data) {
        return transformApiModelToFrontend(apiResponse.data);
      } else {
        throw new Error('API响应数据格式错误');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取模型性能指标
   */
  async getModelPerformance(modelId: string): Promise<ModelPerformance> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/models/${modelId}/performance`, {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取所有模型性能指标
   */
  async getAllModelPerformance(): Promise<ModelPerformance[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/models/performance', {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      // 后端返回的是APIResponse格式，需要提取data字段
      const apiResponse = response.data;
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        return apiResponse.data;
      } else {
        throw new Error('API响应数据格式错误');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 更新模型权重
   */
  async updateModelWeight(modelId: string, weight: number): Promise<ModelWeightConfig> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/models/${modelId}/weight`, {
        method: 'PUT',
        body: { weight },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 批量更新模型权重
   */
  async updateModelWeights(weights: Record<number, number>): Promise<ModelWeightConfig[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/models/weights', {
        method: 'PUT',
        body: { weights },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 启用/禁用模型
   */
  async toggleModelActive(modelId: string, isActive: boolean): Promise<ModelInfo> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/models/${modelId}/active`, {
        method: 'PUT',
        body: { isActive },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 训练新模型
   */
  async trainModel(requestData: ModelTrainingRequest): Promise<ModelTrainingResponse> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/models/train', {
        method: 'POST',
        body: requestData,
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取训练状态
   */
  async getTrainingStatus(trainingId: string): Promise<ModelTrainingResponse> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/models/training/${trainingId}`, {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 删除模型
   */
  async deleteModel(modelId: string): Promise<{ success: boolean; message: string }> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/models/${modelId}`, {
        method: 'DELETE',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 重新评估模型性能
   */
  async reevaluateModel(modelId: string): Promise<ModelPerformance> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/models/${modelId}/reevaluate`, {
        method: 'POST',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取模型性能趋势数据
   */
  async getModelsPerformanceTrend(
    days: number = 7,
    metric: string = 'accuracy'
  ): Promise<PerformanceTrendResponse> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/models/performance/trend', {
        method: 'GET',
        params: { days, metric },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      // 后端返回的是APIResponse格式，需要提取data字段
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      } else {
        throw new Error('API响应数据格式错误');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

/**
 * 带缓存的模型API服务
 */
export const useCachedModelApi = () => {
  const { cachedGet, clearApiCache } = useCachedApi();

  return {
    /**
     * 获取所有模型列表（带缓存）
     */
    async getModels(
      ttl: number = 10 * 60 * 1000
    ): Promise<{ data: ModelInfo[]; total: number; skip: number; limit: number }> {
      const cacheKey = 'models:all';
      const response = await cachedGet<{
        data: ModelInfo[];
        total: number;
        skip: number;
        limit: number;
      }>('/models', undefined, cacheKey, ttl);
      return response;
    },

    /**
     * 获取活跃模型列表（带缓存）
     */
    async getActiveModels(
      ttl: number = 5 * 60 * 1000
    ): Promise<{ data: ModelInfo[]; total: number; skip: number; limit: number }> {
      const cacheKey = 'models:active';
      const response = await cachedGet<{
        data: ModelInfo[];
        total: number;
        skip: number;
        limit: number;
      }>('/models/active', undefined, cacheKey, ttl);
      return response;
    },

    /**
     * 获取模型详情（带缓存）
     */
    async getModelDetail(modelId: string, ttl: number = 15 * 60 * 1000): Promise<ModelInfo> {
      const cacheKey = `model:detail:${modelId}`;
      return cachedGet<ModelInfo>(`/models/${modelId}`, undefined, cacheKey, ttl);
    },

    /**
     * 获取模型性能指标（带缓存）
     */
    async getModelPerformance(
      modelId: string,
      ttl: number = 30 * 60 * 1000
    ): Promise<ModelPerformance> {
      const cacheKey = `model:performance:${modelId}`;
      return cachedGet<ModelPerformance>(
        `/models/${modelId}/performance`,
        undefined,
        cacheKey,
        ttl
      );
    },

    /**
     * 获取所有模型性能指标（带缓存）
     */
    async getAllModelPerformance(ttl: number = 30 * 60 * 1000): Promise<ModelPerformance[]> {
      const cacheKey = 'models:performance:all';
      return cachedGet<ModelPerformance[]>('/models/performance', undefined, cacheKey, ttl);
    },

    /**
     * 获取模型性能趋势数据（带缓存）
     */
    async getModelsPerformanceTrend(
      days: number = 7,
      metric: string = 'accuracy',
      ttl: number = 30 * 60 * 1000
    ): Promise<PerformanceTrendResponse> {
      const cacheKey = `models:performance:trend:${days}:${metric}`;
      return cachedGet<PerformanceTrendResponse>(
        '/models/performance/trend',
        { days, metric },
        cacheKey,
        ttl
      );
    },

    /**
     * 清除模型相关缓存
     */
    clearModelCache(): void {
      clearApiCache('model');
    },
  };
};

/**
 * 将后端API返回的模型数据转换为前端格式
 */
function transformApiModelToFrontend(apiModel: unknown): ModelInfo {
  // 类型断言为可索引对象
  const model = apiModel as Record<string, unknown>;

  // 模型类型映射
  const modelTypeMapping: Record<string, 'technical' | 'machine_learning' | 'fundamental'> = {
    technical: 'technical',
    ml: 'machine_learning',
    machine_learning: 'machine_learning',
    fundamental: 'fundamental',
  };

  // 转换主要字段
  const frontendModel: ModelInfo = {
    modelId: String(model.id || model.modelId || ''),
    name: String(model.name || ''),
    description: model.description ? String(model.description) : undefined,
    modelType: modelTypeMapping[String(model.model_type || model.modelType)] || 'technical',
    parameters: (model.parameters as Record<string, unknown>) || {},
    weight: typeof model.weight === 'string' ? parseFloat(model.weight) : Number(model.weight) || 0,
    isActive: model.is_active !== undefined ? Boolean(model.is_active) : Boolean(model.isActive),
    performanceScore:
      typeof model.performance_score === 'string'
        ? parseFloat(model.performance_score)
        : Number(model.performance_score) || 0,
    createdAt: model.created_at ? String(model.created_at) : undefined,
    updatedAt: model.updated_at ? String(model.updated_at) : undefined,
  };

  // 转换性能指标
  const performanceMetrics = model.performance_metrics || model.performanceMetrics;
  if (performanceMetrics && typeof performanceMetrics === 'object') {
    const metrics = performanceMetrics as Record<string, unknown>;
    frontendModel.performanceMetrics = {
      accuracy:
        typeof metrics.win_rate === 'string'
          ? parseFloat(metrics.win_rate)
          : Number(metrics.win_rate) || 0,
      totalReturn:
        typeof metrics.total_return === 'string'
          ? parseFloat(metrics.total_return)
          : Number(metrics.total_return) || 0,
      sharpeRatio:
        typeof metrics.sharpe_ratio === 'string'
          ? parseFloat(metrics.sharpe_ratio)
          : Number(metrics.sharpe_ratio) || 0,
      maxDrawdown:
        typeof metrics.max_drawdown === 'string'
          ? parseFloat(metrics.max_drawdown)
          : Number(metrics.max_drawdown) || 0,
      winRate:
        typeof metrics.win_rate === 'string'
          ? parseFloat(metrics.win_rate)
          : Number(metrics.win_rate) || 0,
    };
  }

  return frontendModel;
}

/**
 * 组合API和错误处理的工具函数
 */
const useApiWithErrorHandler = () => {
  const { request } = useApi();
  const { handleApiError } = useErrorHandler();

  return {
    request,
    handleApiError,
  };
};

// 导出默认的模型API服务
export default modelApi;
