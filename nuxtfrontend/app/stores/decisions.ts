/**
 * 决策数据状态管理Store
 * 管理交易决策生成、决策历史、批量决策等功能
 */

import { defineStore } from 'pinia';
import type { DecisionResult, ModelDecision } from '~/types/decisions';
import type { DecisionQueryParams } from '~/types/query';
import { decisionApi, useCachedDecisionApi } from '~/api/decisions';
import { useErrorHandler } from '~/composables/errorHandler';

// 决策状态接口
interface DecisionState {
  // 决策列表
  decisions: DecisionResult[];
  // 决策历史缓存
  decisionHistory: Map<string, DecisionResult[]>;
  // 模型决策详情
  modelDecisions: Map<string, ModelDecision[]>;
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  // 批量处理状态
  batchProcessing: boolean;
  // 批量处理进度
  batchProgress: number;
  // 选中的决策
  selectedDecision: DecisionResult | null;
  // 决策筛选条件
  filters: {
    symbol: string | null;
    startDate: string | null;
    endDate: string | null;
    decisionType: 'BUY' | 'SELL' | 'HOLD' | null;
  };
  // 决策统计
  stats: {
    totalDecisions: number;
    buyCount: number;
    sellCount: number;
    holdCount: number;
    avgConfidence: number;
    successRate?: number;
  };
}

/**
 * 决策数据状态管理Store
 */
export const useDecisionStore = defineStore('decisions', () => {
  const { handleApiError } = useErrorHandler();
  const cachedDecisionApi = useCachedDecisionApi();

  // 状态定义
  const state = reactive<DecisionState>({
    decisions: [],
    decisionHistory: new Map(),
    modelDecisions: new Map(),
    loading: false,
    error: null,
    batchProcessing: false,
    batchProgress: 0,
    selectedDecision: null,
    filters: {
      symbol: null,
      startDate: null,
      endDate: null,
      decisionType: null,
    },
    stats: {
      totalDecisions: 0,
      buyCount: 0,
      sellCount: 0,
      holdCount: 0,
      avgConfidence: 0,
      successRate: undefined,
    },
  });

  // 计算属性
  const computedState = {
    // 筛选后的决策列表
    filteredDecisions: computed(() => {
      let filtered = state.decisions;

      // 按股票代码筛选
      if (state.filters.symbol) {
        filtered = filtered.filter(decision => decision.symbol === state.filters.symbol);
      }

      // 按日期范围筛选
      if (state.filters.startDate) {
        filtered = filtered.filter(decision => decision.tradeDate >= state.filters.startDate!);
      }

      if (state.filters.endDate) {
        filtered = filtered.filter(decision => decision.tradeDate <= state.filters.endDate!);
      }

      // 按决策类型筛选
      if (state.filters.decisionType) {
        filtered = filtered.filter(
          decision => decision.finalDecision.decision === state.filters.decisionType
        );
      }

      return filtered;
    }),

    // 最近决策（按时间倒序）
    recentDecisions: computed(() =>
      state.decisions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20)
    ),

    // 高风险决策
    highRiskDecisions: computed(() =>
      state.decisions.filter(decision => decision.riskAssessment.riskLevel === 'HIGH')
    ),

    // 按股票分组的决策
    decisionsBySymbol: computed(() => {
      const grouped: Record<string, DecisionResult[]> = {};
      state.decisions.forEach(decision => {
        const symbol = decision.symbol;
        if (!grouped[symbol]) {
          grouped[symbol] = [];
        }
        grouped[symbol].push(decision);
      });
      return grouped;
    }),

    // 选中的决策的模型详情
    selectedModelDecisions: computed(() => {
      if (!state.selectedDecision) return [];
      const key = `${state.selectedDecision.symbol}:${state.selectedDecision.tradeDate}`;
      return state.modelDecisions.get(key) || [];
    }),

    // 决策成功率
    decisionSuccessRate: computed(() => {
      if (state.stats.totalDecisions === 0) return 0;
      return (state.stats.buyCount / state.stats.totalDecisions) * 100;
    }),

    // 是否有批量处理在进行
    isBatchProcessing: computed(() => state.batchProcessing),
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
    setFilters(filters: Partial<DecisionState['filters']>) {
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
        decisionType: null,
      };
    },

    /**
     * 选择决策
     */
    selectDecision(decision: DecisionResult | null) {
      state.selectedDecision = decision;
    },

    /**
     * 生成单个股票决策
     */
    async generateDecision(symbol: string, tradeDate: string) {
      state.loading = true;
      state.error = null;

      try {
        const decision = await decisionApi.generateDecision(symbol, tradeDate);

        // 添加到决策列表
        state.decisions.unshift(decision);

        // 更新决策历史缓存
        const historyKey = symbol;
        const history = state.decisionHistory.get(historyKey) || [];
        history.unshift(decision);
        state.decisionHistory.set(historyKey, history.slice(0, 100)); // 限制历史记录数量

        return decision;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 批量生成决策
     */
    async generateBatchDecisions(symbols: string[], tradeDate: string) {
      state.batchProcessing = true;
      state.batchProgress = 0;
      state.error = null;

      try {
        const response = await decisionApi.generateBatchDecisions(symbols, tradeDate);

        // 更新进度
        state.batchProgress = 100;

        // 添加到决策列表
        state.decisions = [...response.decisions, ...state.decisions];

        // 更新决策历史缓存
        response.decisions.forEach(decision => {
          const historyKey = decision.symbol;
          const history = state.decisionHistory.get(historyKey) || [];
          history.unshift(decision);
          state.decisionHistory.set(historyKey, history.slice(0, 100));
        });

        return response;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.batchProcessing = false;
        state.batchProgress = 0;
      }
    },

    /**
     * 获取决策历史
     */
    async fetchDecisionHistory(
      symbol: string,
      startDate: string,
      endDate: string,
      params?: DecisionQueryParams
    ) {
      state.loading = true;
      state.error = null;

      try {
        const response = await decisionApi.getDecisionHistory(symbol, startDate, endDate, params);

        // 更新决策历史缓存
        state.decisionHistory.set(symbol, response.decisions);

        return response;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取决策历史（带缓存）
     */
    async fetchDecisionHistoryCached(
      symbol: string,
      startDate: string,
      endDate: string,
      params?: DecisionQueryParams
    ) {
      state.loading = true;
      state.error = null;

      try {
        const response = await cachedDecisionApi.getDecisionHistory(
          symbol,
          startDate,
          endDate,
          params
        );

        // 更新决策历史缓存
        state.decisionHistory.set(symbol, response.decisions);

        return response;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取最新决策
     */
    async fetchLatestDecision(symbol: string) {
      state.loading = true;
      state.error = null;

      try {
        const decision = await decisionApi.getLatestDecision(symbol);

        if (decision) {
          // 添加到决策列表
          const existingIndex = state.decisions.findIndex(
            d => d.symbol === symbol && d.tradeDate === decision.tradeDate
          );
          if (existingIndex === -1) {
            state.decisions.unshift(decision);
          } else {
            state.decisions[existingIndex] = decision;
          }
        }

        return decision;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取最新决策（带缓存）
     */
    async fetchLatestDecisionCached(symbol: string) {
      state.loading = true;
      state.error = null;

      try {
        const decision = await cachedDecisionApi.getLatestDecision(symbol);

        if (decision) {
          // 添加到决策列表
          const existingIndex = state.decisions.findIndex(
            d => d.symbol === symbol && d.tradeDate === decision.tradeDate
          );
          if (existingIndex === -1) {
            state.decisions.unshift(decision);
          } else {
            state.decisions[existingIndex] = decision;
          }
        }

        return decision;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取模型决策详情
     */
    async fetchModelDecisions(symbol: string, tradeDate: string) {
      state.loading = true;
      state.error = null;

      try {
        const modelDecisions = await decisionApi.getModelDecisions(symbol, tradeDate);

        // 更新模型决策缓存
        const key = `${symbol}:${tradeDate}`;
        state.modelDecisions.set(key, modelDecisions);

        return modelDecisions;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 获取决策统计
     */
    async fetchDecisionStats(symbol?: string, startDate?: string, endDate?: string) {
      state.loading = true;
      state.error = null;

      try {
        const stats = await decisionApi.getDecisionStats(symbol, startDate, endDate);
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
     * 获取决策统计（带缓存）
     */
    async fetchDecisionStatsCached(symbol?: string, startDate?: string, endDate?: string) {
      state.loading = true;
      state.error = null;

      try {
        const stats = await cachedDecisionApi.getDecisionStats(symbol, startDate, endDate);
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
     * 重新计算决策
     */
    async recalculateDecision(
      symbol: string,
      tradeDate: string,
      modelWeights?: Record<string, number>
    ) {
      state.loading = true;
      state.error = null;

      try {
        const decision = await decisionApi.recalculateDecision(symbol, tradeDate, modelWeights);

        // 更新决策列表
        const index = state.decisions.findIndex(
          d => d.symbol === symbol && d.tradeDate === tradeDate
        );
        if (index !== -1) {
          state.decisions[index] = decision;
        }

        // 清除相关缓存
        cachedDecisionApi.clearDecisionCache();

        return decision;
      } catch (error) {
        state.error = handleApiError(error).message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 清除决策缓存
     */
    clearDecisionCache() {
      state.decisionHistory.clear();
      state.modelDecisions.clear();
      cachedDecisionApi.clearDecisionCache();
    },

    /**
     * 重置决策状态
     */
    reset() {
      state.decisions = [];
      state.decisionHistory.clear();
      state.modelDecisions.clear();
      state.loading = false;
      state.error = null;
      state.batchProcessing = false;
      state.batchProgress = 0;
      state.selectedDecision = null;
      state.filters = {
        symbol: null,
        startDate: null,
        endDate: null,
        decisionType: null,
      };
      state.stats = {
        totalDecisions: 0,
        buyCount: 0,
        sellCount: 0,
        holdCount: 0,
        avgConfidence: 0,
        successRate: undefined,
      };
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
export type DecisionStore = ReturnType<typeof useDecisionStore>;
