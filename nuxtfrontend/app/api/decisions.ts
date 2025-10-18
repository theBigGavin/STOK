/**
 * 决策相关API服务
 * 提供交易决策生成、批量决策、决策历史查询等功能
 */

import type { DecisionResult, ModelDecision } from '~/types/decisions';
import type { DecisionQueryParams } from '~/types/query';

// 批量决策响应类型
interface BatchDecisionResponse {
  decisions: DecisionResult[];
  totalProcessed: number;
  failedSymbols: string[];
  processingTime: number;
}

// 决策历史响应类型
interface DecisionHistoryResponse {
  symbol: string;
  decisions: DecisionResult[];
  total: number;
  startDate: string;
  endDate: string;
}

/**
 * 决策API服务
 */
export const decisionApi = {
  /**
   * 生成单个股票决策
   */
  async generateDecision(symbol: string, tradeDate: string): Promise<DecisionResult> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/decisions/generate', {
        method: 'POST',
        body: {
          symbol,
          trade_date: tradeDate,
        },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data.decision;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 批量生成决策
   */
  async generateBatchDecisions(
    symbols: string[],
    tradeDate: string
  ): Promise<BatchDecisionResponse> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/decisions/batch', {
        method: 'POST',
        body: {
          symbols,
          trade_date: tradeDate,
        },
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
   * 获取决策历史
   */
  async getDecisionHistory(
    symbol: string,
    startDate: string,
    endDate: string,
    params?: DecisionQueryParams
  ): Promise<DecisionHistoryResponse> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/decisions/history/${symbol}`, {
        method: 'GET',
        params: {
          start_date: startDate,
          end_date: endDate,
          ...params,
        },
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
   * 获取最新决策
   */
  async getLatestDecision(symbol: string): Promise<DecisionResult | null> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/decisions/latest/${symbol}`, {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error: unknown) {
      // 如果没有最新决策，返回null而不是抛出错误
      if ((error as { status?: number }).status === 404) {
        return null;
      }
      throw handleApiError(error);
    }
  },

  /**
   * 获取模型决策详情
   */
  async getModelDecisions(symbol: string, tradeDate: string): Promise<ModelDecision[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/decisions/models/${symbol}`, {
        method: 'GET',
        params: {
          trade_date: tradeDate,
        },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data.models;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取决策统计
   */
  async getDecisionStats(
    symbol?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalDecisions: number;
    buyCount: number;
    sellCount: number;
    holdCount: number;
    avgConfidence: number;
    successRate?: number;
  }> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/decisions/stats', {
        method: 'GET',
        params: {
          symbol,
          start_date: startDate,
          end_date: endDate,
        },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 重新计算决策
   */
  async recalculateDecision(
    symbol: string,
    tradeDate: string,
    modelWeights?: Record<string, number>
  ): Promise<DecisionResult> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/decisions/recalculate', {
        method: 'POST',
        body: {
          symbol,
          trade_date: tradeDate,
          model_weights: modelWeights,
        },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data.decision;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

/**
 * 带缓存的决策API服务
 */
export const useCachedDecisionApi = () => {
  const { cachedGet, clearApiCache } = useCachedApi();

  return {
    /**
     * 获取决策历史（带缓存）
     */
    async getDecisionHistory(
      symbol: string,
      startDate: string,
      endDate: string,
      params?: DecisionQueryParams,
      ttl: number = 15 * 60 * 1000
    ): Promise<DecisionHistoryResponse> {
      const cacheKey = `decision-history:${symbol}:${startDate}:${endDate}:${JSON.stringify(params || {})}`;
      return cachedGet<DecisionHistoryResponse>(
        `/decisions/history/${symbol}`,
        {
          start_date: startDate,
          end_date: endDate,
          ...params,
        },
        cacheKey,
        ttl
      );
    },

    /**
     * 获取最新决策（带缓存）
     */
    async getLatestDecision(
      symbol: string,
      ttl: number = 2 * 60 * 1000
    ): Promise<DecisionResult | null> {
      const cacheKey = `latest-decision:${symbol}`;

      try {
        const result = await cachedGet<DecisionResult>(
          `/decisions/latest/${symbol}`,
          undefined,
          cacheKey,
          ttl
        );
        return result || null;
      } catch (error: unknown) {
        // 如果没有最新决策，返回null
        if ((error as { status?: number }).status === 404) {
          return null;
        }
        throw error;
      }
    },

    /**
     * 获取决策统计（带缓存）
     */
    async getDecisionStats(
      symbol?: string,
      startDate?: string,
      endDate?: string,
      ttl: number = 10 * 60 * 1000
    ): Promise<{
      totalDecisions: number;
      buyCount: number;
      sellCount: number;
      holdCount: number;
      avgConfidence: number;
      successRate?: number;
    }> {
      const cacheKey = `decision-stats:${symbol || 'all'}:${startDate || ''}:${endDate || ''}`;
      return cachedGet<{
        totalDecisions: number;
        buyCount: number;
        sellCount: number;
        holdCount: number;
        avgConfidence: number;
        successRate?: number;
      }>(
        '/decisions/stats',
        {
          symbol,
          start_date: startDate,
          end_date: endDate,
        },
        cacheKey,
        ttl
      );
    },

    /**
     * 清除决策相关缓存
     */
    clearDecisionCache(): void {
      clearApiCache('decision');
    },
  };
};

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

// 导出默认的决策API服务
export default decisionApi;
