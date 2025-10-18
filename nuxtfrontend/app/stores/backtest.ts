/**
 * 回测数据状态管理Store
 * 管理交易策略回测、性能分析、结果可视化等功能
 */

import { defineStore } from 'pinia';
import type { BacktestResult, BacktestRequest } from '~/types/backtest';
import { backtestApi, useCachedBacktestApi } from '~/api/backtest';
import { useErrorHandler } from '~/composables/errorHandler';

// 回测状态接口
interface BacktestState {
  // 回测结果列表
  backtestResults: BacktestResult[];
  // 当前回测结果
  currentBacktest: BacktestResult | null;
  // 回测历史缓存
  backtestHistory: Map<string, BacktestResult>;
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  // 回测进度
  backtestProgress: {
    status: 'idle' | 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    currentStep?: string;
    estimatedCompletion?: string;
    message?: string;
  };
  // 批量回测状态
  batchBacktest: {
    processing: boolean;
    progress: number;
    total: number;
    completed: number;
    failed: number;
  };
  // 回测筛选条件
  filters: {
    symbol: string | null;
    startDate: string | null;
    endDate: string | null;
    minReturn: number | null;
    maxDrawdown: number | null;
  };
  // 回测统计
  stats: {
    totalBacktests: number;
    successfulBacktests: number;
    failedBacktests: number;
    avgReturn: number;
    bestReturn: number;
    worstReturn: number;
    avgSharpeRatio: number;
    mostTestedSymbol: string;
  };
  // 比较的回测结果
  comparisonResults: BacktestResult[];
}

/**
 * 回测数据状态管理Store
 */
export const useBacktestStore = defineStore('backtest', () => {
  const { handleApiError } = useErrorHandler();
  const cachedBacktestApi = useCachedBacktestApi();

  // 状态定义
  const state = reactive<BacktestState>({
    backtestResults: [],
    currentBacktest: null,
    backtestHistory: new Map(),
    loading: false,
    error: null,
    backtestProgress: {
      status: 'idle',
      progress: 0,
      currentStep: undefined,
      estimatedCompletion: undefined,
      message: undefined,
    },
    batchBacktest: {
      processing: false,
      progress: 0,
      total: 0,
      completed: 0,
      failed: 0,
    },
    filters: {
      symbol: null,
      startDate: null,
      endDate: null,
      minReturn: null,
      maxDrawdown: null,
    },
    stats: {
      totalBacktests: 0,
      successfulBacktests: 0,
      failedBacktests: 0,
      avgReturn: 0,
      bestReturn: 0,
      worstReturn: 0,
      avgSharpeRatio: 0,
      mostTestedSymbol: '',
    },
    comparisonResults: [],
  });

  // 计算属性
  const computedState = {
    // 筛选后的回测结果
    filteredBacktestResults: computed(() => {
      let filtered = state.backtestResults;

      // 按股票代码筛选
      if (state.filters.symbol) {
        filtered = filtered.filter(result =>
          result.trades.some(trade => trade.symbol === state.filters.symbol)
        );
      }

      // 按日期范围筛选
      if (state.filters.startDate) {
        filtered = filtered.filter(result =>
          result.trades.some(trade => trade.date >= state.filters.startDate!)
        );
      }

      if (state.filters.endDate) {
        filtered = filtered.filter(result =>
          result.trades.some(trade => trade.date <= state.filters.endDate!)
        );
      }

      // 按最小回报筛选
      if (state.filters.minReturn !== null) {
        filtered = filtered.filter(result => result.totalReturn >= state.filters.minReturn!);
      }

      // 按最大回撤筛选
      if (state.filters.maxDrawdown !== null) {
        filtered = filtered.filter(
          result => Math.abs(result.maxDrawdown) <= Math.abs(state.filters.maxDrawdown!)
        );
      }

      return filtered;
    }),

    // 最近回测结果
    recentBacktestResults: computed(() => state.backtestResults.slice(0, 10)),

    // 高回报回测结果
    highReturnBacktests: computed(() =>
      state.backtestResults
        .filter(result => result.totalReturn > 0.1) // 10%以上回报
        .sort((a, b) => b.totalReturn - a.totalReturn)
    ),

    // 低风险回测结果
    lowRiskBacktests: computed(() =>
      state.backtestResults
        .filter(result => result.maxDrawdown > -0.1) // 回撤小于10%
        .sort((a, b) => b.sharpeRatio - a.sharpeRatio)
    ),

    // 按股票分组的回测结果
    backtestsBySymbol: computed(() => {
      const grouped: Record<string, BacktestResult[]> = {};
      state.backtestResults.forEach(result => {
        const symbols = [...new Set(result.trades.map(trade => trade.symbol))];
        symbols.forEach(symbol => {
          if (!grouped[symbol]) {
            grouped[symbol] = [];
          }
          grouped[symbol].push(result);
        });
      });
      return grouped;
    }),

    // 是否正在运行回测
    isBacktestRunning: computed(
      () =>
        state.backtestProgress.status === 'pending' || state.backtestProgress.status === 'running'
    ),

    // 是否有批量回测在进行
    isBatchBacktestRunning: computed(() => state.batchBacktest.processing),

    // 比较分析结果
    comparisonAnalysis: computed(() => {
      if (state.comparisonResults.length < 2) return null;

      return state.comparisonResults.map(result => ({
        ...result,
        metrics: {
          totalReturn: result.totalReturn,
          sharpeRatio: result.sharpeRatio,
          maxDrawdown: result.maxDrawdown,
          winRate: result.winRate,
          profitFactor: result.profitFactor,
        },
      }));
    }),
  };

  // Actions
  const actions = {
    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      state.loading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      state.error = error;
    },

    /**
     * 清除错误信息
     */
    clearError() {
      state.error = null;
    },

    /**
     * 设置筛选条件
     */
    setFilters(filters: Partial<BacktestState['filters']>) {
      state.filters = { ...state.filters, ...filters };
    },

    /**
     * 重置筛选条件
     */
    resetFilters() {
      state.filters = {
        symbol: null,
        startDate: null,
        endDate: null,
        minReturn: null,
        maxDrawdown: null,
      };
    },

    /**
     * 设置当前回测结果
     */
    setCurrentBacktest(backtest: BacktestResult | null) {
      state.currentBacktest = backtest;
    },

    /**
     * 设置回测进度
     */
    setBacktestProgress(progress: Partial<BacktestState['backtestProgress']>) {
      state.backtestProgress = { ...state.backtestProgress, ...progress };
    },

    /**
     * 重置回测进度
     */
    resetBacktestProgress() {
      state.backtestProgress = {
        status: 'idle',
        progress: 0,
        currentStep: undefined,
        estimatedCompletion: undefined,
        message: undefined,
      };
    },

    /**
     * 执行回测
     */
    async runBacktest(requestData: BacktestRequest) {
      state.loading = true;
      state.error = null;
      state.backtestProgress.status = 'pending';

      try {
        const result = await backtestApi.runBacktest(requestData);

        // 添加到回测结果列表
        state.backtestResults.unshift(result);
        state.currentBacktest = result;

        // 更新回测历史缓存
        const backtestId = this.generateBacktestId(result);
        state.backtestHistory.set(backtestId, result);

        // 更新进度
        state.backtestProgress = {
          status: 'completed',
          progress: 100,
          currentStep: '完成',
          message: '回测执行完成',
        };

        // 更新统计信息
        await this.fetchBacktestStats();

        return result;
      } catch (error) {
        state.error = handleApiError(error).message;
        state.backtestProgress.status = 'failed';
        state.backtestProgress.message = '回测执行失败';
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 异步执行回测
     */
    async runBacktestAsync(requestData: BacktestRequest) {
      state.error = null;
      state.backtestProgress.status = 'pending';

      try {
        const progress = await backtestApi.runBacktestAsync(requestData);
        state.backtestProgress = { ...state.backtestProgress, ...progress };
        return progress;
      } catch (error) {
        state.error = handleApiError(error).message;
        state.backtestProgress.status = 'failed';
        throw error;
      }
    },

    /**
     * 获取回测进度
     */
    async getBacktestProgress(backtestId: string) {
      try {
        const progress = await backtestApi.getBacktestProgress(backtestId);
        state.backtestProgress = { ...state.backtestProgress, ...progress };
        return progress;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      }
    },

    /**
     * 获取回测结果
     */
    async getBacktestResult(backtestId: string) {
      state.loading = true;
      state.error = null;

      try {
        const result = await backtestApi.getBacktestResult(backtestId);

        // 添加到回测结果列表
        const existingIndex = state.backtestResults.findIndex(
          r => this.generateBacktestId(r) === backtestId
        );
        if (existingIndex === -1) {
          state.backtestResults.unshift(result);
        } else {
          state.backtestResults[existingIndex] = result;
        }

        state.currentBacktest = result;
        state.backtestHistory.set(backtestId, result);

        return result;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取回测历史
     */
    async fetchBacktestHistory(
      symbol?: string,
      startDate?: string,
      endDate?: string,
      limit: number = 50
    ) {
      state.loading = true;
      state.error = null;

      try {
        const results = await backtestApi.getBacktestHistory(symbol, startDate, endDate, limit);
        state.backtestResults = results;

        // 更新回测历史缓存
        results.forEach(result => {
          const backtestId = this.generateBacktestId(result);
          state.backtestHistory.set(backtestId, result);
        });

        return results;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取回测历史（带缓存）
     */
    async fetchBacktestHistoryCached(
      symbol?: string,
      startDate?: string,
      endDate?: string,
      limit: number = 50
    ) {
      state.loading = true;
      state.error = null;

      try {
        const results = await cachedBacktestApi.getBacktestHistory(
          symbol,
          startDate,
          endDate,
          limit
        );
        state.backtestResults = results;

        // 更新回测历史缓存
        results.forEach(result => {
          const backtestId = this.generateBacktestId(result);
          state.backtestHistory.set(backtestId, result);
        });

        return results;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 批量执行回测
     */
    async runBatchBacktest(requests: BacktestRequest[]) {
      state.batchBacktest.processing = true;
      state.batchBacktest.progress = 0;
      state.batchBacktest.total = requests.length;
      state.batchBacktest.completed = 0;
      state.batchBacktest.failed = 0;
      state.error = null;

      try {
        const results = await backtestApi.runBatchBacktest(requests);

        // 添加到回测结果列表
        state.backtestResults = [...results, ...state.backtestResults];

        // 更新进度
        state.batchBacktest.progress = 100;
        state.batchBacktest.completed = results.length;

        // 更新统计信息
        await this.fetchBacktestStats();

        return results;
      } catch (error) {
        state.error = handleApiError(error).message;
        state.batchBacktest.failed = requests.length;
        throw error;
      } finally {
        state.batchBacktest.processing = false;
      }
    },

    /**
     * 比较回测结果
     */
    async compareBacktests(backtestIds: string[]) {
      state.loading = true;
      state.error = null;

      try {
        const comparisons = await backtestApi.compareBacktests(backtestIds);

        // 获取完整的回测结果
        const results: BacktestResult[] = [];
        for (const comparison of comparisons) {
          const result = await this.getBacktestResult(comparison.backtestId);
          if (result) {
            results.push(result);
          }
        }

        state.comparisonResults = results;
        return comparisons;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取回测统计
     */
    async fetchBacktestStats() {
      state.loading = true;
      state.error = null;

      try {
        const stats = await backtestApi.getBacktestStats();
        state.stats = stats;
        return stats;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取回测统计（带缓存）
     */
    async fetchBacktestStatsCached() {
      state.loading = true;
      state.error = null;

      try {
        const stats = await cachedBacktestApi.getBacktestStats();
        state.stats = stats;
        return stats;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 删除回测结果
     */
    async deleteBacktest(backtestId: string) {
      state.loading = true;
      state.error = null;

      try {
        const result = await backtestApi.deleteBacktest(backtestId);

        if (result.success) {
          // 从回测结果列表中移除
          state.backtestResults = state.backtestResults.filter(
            r => this.generateBacktestId(r) !== backtestId
          );

          // 从回测历史缓存中移除
          state.backtestHistory.delete(backtestId);

          // 如果当前回测被删除，清空当前回测
          if (
            state.currentBacktest &&
            this.generateBacktestId(state.currentBacktest) === backtestId
          ) {
            state.currentBacktest = null;
          }

          // 更新统计信息
          await this.fetchBacktestStats();
        }

        return result;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 导出回测结果
     */
    async exportBacktestResult(backtestId: string, format: 'json' | 'csv' | 'excel' = 'json') {
      state.loading = true;
      state.error = null;

      try {
        const blob = await backtestApi.exportBacktestResult(backtestId, format);
        return blob;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 生成回测ID
     */
    generateBacktestId(backtest: BacktestResult): string {
      const symbols = [...new Set(backtest.trades.map(trade => trade.symbol))].sort();
      const dates = backtest.trades.map(trade => trade.date).sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      return `backtest_${symbols.join('_')}_${startDate}_${endDate}_${Date.now()}`;
    },

    /**
     * 清除回测缓存
     */
    clearBacktestCache() {
      state.backtestHistory.clear();
      state.comparisonResults = [];
      cachedBacktestApi.clearBacktestCache();
    },

    /**
     * 重置回测状态
     */
    reset() {
      state.backtestResults = [];
      state.currentBacktest = null;
      state.backtestHistory.clear();
      state.loading = false;
      state.error = null;
      state.backtestProgress = {
        status: 'idle',
        progress: 0,
        currentStep: undefined,
        estimatedCompletion: undefined,
        message: undefined,
      };
      state.batchBacktest = {
        processing: false,
        progress: 0,
        total: 0,
        completed: 0,
        failed: 0,
      };
      state.filters = {
        symbol: null,
        startDate: null,
        endDate: null,
        minReturn: null,
        maxDrawdown: null,
      };
      state.stats = {
        totalBacktests: 0,
        successfulBacktests: 0,
        failedBacktests: 0,
        avgReturn: 0,
        bestReturn: 0,
        worstReturn: 0,
        avgSharpeRatio: 0,
        mostTestedSymbol: '',
      };
      state.comparisonResults = [];
    },
  };

  // 返回Store内容
  return {
    // 状态
    ...toRefs(state),
    // 计算属性
    ...computedState,
    // Actions
    ...actions,
  };
});

// 导出Store类型
export type BacktestStore = ReturnType<typeof useBacktestStore>;
