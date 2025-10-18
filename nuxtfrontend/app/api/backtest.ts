/**
 * 回测相关API服务
 * 提供交易策略回测、性能分析、结果可视化等功能
 */

import type { BacktestResult } from '~/types/backtest';

// 回测请求类型
interface BacktestRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  modelIds?: number[];
  strategy?: string;
  parameters?: Record<string, unknown>;
}

// 回测进度响应类型
interface BacktestProgress {
  backtestId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  estimatedCompletion?: string;
  message?: string;
}

// 回测比较结果类型
interface BacktestComparison {
  backtestId: string;
  name: string;
  results: BacktestResult;
  parameters: Record<string, unknown>;
}

// 回测统计类型
interface BacktestStats {
  totalBacktests: number;
  successfulBacktests: number;
  failedBacktests: number;
  avgReturn: number;
  bestReturn: number;
  worstReturn: number;
  avgSharpeRatio: number;
  mostTestedSymbol: string;
}

/**
 * 回测API服务
 */
export const backtestApi = {
  /**
   * 执行回测
   */
  async runBacktest(requestData: BacktestRequest): Promise<BacktestResult> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/backtest/run', {
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
   * 异步执行回测
   */
  async runBacktestAsync(requestData: BacktestRequest): Promise<BacktestProgress> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/backtest/run-async', {
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
   * 获取回测进度
   */
  async getBacktestProgress(backtestId: string): Promise<BacktestProgress> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/backtest/progress/${backtestId}`, {
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
   * 获取回测结果
   */
  async getBacktestResult(backtestId: string): Promise<BacktestResult> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/backtest/result/${backtestId}`, {
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
   * 获取回测历史
   */
  async getBacktestHistory(
    symbol?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 50
  ): Promise<BacktestResult[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/backtest/history', {
        method: 'GET',
        params: {
          symbol,
          start_date: startDate,
          end_date: endDate,
          limit,
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
   * 批量执行回测
   */
  async runBatchBacktest(requests: BacktestRequest[]): Promise<BacktestResult[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/backtest/batch', {
        method: 'POST',
        body: { requests },
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
   * 比较回测结果
   */
  async compareBacktests(backtestIds: string[]): Promise<BacktestComparison[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/backtest/compare', {
        method: 'POST',
        body: { backtestIds },
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
   * 获取回测统计
   */
  async getBacktestStats(): Promise<BacktestStats> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/backtest/stats', {
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
   * 删除回测结果
   */
  async deleteBacktest(backtestId: string): Promise<{ success: boolean; message: string }> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(
        `/backtest/${backtestId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 导出回测结果
   */
  async exportBacktestResult(
    backtestId: string,
    format: 'json' | 'csv' | 'excel' = 'json'
  ): Promise<Blob> {
    const { handleApiError } = useApiWithErrorHandler();

    try {
      const response = await $fetch(`/backtest/export/${backtestId}`, {
        baseURL: 'http://localhost:8099/api/v1',
        method: 'GET',
        params: { format },
        responseType: 'blob',
      });

      return response as Blob;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取回测参数模板
   */
  async getBacktestTemplates(): Promise<Record<string, BacktestRequest>> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/backtest/templates', {
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
   * 保存回测配置
   */
  async saveBacktestConfig(
    name: string,
    config: BacktestRequest
  ): Promise<{ success: boolean; configId: string }> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/backtest/configs', {
        method: 'POST',
        body: { name, config },
      });

      if (!response.data) {
        throw new Error('API响应数据为空');
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

/**
 * 带缓存的回测API服务
 */
export const useCachedBacktestApi = () => {
  const { cachedGet, clearApiCache } = useCachedApi();

  return {
    /**
     * 获取回测历史（带缓存）
     */
    async getBacktestHistory(
      symbol?: string,
      startDate?: string,
      endDate?: string,
      limit: number = 50,
      ttl: number = 30 * 60 * 1000
    ): Promise<BacktestResult[]> {
      const cacheKey = `backtest-history:${symbol || 'all'}:${startDate || ''}:${endDate || ''}:${limit}`;
      return cachedGet<BacktestResult[]>(
        '/backtest/history',
        {
          symbol,
          start_date: startDate,
          end_date: endDate,
          limit,
        },
        cacheKey,
        ttl
      );
    },

    /**
     * 获取回测统计（带缓存）
     */
    async getBacktestStats(ttl: number = 60 * 60 * 1000): Promise<BacktestStats> {
      const cacheKey = 'backtest-stats';
      return cachedGet<BacktestStats>('/backtest/stats', undefined, cacheKey, ttl);
    },

    /**
     * 获取回测参数模板（带缓存）
     */
    async getBacktestTemplates(
      ttl: number = 24 * 60 * 60 * 1000
    ): Promise<Record<string, BacktestRequest>> {
      const cacheKey = 'backtest-templates';
      return cachedGet<Record<string, BacktestRequest>>(
        '/backtest/templates',
        undefined,
        cacheKey,
        ttl
      );
    },

    /**
     * 清除回测相关缓存
     */
    clearBacktestCache(): void {
      clearApiCache('backtest');
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

// 导出默认的回测API服务
export default backtestApi;
