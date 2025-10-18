<template>
  <div class="performance-metrics">
    <!-- 指标头部 -->
    <div class="metrics-header">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">性能指标</h3>
      </slot>

      <!-- 指标操作 -->
      <div class="metrics-actions">
        <slot name="actions">
          <div class="flex items-center space-x-4">
            <select
              v-model="timeRange"
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1m">1个月</option>
              <option value="3m">3个月</option>
              <option value="6m">6个月</option>
              <option value="1y">1年</option>
              <option value="all">全部</option>
            </select>

            <button
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="$emit('export-metrics')"
            >
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              导出数据
            </button>
          </div>
        </slot>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="animate-pulse">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="n in 8" :key="n" class="bg-gray-200 rounded-lg p-4">
            <div class="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div class="h-6 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">加载失败</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能指标 -->
    <div v-else class="metrics-container">
      <!-- 核心指标 -->
      <div class="core-metrics">
        <h4 class="text-md font-medium text-gray-700 mb-4">核心指标</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- 总收益率 -->
          <div class="metric-card" :class="totalReturnClass">
            <div class="metric-icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-label">总收益率</div>
              <div class="metric-value">{{ formatPercent(backtestResult.totalReturn) }}</div>
              <div class="metric-description">累计投资回报</div>
            </div>
          </div>

          <!-- 年化收益率 -->
          <div class="metric-card" :class="annualReturnClass">
            <div class="metric-icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-label">年化收益率</div>
              <div class="metric-value">{{ formatPercent(backtestResult.annualReturn) }}</div>
              <div class="metric-description">年化投资回报</div>
            </div>
          </div>

          <!-- 夏普比率 -->
          <div class="metric-card">
            <div class="metric-icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-label">夏普比率</div>
              <div class="metric-value">{{ backtestResult.sharpeRatio.toFixed(2) }}</div>
              <div class="metric-description">风险调整后收益</div>
            </div>
          </div>

          <!-- 最大回撤 -->
          <div class="metric-card negative">
            <div class="metric-icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-label">最大回撤</div>
              <div class="metric-value">{{ formatPercent(backtestResult.maxDrawdown) }}</div>
              <div class="metric-description">最大亏损幅度</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 交易指标 -->
      <div class="trading-metrics">
        <h4 class="text-md font-medium text-gray-700 mb-4">交易指标</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- 胜率 -->
          <div class="metric-card">
            <div class="metric-icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-label">胜率</div>
              <div class="metric-value">{{ formatPercent(backtestResult.winRate) }}</div>
              <div class="metric-description">盈利交易比例</div>
            </div>
          </div>

          <!-- 盈亏比 -->
          <div class="metric-card">
            <div class="metric-icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-label">盈亏比</div>
              <div class="metric-value">{{ backtestResult.profitFactor.toFixed(2) }}</div>
              <div class="metric-description">盈利/亏损比率</div>
            </div>
          </div>

          <!-- 总交易次数 -->
          <div class="metric-card">
            <div class="metric-icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-label">总交易次数</div>
              <div class="metric-value">{{ backtestResult.totalTrades }}</div>
              <div class="metric-description">交易总次数</div>
            </div>
          </div>

          <!-- 平均每笔收益 -->
          <div class="metric-card" :class="avgProfitClass">
            <div class="metric-icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="metric-content">
              <div class="metric-label">平均每笔收益</div>
              <div class="metric-value">{{ formatCurrency(backtestResult.avgProfitPerTrade) }}</div>
              <div class="metric-description">平均交易收益</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细统计 -->
      <div class="detailed-stats">
        <h4 class="text-md font-medium text-gray-700 mb-4">详细统计</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">盈利交易</span>
            <span class="stat-value">{{ backtestResult.winningTrades }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">亏损交易</span>
            <span class="stat-value">{{ backtestResult.losingTrades }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均盈利</span>
            <span class="stat-value positive">{{
              formatCurrency(backtestResult.avgProfitPerTrade)
            }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均亏损</span>
            <span class="stat-value negative">{{
              formatCurrency(backtestResult.avgLossPerTrade)
            }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">波动率</span>
            <span class="stat-value">{{ formatPercent(backtestResult.volatility) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">交易频率</span>
            <span class="stat-value">{{ tradingFrequency }}</span>
          </div>
        </div>
      </div>

      <!-- 自定义指标插槽 -->
      <slot name="custom-metrics" :backtest-result="backtestResult"></slot>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && !backtestResult" class="empty-state">
      <div class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">暂无性能数据</h3>
        <p class="mt-1 text-sm text-gray-500">请先运行回测以查看性能指标。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BacktestResult } from '~/types/backtest';

interface Props {
  backtestResult?: BacktestResult | null;
  loading?: boolean;
  error?: string;
  timeRange?: string;
}

interface Emits {
  (e: 'time-range-change', range: string): void;
  (e: 'export-metrics'): void;
}

const props = withDefaults(defineProps<Props>(), {
  backtestResult: null,
  loading: false,
  error: '',
  timeRange: 'all',
});

const emit = defineEmits<Emits>();

// 时间范围
const timeRange = ref(props.timeRange);

// 样式计算
const totalReturnClass = computed(() => {
  if (!props.backtestResult) return '';
  return props.backtestResult.totalReturn >= 0 ? 'positive' : 'negative';
});

const annualReturnClass = computed(() => {
  if (!props.backtestResult) return '';
  return props.backtestResult.annualReturn >= 0 ? 'positive' : 'negative';
});

const avgProfitClass = computed(() => {
  if (!props.backtestResult) return '';
  return props.backtestResult.avgProfitPerTrade >= 0 ? 'positive' : 'negative';
});

// 交易频率计算
const tradingFrequency = computed(() => {
  if (
    !props.backtestResult ||
    !props.backtestResult.trades ||
    props.backtestResult.trades.length === 0
  )
    return 'N/A';

  const firstTradeDate = new Date(props.backtestResult.trades[0].date);
  const lastTradeDate = new Date(
    props.backtestResult.trades[props.backtestResult.trades.length - 1].date
  );
  const totalDays = Math.ceil(
    (lastTradeDate.getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (totalDays === 0) return 'N/A';

  const frequency = props.backtestResult.totalTrades / totalDays;
  return frequency.toFixed(2) + '次/天';
});

// 格式化函数
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

const formatCurrency = (value: number) => {
  return `¥${value.toFixed(2)}`;
};

// 监听时间范围变化
watch(timeRange, newVal => {
  emit('time-range-change', newVal);
});

// 监听props变化
watch(
  () => props.timeRange,
  newVal => {
    timeRange.value = newVal;
  }
);
</script>

<style scoped>
.performance-metrics {
  @apply bg-white shadow rounded-lg p-6;
}

.metrics-header {
  @apply flex justify-between items-center mb-6 pb-4 border-b border-gray-200;
}

.metrics-actions {
  @apply flex items-center space-x-4;
}

.loading-state {
  @apply space-y-4;
}

.error-state {
  @apply mb-6;
}

.metrics-container {
  @apply space-y-6;
}

.core-metrics,
.trading-metrics,
.detailed-stats {
  @apply space-y-4;
}

.metric-card {
  @apply bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-4 transition-colors duration-200;
}

.metric-card.positive {
  @apply border-green-200 bg-green-50;
}

.metric-card.negative {
  @apply border-red-200 bg-red-50;
}

.metric-icon {
  @apply flex-shrink-0;
}

.metric-content {
  @apply flex-1;
}

.metric-label {
  @apply text-sm font-medium text-gray-700;
}

.metric-value {
  @apply text-xl font-bold text-gray-900 mt-1;
}

.metric-card.positive .metric-value {
  @apply text-green-600;
}

.metric-card.negative .metric-value {
  @apply text-red-600;
}

.metric-description {
  @apply text-xs text-gray-500 mt-1;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4;
}

.stat-item {
  @apply flex flex-col items-center p-3 border border-gray-200 rounded-lg;
}

.stat-label {
  @apply text-xs text-gray-500 mb-1;
}

.stat-value {
  @apply text-sm font-medium text-gray-900;
}

.stat-value.positive {
  @apply text-green-600;
}

.stat-value.negative {
  @apply text-red-600;
}

.empty-state {
  @apply border-t border-gray-200;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .metrics-header {
    @apply flex-col items-start space-y-4;
  }

  .metrics-actions {
    @apply w-full justify-start;
  }

  .core-metrics .grid,
  .trading-metrics .grid {
    @apply grid-cols-1 gap-3;
  }

  .stats-grid {
    @apply grid-cols-2 gap-3;
  }

  .metric-card {
    @apply flex-col items-start space-y-3;
  }
}
</style>
