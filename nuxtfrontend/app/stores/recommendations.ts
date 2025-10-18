/**
 * 推荐数据状态管理Store
 * 管理AI选股推荐、推荐详情、推荐统计等功能
 */

import { defineStore } from 'pinia';
import type { Recommendation } from '~/types/decisions';

// 推荐状态接口
interface RecommendationState {
  // 推荐列表
  recommendations: Recommendation[];
  // 加载状态
  loading: boolean;
  // 刷新状态
  refreshing: boolean;
  // 错误信息
  error: string | null;
  // 选中的推荐
  selectedRecommendation: Recommendation | null;
  // 推荐统计
  statistics: {
    buyCount: number;
    sellCount: number;
    holdCount: number;
    avgConfidence: number;
  };
  // 系统统计
  systemStats: {
    totalStocks: number;
    stocksWithDecisions: number;
    buyDecisions: number;
    sellDecisions: number;
    holdDecisions: number;
    totalModels: number;
    activeModels: number;
  };
}

/**
 * 推荐数据状态管理Store
 */
export const useRecommendationStore = defineStore('recommendations', () => {
  // 状态定义
  const state = reactive<RecommendationState>({
    recommendations: [],
    loading: false,
    refreshing: false,
    error: null,
    selectedRecommendation: null,
    statistics: {
      buyCount: 0,
      sellCount: 0,
      holdCount: 0,
      avgConfidence: 0
    },
    systemStats: {
      totalStocks: 0,
      stocksWithDecisions: 0,
      buyDecisions: 0,
      sellDecisions: 0,
      holdDecisions: 0,
      totalModels: 0,
      activeModels: 0
    }
  });

  // 计算属性
  const computedState = {
    // 买入推荐
    buyRecommendations: computed(() => 
      state.recommendations.filter(r => r.decision.decision_type === 'buy')
    ),
    
    // 卖出推荐
    sellRecommendations: computed(() => 
      state.recommendations.filter(r => r.decision.decision_type === 'sell')
    ),
    
    // 观望推荐
    holdRecommendations: computed(() => 
      state.recommendations.filter(r => r.decision.decision_type === 'hold')
    ),
    
    // 高置信度推荐（置信度 > 80%）
    highConfidenceRecommendations: computed(() => 
      state.recommendations.filter(r => r.decision.confidence > 0.8)
    ),
    
    // 按股票代码分组的推荐
    recommendationsBySymbol: computed(() => {
      const grouped: Record<string, Recommendation[]> = {};
      state.recommendations.forEach(recommendation => {
        const symbol = recommendation.stock.symbol;
        if (!grouped[symbol]) {
          grouped[symbol] = [];
        }
        grouped[symbol].push(recommendation);
      });
      return grouped;
    }),
    
    // 是否有推荐数据
    hasRecommendations: computed(() => state.recommendations.length > 0),
    
    // 是否正在加载
    isLoading: computed(() => state.loading),
    
    // 是否正在刷新
    isRefreshing: computed(() => state.refreshing)
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
     * 设置刷新状态
     */
    setRefreshing(refreshing: boolean) {
      state.refreshing = refreshing;
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
     * 选择推荐
     */
    selectRecommendation(recommendation: Recommendation | null) {
      state.selectedRecommendation = recommendation;
    },

    /**
     * 获取推荐列表
     */
    async fetchRecommendations(limit: number = 50) {
      state.loading = true;
      state.error = null;

      try {
        const response = await $fetch<any>('/api/decisions/recommendations', {
          method: 'GET',
          params: { limit }
        });

        if (response.status === 'success') {
          state.recommendations = response.data.data;
          actions.updateStatistics();
        } else {
          state.error = response.message || '获取推荐列表失败';
        }
      } catch (err: any) {
        state.error = err.message || '网络请求失败';
      } finally {
        state.loading = false;
      }
    },

    /**
     * 刷新推荐
     */
    async refreshRecommendations() {
      state.refreshing = true;
      state.error = null;

      try {
        const response = await $fetch<any>('/api/decisions/refresh', {
          method: 'POST'
        });

        if (response.status === 'success') {
          await actions.fetchRecommendations();
          return response.data.generated_count;
        } else {
          state.error = response.message || '刷新推荐失败';
          return 0;
        }
      } catch (err: any) {
        state.error = err.message || '刷新请求失败';
        return 0;
      } finally {
        state.refreshing = false;
      }
    },

    /**
     * 获取系统统计信息
     */
    async fetchSystemStatistics() {
      try {
        const response = await $fetch<any>('/api/decisions/statistics', {
          method: 'GET'
        });

        if (response.status === 'success') {
          const stats = response.data;
          state.systemStats = {
            totalStocks: stats.stock_statistics.total_stocks,
            stocksWithDecisions: stats.stock_statistics.stocks_with_decisions,
            buyDecisions: stats.decision_statistics.buy_decisions,
            sellDecisions: stats.decision_statistics.sell_decisions,
            holdDecisions: stats.decision_statistics.hold_decisions,
            totalModels: stats.model_statistics.total_models,
            activeModels: stats.model_statistics.active_models
          };
        }
      } catch (err) {
        console.error('获取系统统计信息失败:', err);
      }
    },

    /**
     * 更新推荐统计
     */
    updateStatistics() {
      const buyRecs = state.recommendations.filter(r => r.decision.decision_type === 'buy');
      const sellRecs = state.recommendations.filter(r => r.decision.decision_type === 'sell');
      const holdRecs = state.recommendations.filter(r => r.decision.decision_type === 'hold');
      
      state.statistics = {
        buyCount: buyRecs.length,
        sellCount: sellRecs.length,
        holdCount: holdRecs.length,
        avgConfidence: state.recommendations.length > 0 
          ? Number((state.recommendations.reduce((sum, r) => sum + r.decision.confidence, 0) / state.recommendations.length * 100).toFixed(1))
          : 0
      };
    },

    /**
     * 获取单个股票推荐
     */
    async fetchStockRecommendation(symbol: string) {
      state.loading = true;
      state.error = null;

      try {
        const response = await $fetch<any>(`/api/decisions/recommendations/${symbol}`, {
          method: 'GET'
        });

        if (response.status === 'success') {
          const recommendation = response.data;
          
          // 更新或添加到推荐列表
          const index = state.recommendations.findIndex(r => r.stock.symbol === symbol);
          if (index !== -1) {
            state.recommendations[index] = recommendation;
          } else {
            state.recommendations.push(recommendation);
          }
          
          actions.updateStatistics();
          return recommendation;
        } else {
          state.error = response.message || '获取股票推荐失败';
          return null;
        }
      } catch (err: any) {
        state.error = err.message || '网络请求失败';
        return null;
      } finally {
        state.loading = false;
      }
    },

    /**
     * 执行交易操作
     */
    async executeTrade(recommendation: Recommendation) {
      try {
        // 这里可以调用交易API
        console.log('执行交易:', recommendation);
        
        // 模拟交易执行
        return {
          success: true,
          message: `已为 ${recommendation.stock.symbol} 执行交易操作`
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message || '交易执行失败'
        };
      }
    },

    /**
     * 清除推荐缓存
     */
    clearCache() {
      state.recommendations = [];
      state.statistics = {
        buyCount: 0,
        sellCount: 0,
        holdCount: 0,
        avgConfidence: 0
      };
    },

    /**
     * 重置推荐状态
     */
    reset() {
      state.recommendations = [];
      state.loading = false;
      state.refreshing = false;
      state.error = null;
      state.selectedRecommendation = null;
      state.statistics = {
        buyCount: 0,
        sellCount: 0,
        holdCount: 0,
        avgConfidence: 0
      };
      state.systemStats = {
        totalStocks: 0,
        stocksWithDecisions: 0,
        buyDecisions: 0,
        sellDecisions: 0,
        holdDecisions: 0,
        totalModels: 0,
        activeModels: 0
      };
    }
  };

  return {
    ...toRefs(state),
    ...computedState,
    ...actions
  };
});