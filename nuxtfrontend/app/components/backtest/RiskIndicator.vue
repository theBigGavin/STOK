<template>
  <div class="risk-indicator">
    <!-- 风险指示器头部 -->
    <div class="indicator-header">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">风险指示器</h3>
      </slot>

      <!-- 风险操作 -->
      <div class="indicator-actions">
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
            </select>
          </div>
        </slot>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 rounded w-1/3"></div>
        <div class="h-32 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        <div class="h-20 bg-gray-200 rounded"></div>
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

    <!-- 风险指示器内容 -->
    <div v-else class="indicator-content">
      <!-- 总体风险评估 -->
      <div class="overall-risk">
        <h4 class="text-md font-medium text-gray-700 mb-4">总体风险评估</h4>
        <div class="risk-level">
          <div class="risk-gauge">
            <div class="gauge-background"></div>
            <div
              class="gauge-fill"
              :class="riskLevelClass"
              :style="{ transform: `rotate(${gaugeRotation}deg)` }"
            ></div>
            <div class="gauge-center">
              <div class="risk-score">{{ overallRiskScore }}</div>
              <div class="risk-label">{{ overallRiskLabel }}</div>
            </div>
          </div>
          <div class="risk-description">
            <p class="text-sm text-gray-600">{{ riskDescription }}</p>
          </div>
        </div>
      </div>

      <!-- 风险指标 -->
      <div class="risk-metrics">
        <h4 class="text-md font-medium text-gray-700 mb-4">风险指标</h4>
        <div class="metrics-grid">
          <!-- 波动率风险 -->
          <div class="metric-item">
            <div class="metric-header">
              <span class="metric-label">波动率风险</span>
              <span class="metric-value" :class="volatilityRiskClass">
                {{ volatilityRiskLabel }}
              </span>
            </div>
            <div class="metric-bar">
              <div
                class="metric-progress"
                :class="volatilityRiskClass"
                :style="{ width: `${volatilityRiskScore}%` }"
              ></div>
            </div>
            <div class="metric-description">基于历史波动率评估的市场风险</div>
          </div>

          <!-- 回撤风险 -->
          <div class="metric-item">
            <div class="metric-header">
              <span class="metric-label">回撤风险</span>
              <span class="metric-value" :class="drawdownRiskClass">
                {{ drawdownRiskLabel }}
              </span>
            </div>
            <div class="metric-bar">
              <div
                class="metric-progress"
                :class="drawdownRiskClass"
                :style="{ width: `${drawdownRiskScore}%` }"
              ></div>
            </div>
            <div class="metric-description">基于最大回撤评估的亏损风险</div>
          </div>

          <!-- 流动性风险 -->
          <div class="metric-item">
            <div class="metric-header">
              <span class="metric-label">流动性风险</span>
              <span class="metric-value" :class="liquidityRiskClass">
                {{ liquidityRiskLabel }}
              </span>
            </div>
            <div class="metric-bar">
              <div
                class="metric-progress"
                :class="liquidityRiskClass"
                :style="{ width: `${liquidityRiskScore}%` }"
              ></div>
            </div>
            <div class="metric-description">基于交易频率和成交量的流动性风险</div>
          </div>

          <!-- 集中度风险 -->
          <div class="metric-item">
            <div class="metric-header">
              <span class="metric-label">集中度风险</span>
              <span class="metric-value" :class="concentrationRiskClass">
                {{ concentrationRiskLabel }}
              </span>
            </div>
            <div class="metric-bar">
              <div
                class="metric-progress"
                :class="concentrationRiskClass"
                :style="{ width: `${concentrationRiskScore}%` }"
              ></div>
            </div>
            <div class="metric-description">基于持仓集中度的分散风险</div>
          </div>
        </div>
      </div>

      <!-- 风险预警 -->
      <div v-if="hasWarnings" class="risk-warnings">
        <h4 class="text-md font-medium text-gray-700 mb-4">风险预警</h4>
        <div class="warnings-list">
          <div
            v-for="warning in riskWarnings"
            :key="warning.type"
            class="warning-item"
            :class="warning.severity"
          >
            <div class="warning-icon">
              <svg
                v-if="warning.severity === 'high'"
                class="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="warning.severity === 'medium'"
                class="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg v-else class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="warning-content">
              <div class="warning-title">{{ warning.title }}</div>
              <div class="warning-description">{{ warning.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险建议 -->
      <div class="risk-recommendations">
        <h4 class="text-md font-medium text-gray-700 mb-4">风险建议</h4>
        <div class="recommendations-list">
          <div
            v-for="recommendation in riskRecommendations"
            :key="recommendation.type"
            class="recommendation-item"
          >
            <div class="recommendation-icon">
              <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="recommendation-content">
              {{ recommendation.text }}
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义风险内容插槽 -->
      <slot name="custom-risk" :risk-data="riskData"></slot>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && !riskData" class="empty-state">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">暂无风险数据</h3>
        <p class="mt-1 text-sm text-gray-500">请先运行回测以查看风险指标。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BacktestResult } from '~/types/backtest';

interface RiskData {
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  var95?: number;
  cvar95?: number;
  tradingFrequency: number;
  positionConcentration: number;
}

interface Props {
  riskData?: RiskData | null;
  backtestResult?: BacktestResult | null;
  loading?: boolean;
  error?: string;
  timeRange?: string;
}

interface Emits {
  (e: 'time-range-change', range: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  riskData: null,
  backtestResult: null,
  loading: false,
  error: '',
  timeRange: '1m',
});

const emit = defineEmits<Emits>();

// 时间范围
const timeRange = ref(props.timeRange);

// 总体风险评估
const overallRiskScore = computed(() => {
  if (!props.riskData) return 0;

  const scores = [
    volatilityRiskScore.value,
    drawdownRiskScore.value,
    liquidityRiskScore.value,
    concentrationRiskScore.value,
  ];

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
});

const overallRiskLabel = computed(() => {
  const score = overallRiskScore.value;
  if (score >= 80) return '极高风险';
  if (score >= 60) return '高风险';
  if (score >= 40) return '中等风险';
  if (score >= 20) return '低风险';
  return '极低风险';
});

const riskLevelClass = computed(() => {
  const score = overallRiskScore.value;
  if (score >= 80) return 'risk-high';
  if (score >= 60) return 'risk-medium-high';
  if (score >= 40) return 'risk-medium';
  if (score >= 20) return 'risk-low';
  return 'risk-very-low';
});

const gaugeRotation = computed(() => {
  return (overallRiskScore.value / 100) * 180 - 90;
});

const riskDescription = computed(() => {
  const score = overallRiskScore.value;
  if (score >= 80) return '投资风险极高，建议谨慎操作或避免投资';
  if (score >= 60) return '投资风险较高，建议严格控制仓位和止损';
  if (score >= 40) return '投资风险适中，建议适度分散投资';
  if (score >= 20) return '投资风险较低，适合稳健型投资者';
  return '投资风险极低，适合保守型投资者';
});

// 波动率风险
const volatilityRiskScore = computed(() => {
  if (!props.riskData) return 0;
  return Math.min(props.riskData.volatility * 200, 100);
});

const volatilityRiskLabel = computed(() => {
  const score = volatilityRiskScore.value;
  if (score >= 80) return '极高';
  if (score >= 60) return '高';
  if (score >= 40) return '中';
  if (score >= 20) return '低';
  return '极低';
});

const volatilityRiskClass = computed(() => {
  const score = volatilityRiskScore.value;
  if (score >= 80) return 'risk-high';
  if (score >= 60) return 'risk-medium-high';
  if (score >= 40) return 'risk-medium';
  if (score >= 20) return 'risk-low';
  return 'risk-very-low';
});

// 回撤风险
const drawdownRiskScore = computed(() => {
  if (!props.riskData) return 0;
  return Math.min(props.riskData.maxDrawdown * 200, 100);
});

const drawdownRiskLabel = computed(() => {
  const score = drawdownRiskScore.value;
  if (score >= 80) return '极高';
  if (score >= 60) return '高';
  if (score >= 40) return '中';
  if (score >= 20) return '低';
  return '极低';
});

const drawdownRiskClass = computed(() => {
  const score = drawdownRiskScore.value;
  if (score >= 80) return 'risk-high';
  if (score >= 60) return 'risk-medium-high';
  if (score >= 40) return 'risk-medium';
  if (score >= 20) return 'risk-low';
  return 'risk-very-low';
});

// 流动性风险
const liquidityRiskScore = computed(() => {
  if (!props.riskData) return 0;
  // 交易频率越低，流动性风险越高
  return Math.max(0, 100 - props.riskData.tradingFrequency * 10);
});

const liquidityRiskLabel = computed(() => {
  const score = liquidityRiskScore.value;
  if (score >= 80) return '极高';
  if (score >= 60) return '高';
  if (score >= 40) return '中';
  if (score >= 20) return '低';
  return '极低';
});

const liquidityRiskClass = computed(() => {
  const score = liquidityRiskScore.value;
  if (score >= 80) return 'risk-high';
  if (score >= 60) return 'risk-medium-high';
  if (score >= 40) return 'risk-medium';
  if (score >= 20) return 'risk-low';
  return 'risk-very-low';
});

// 集中度风险
const concentrationRiskScore = computed(() => {
  if (!props.riskData) return 0;
  return Math.min(props.riskData.positionConcentration * 100, 100);
});

const concentrationRiskLabel = computed(() => {
  const score = concentrationRiskScore.value;
  if (score >= 80) return '极高';
  if (score >= 60) return '高';
  if (score >= 40) return '中';
  if (score >= 20) return '低';
  return '极低';
});

const concentrationRiskClass = computed(() => {
  const score = concentrationRiskScore.value;
  if (score >= 80) return 'risk-high';
  if (score >= 60) return 'risk-medium-high';
  if (score >= 40) return 'risk-medium';
  if (score >= 20) return 'risk-low';
  return 'risk-very-low';
});

// 风险预警
const riskWarnings = computed(() => {
  const warnings = [];

  if (volatilityRiskScore.value >= 80) {
    warnings.push({
      type: 'volatility',
      severity: 'high',
      title: '高波动率风险',
      description: '价格波动剧烈，投资风险极高',
    });
  }

  if (drawdownRiskScore.value >= 80) {
    warnings.push({
      type: 'drawdown',
      severity: 'high',
      title: '高回撤风险',
      description: '历史最大回撤超过40%，亏损风险极高',
    });
  }

  if (liquidityRiskScore.value >= 60) {
    warnings.push({
      type: 'liquidity',
      severity: 'medium',
      title: '流动性风险',
      description: '交易频率较低，可能存在流动性问题',
    });
  }

  if (concentrationRiskScore.value >= 70) {
    warnings.push({
      type: 'concentration',
      severity: 'medium',
      title: '集中度风险',
      description: '持仓过于集中，分散化不足',
    });
  }

  return warnings;
});

const hasWarnings = computed(() => {
  return riskWarnings.value.length > 0;
});

// 风险建议
const riskRecommendations = computed(() => {
  const recommendations = [];

  if (overallRiskScore.value >= 60) {
    recommendations.push({
      type: 'position',
      text: '建议降低仓位至30%以下，严格控制风险',
    });
  }

  if (volatilityRiskScore.value >= 60) {
    recommendations.push({
      type: 'volatility',
      text: '建议设置更严格的止损点，控制单次亏损',
    });
  }

  if (drawdownRiskScore.value >= 60) {
    recommendations.push({
      type: 'drawdown',
      text: '建议分散投资，避免单一资产过度集中',
    });
  }

  if (concentrationRiskScore.value >= 50) {
    recommendations.push({
      type: 'diversification',
      text: '建议增加投资品种，提高投资组合多样性',
    });
  }

  return recommendations;
});

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
.risk-indicator {
  @apply bg-white shadow rounded-lg p-6;
}

.indicator-header {
  @apply flex justify-between items-center mb-6 pb-4 border-b border-gray-200;
}

.indicator-actions {
  @apply flex items-center space-x-4;
}

.loading-state {
  @apply space-y-4;
}

.error-state {
  @apply mb-6;
}

.indicator-content {
  @apply space-y-6;
}

.overall-risk {
  @apply space-y-4;
}

.risk-level {
  @apply flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8;
}

.risk-gauge {
  @apply relative w-48 h-24;
}

.gauge-background {
  @apply absolute w-full h-full bg-gray-200 rounded-t-full;
}

.gauge-fill {
  @apply absolute w-full h-full bg-blue-500 rounded-t-full origin-bottom transition-transform duration-500;
}

.gauge-fill.risk-very-low {
  @apply bg-green-500;
}

.gauge-fill.risk-low {
  @apply bg-blue-500;
}

.gauge-fill.risk-medium {
  @apply bg-yellow-500;
}

.gauge-fill.risk-medium-high {
  @apply bg-orange-500;
}

.gauge-fill.risk-high {
  @apply bg-red-500;
}

.gauge-center {
  @apply absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center;
}

.risk-score {
  @apply text-2xl font-bold text-gray-900;
}

.risk-label {
  @apply text-sm text-gray-600;
}

.risk-description {
  @apply flex-1;
}

.risk-metrics {
  @apply space-y-4;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.metric-item {
  @apply p-4 border border-gray-200 rounded-lg;
}

.metric-header {
  @apply flex justify-between items-center mb-2;
}

.metric-label {
  @apply text-sm font-medium text-gray-700;
}

.metric-value {
  @apply text-sm font-medium;
}

.metric-value.risk-very-low {
  @apply text-green-600;
}

.metric-value.risk-low {
  @apply text-blue-600;
}

.metric-value.risk-medium {
  @apply text-yellow-600;
}

.metric-value.risk-medium-high {
  @apply text-orange-600;
}

.metric-value.risk-high {
  @apply text-red-600;
}

.metric-bar {
  @apply w-full bg-gray-200 rounded-full h-2 mb-2;
}

.metric-progress {
  @apply h-2 rounded-full transition-all duration-500;
}

.metric-progress.risk-very-low {
  @apply bg-green-500;
}

.metric-progress.risk-low {
  @apply bg-blue-500;
}

.metric-progress.risk-medium {
  @apply bg-yellow-500;
}

.metric-progress.risk-medium-high {
  @apply bg-orange-500;
}

.metric-progress.risk-high {
  @apply bg-red-500;
}

.metric-description {
  @apply text-xs text-gray-500;
}

.risk-warnings {
  @apply space-y-4;
}

.warnings-list {
  @apply space-y-3;
}

.warning-item {
  @apply flex items-start space-x-3 p-3 border rounded-lg;
}

.warning-item.high {
  @apply border-red-200 bg-red-50;
}

.warning-item.medium {
  @apply border-yellow-200 bg-yellow-50;
}

.warning-item.low {
  @apply border-blue-200 bg-blue-50;
}

.warning-icon {
  @apply flex-shrink-0 mt-0.5;
}

.warning-content {
  @apply flex-1;
}

.warning-title {
  @apply text-sm font-medium text-gray-900;
}

.warning-description {
  @apply text-sm text-gray-600 mt-1;
}

.risk-recommendations {
  @apply space-y-4;
}

.recommendations-list {
  @apply space-y-2;
}

.recommendation-item {
  @apply flex items-center space-x-3 p-2;
}

.recommendation-icon {
  @apply flex-shrink-0;
}

.recommendation-content {
  @apply text-sm text-gray-700;
}

.empty-state {
  @apply border-t border-gray-200;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .indicator-header {
    @apply flex-col items-start space-y-4;
  }

  .indicator-actions {
    @apply w-full justify-start;
  }

  .risk-level {
    @apply flex-col items-center;
  }

  .metrics-grid {
    @apply grid-cols-1 gap-3;
  }

  .warning-item {
    @apply flex-col items-start space-y-2;
  }
}
</style>
