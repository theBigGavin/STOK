/**
 * 股票相关API服务
 * 提供股票数据查询、刷新等功能
 */

import type { StockInfo, StockDailyData } from '~/types/stocks';
import type { StockQueryParams } from '~/types/query';
import type { PaginatedResponse } from '~/types/api';

// 股票数据响应类型
interface StockDataResponse {
  symbol: string;
  data: StockDailyData[];
  total: number;
  startDate: string;
  endDate: string;
}

// 刷新响应类型
interface RefreshResponse {
  symbol: string;
  status: 'success' | 'error';
  message: string;
  updatedRecords?: number;
}

/**
 * 股票API服务
 */
export const stockApi = {
  /**
   * 获取股票列表
   */
  async getStocks(params?: StockQueryParams): Promise<PaginatedResponse<StockInfo>> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/stocks', {
        method: 'GET',
        params,
      });

      return response.data as PaginatedResponse<StockInfo>;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取股票数据
   */
  async getStockData(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<StockDataResponse> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/stocks/${symbol}/data`, {
        method: 'GET',
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      return response.data as StockDataResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 刷新股票数据
   */
  async refreshStockData(symbol: string): Promise<RefreshResponse> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/stocks/${symbol}/refresh`, {
        method: 'POST',
      });

      return response.data as RefreshResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 获取股票基本信息
   */
  async getStockInfo(symbol: string): Promise<StockInfo> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request(`/stocks/${symbol}`, {
        method: 'GET',
      });

      return response.data as StockInfo;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 搜索股票
   */
  async searchStocks(query: string, limit: number = 10): Promise<StockInfo[]> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/stocks/search', {
        method: 'GET',
        params: {
          q: query,
          limit,
        },
      });

      return response.data as StockInfo[];
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * 批量获取股票数据
   */
  async getBatchStockData(
    symbols: string[],
    startDate: string,
    endDate: string
  ): Promise<Record<string, StockDailyData[]>> {
    const { request, handleApiError } = useApiWithErrorHandler();

    try {
      const response = await request('/stocks/batch/data', {
        method: 'POST',
        body: {
          symbols,
          start_date: startDate,
          end_date: endDate,
        },
      });

      return response.data as Record<string, StockDailyData[]>;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

/**
 * 带缓存的股票API服务
 */
export const useCachedStockApi = () => {
  const { cachedGet, clearApiCache } = useCachedApi();

  return {
    /**
     * 获取股票列表（带缓存）
     */
    async getStocks(
      params?: StockQueryParams,
      ttl: number = 5 * 60 * 1000
    ): Promise<PaginatedResponse<StockInfo>> {
      const cacheKey = `stocks:${JSON.stringify(params || {})}`;
      return cachedGet<PaginatedResponse<StockInfo>>('/stocks', params, cacheKey, ttl);
    },

    /**
     * 获取股票数据（带缓存）
     */
    async getStockData(
      symbol: string,
      startDate: string,
      endDate: string,
      ttl: number = 10 * 60 * 1000
    ): Promise<StockDataResponse> {
      const cacheKey = `stock-data:${symbol}:${startDate}:${endDate}`;
      return cachedGet<StockDataResponse>(
        `/stocks/${symbol}/data`,
        {
          start_date: startDate,
          end_date: endDate,
        },
        cacheKey,
        ttl
      );
    },

    /**
     * 获取股票基本信息（带缓存）
     */
    async getStockInfo(symbol: string, ttl: number = 30 * 60 * 1000): Promise<StockInfo> {
      const cacheKey = `stock-info:${symbol}`;
      return cachedGet<StockInfo>(`/stocks/${symbol}`, undefined, cacheKey, ttl);
    },

    /**
     * 搜索股票（带缓存）
     */
    async searchStocks(
      query: string,
      limit: number = 10,
      ttl: number = 2 * 60 * 1000
    ): Promise<StockInfo[]> {
      const cacheKey = `stock-search:${query}:${limit}`;
      return cachedGet<StockInfo[]>(
        '/stocks/search',
        {
          q: query,
          limit,
        },
        cacheKey,
        ttl
      );
    },

    /**
     * 清除股票相关缓存
     */
    clearStockCache(): void {
      clearApiCache('stock');
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

// 导出默认的股票API服务
export default stockApi;
