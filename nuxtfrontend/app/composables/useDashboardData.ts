/**
 * 仪表盘数据管理组合式函数
 * 提供仪表盘页面所需的数据获取、状态管理和实时更新功能
 */

import { ref, computed } from 'vue';
import { useStockStore } from '~/stores/stocks';
import { useDecisionStore } from '~/stores/decisions';
import { useModelStore } from '~/stores/models';
import { useCachedHealthApi } from '~/api/health';
// 使用本地定义的类型，因为API文件中的类型是接口定义
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime?: number;
      message?: string;
      lastChecked: string;
    };
  };
  system: {
    uptime: number;
    memoryUsage: number;
    cpuUsage?: number;
    diskUsage?: number;
  };
  version: string;
}

interface PerformanceMetrics {
  timestamp: string;
  metrics: {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    activeConnections: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  endpoints: {
    [endpoint: string]: {
      requestCount: number;
      errorCount: number;
      averageResponseTime: number;
    };
  };
}

// 仪表盘统计数据类型
interface DashboardStats {
  activeStocks: number;
  totalModels: number;
  decisionSuccessRate: number;
  systemStatus: 'healthy' | 'degraded' | 'unhealthy';
  totalDecisions: number;
  avgConfidence: number;
  systemUptime: number;
  memoryUsage: number;
}

// 实时决策数据类型
interface RealTimeDecision {
  symbol: string;
  decision: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// 模型性能数据类型
interface ModelPerformanceData {
  modelName: string;
  accuracy: number;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
  lastUpdated: string;
}

/**
 * 仪表盘数据管理组合式函数
 */
export const useDashboardData = () => {
  // Store实例
  const stockStore = useStockStore();
  const decisionStore = useDecisionStore();
  const modelStore = useModelStore();
  const healthApi = useCachedHealthApi();

  // 状态定义
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string>(new Date().toISOString());

  // 数据状态
  const dashboardStats = ref<DashboardStats>({
    activeStocks: 0,
    totalModels: 0,
    decisionSuccessRate: 0,
    systemStatus: 'healthy',
    totalDecisions: 0,
    avgConfidence: 0,
    systemUptime: 0,
    memoryUsage: 0,
  });

  const realTimeDecisions = ref<RealTimeDecision[]>([]);
  const modelPerformance = ref<ModelPerformanceData[]>([]);
  const systemHealth = ref<HealthCheckResponse | null>(null);
  const performanceMetrics = ref<PerformanceMetrics | null>(null);

  // 计算属性
  const computedState = {
    // 系统状态颜色
    systemStatusColor: computed(() => {
      switch (dashboardStats.value.systemStatus) {
        case 'healthy':
          return 'success';
        case 'degraded':
          return 'warning';
        case 'unhealthy':
          return 'error';
        default:
          return 'neutral';
      }
    }),

    // 决策成功率颜色
    successRateColor: computed(() => {
      const rate = dashboardStats.value.decisionSuccessRate;
      if (rate >= 80) return 'success';
      if (rate >= 60) return 'warning';
      return 'error';
    }),

    // 内存使用率颜色
    memoryUsageColor: computed(() => {
      const usage = dashboardStats.value.memoryUsage;
      if (usage < 70) return 'success';
      if (usage < 85) return 'warning';
      return 'error';
    }),

    // 是否有高风险决策
    hasHighRiskDecisions: computed(() =>
      realTimeDecisions.value.some(decision => decision.riskLevel === 'HIGH')
    ),

    // 性能趋势
    performanceTrend: computed(() => {
      // 模拟性能趋势数据
      return {
        labels: ['1h', '2h', '3h', '4h', '5h'],
        accuracy: [85, 87, 86, 88, 89],
        confidence: [78, 80, 82, 81, 83],
      };
    }),
  };

  // 数据获取方法
  const actions = {
    /**
     * 加载所有仪表盘数据
     */
    async loadDashboardData() {
      loading.value = true;
      error.value = null;

      try {
        // 并行加载所有数据
        await Promise.all([
          actions.loadStockStats(),
          actions.loadDecisionStats(),
          actions.loadModelStats(),
          actions.loadSystemHealth(),
          actions.loadRealTimeDecisions(),
          actions.loadModelPerformance(),
        ]);

        lastUpdated.value = new Date().toISOString();
      } catch (err) {
        error.value = `加载仪表盘数据失败: ${err instanceof Error ? err.message : '未知错误'}`;
        console.error('仪表盘数据加载错误:', err);
      } finally {
        loading.value = false;
      }
    },

    /**
     * 加载股票统计信息
     */
    async loadStockStats() {
      try {
        await stockStore.fetchStocksCached();
        dashboardStats.value.activeStocks = stockStore.activeStocks.length;
      } catch (err) {
        console.error('加载股票统计失败:', err);
      }
    },

    /**
     * 加载决策统计信息
     */
    async loadDecisionStats() {
      try {
        await decisionStore.fetchDecisionStatsCached();
        const stats = decisionStore.stats;

        dashboardStats.value.totalDecisions = stats.totalDecisions;
        dashboardStats.value.avgConfidence = stats.avgConfidence;
        dashboardStats.value.decisionSuccessRate = decisionStore.decisionSuccessRate;
      } catch (err) {
        console.error('加载决策统计失败:', err);
      }
    },

    /**
     * 加载模型统计信息
     */
    async loadModelStats() {
      try {
        await modelStore.fetchModelsCached();
        dashboardStats.value.totalModels = modelStore.stats.totalModels;
      } catch (err) {
        console.error('加载模型统计失败:', err);
      }
    },

    /**
     * 加载系统健康状态
     */
    async loadSystemHealth() {
      try {
        const health = await healthApi.checkHealth();
        systemHealth.value = health;

        dashboardStats.value.systemStatus = health.status;
        dashboardStats.value.systemUptime = health.system.uptime;
        dashboardStats.value.memoryUsage = health.system.memoryUsage;
      } catch (err) {
        console.error('加载系统健康状态失败:', err);
        dashboardStats.value.systemStatus = 'unhealthy';
      }
    },

    /**
     * 加载实时决策
     */
    async loadRealTimeDecisions() {
      try {
        // 获取最近决策
        const recentDecisions = decisionStore.recentDecisions.slice(0, 10);

        realTimeDecisions.value = recentDecisions.map(decision => ({
          symbol: decision.symbol,
          decision: decision.finalDecision.decision,
          confidence: decision.finalDecision.confidence,
          timestamp: decision.timestamp,
          riskLevel: decision.riskAssessment.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        }));
      } catch (err) {
        console.error('加载实时决策失败:', err);
      }
    },

    /**
     * 加载模型性能数据
     */
    async loadModelPerformance() {
      try {
        await modelStore.fetchAllModelPerformanceCached();

        // 转换性能数据格式
        modelPerformance.value = modelStore.models
          .map(model => {
            const performance = modelStore.modelPerformance.get(model.modelId);
            return {
              modelName: model.name,
              accuracy: performance?.metrics.accuracy || 0,
              totalReturn: performance?.metrics.totalReturn || 0,
              sharpeRatio: performance?.metrics.sharpeRatio || 0,
              winRate: performance?.metrics.winRate || 0,
              lastUpdated: performance?.lastUpdated || new Date().toISOString(),
            };
          })
          .filter(item => item.accuracy > 0); // 只显示有准确率数据的模型
      } catch (err) {
        console.error('加载模型性能失败:', err);
      }
    },

    /**
     * 刷新仪表盘数据
     */
    async refreshDashboard() {
      await actions.loadDashboardData();
    },

    /**
     * 清除错误信息
     */
    clearError() {
      error.value = null;
    },
  };

  // 自动刷新配置
  const autoRefresh = ref(false);
  const refreshInterval = ref(30000); // 30秒

  // 自动刷新逻辑
  const _refreshTimer: ReturnType<typeof setTimeout> | null = null;

  const startAutoRefresh = () => {
    // if (_refreshTimer) clearInterval(_refreshTimer)
    // autoRefresh.value = true
    // _refreshTimer = setInterval(() => {
    //   if (autoRefresh.value) {
    //     actions.refreshDashboard()
    //   }
    // }, refreshInterval.value)
  };

  const stopAutoRefresh = () => {
    autoRefresh.value = false;
    if (_refreshTimer) {
      clearInterval(_refreshTimer);
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    // 状态
    loading,
    error,
    lastUpdated,
    autoRefresh,
    refreshInterval,

    // 数据
    dashboardStats,
    realTimeDecisions,
    modelPerformance,
    systemHealth,
    performanceMetrics,

    // 计算属性
    ...computedState,

    // 方法
    ...actions,
    startAutoRefresh,
    stopAutoRefresh,
  };
};
