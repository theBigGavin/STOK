<template>
  <div class="decision-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <slot name="header">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="decision-main">
              <h3 class="text-lg font-semibold text-gray-900">{{ decision.symbol }}</h3>
              <p class="text-sm text-gray-500">{{ decision.tradeDate }}</p>
            </div>
            <div class="decision-badge" :class="decisionBadgeClass">
              {{ decisionLabel }}
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <span class="confidence-badge" :class="confidenceClass">
              {{ confidenceText }}
            </span>
            <span class="risk-badge" :class="riskBadgeClass">
              {{ riskLabel }}
            </span>
            <slot name="header-actions" :decision="decision"></slot>
          </div>
        </div>
      </slot>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <slot name="content">
        <!-- 投票分布 -->
        <div class="vote-distribution">
          <h4 class="text-sm font-medium text-gray-700 mb-3">模型投票分布</h4>
          <div class="vote-bars">
            <div v-for="vote in voteDistribution" :key="vote.type" class="vote-bar-item">
              <div class="vote-info">
                <span class="vote-label" :class="vote.colorClass">{{ vote.label }}</span>
                <span class="vote-count">{{ vote.count }}票</span>
                <span class="vote-percentage">{{ vote.percentage }}%</span>
              </div>
              <div class="vote-bar">
                <div
                  class="vote-progress"
                  :class="vote.colorClass"
                  :style="{ width: `${vote.percentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 模型详情 -->
        <div class="model-details">
          <h4 class="text-sm font-medium text-gray-700 mb-3">模型决策详情</h4>
          <div class="model-list">
            <div
              v-for="model in decision.finalDecision.modelDetails"
              :key="model.modelId"
              class="model-item"
            >
              <div class="model-info">
                <span class="model-name">{{ model.modelName }}</span>
                <span class="model-decision" :class="modelDecisionClass(model.decision)">
                  {{ model.decision }}
                </span>
              </div>
              <div class="model-metrics">
                <span class="metric confidence">
                  置信度: {{ (model.confidence * 100).toFixed(1) }}%
                </span>
                <span class="metric strength">
                  信号强度: {{ model.signalStrength.toFixed(2) }}
                </span>
              </div>
              <div v-if="model.reasoning" class="model-reasoning">
                <p class="text-xs text-gray-600">{{ model.reasoning }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 最终决策说明 -->
        <div class="final-decision">
          <h4 class="text-sm font-medium text-gray-700 mb-2">最终决策说明</h4>
          <p class="text-sm text-gray-600">{{ decision.finalDecision.reasoning }}</p>
        </div>

        <!-- 风险评估 -->
        <div v-if="decision.riskAssessment" class="risk-assessment">
          <h4 class="text-sm font-medium text-gray-700 mb-2">风险评估</h4>
          <div class="risk-details">
            <div class="risk-status">
              <span
                class="status-badge"
                :class="decision.riskAssessment.isApproved ? 'approved' : 'rejected'"
              >
                {{ decision.riskAssessment.isApproved ? '通过' : '拒绝' }}
              </span>
            </div>
            <div v-if="decision.riskAssessment.warnings.length > 0" class="risk-warnings">
              <p class="text-xs text-yellow-600 font-medium">警告:</p>
              <ul class="text-xs text-yellow-600 list-disc list-inside">
                <li v-for="warning in decision.riskAssessment.warnings" :key="warning">
                  {{ warning }}
                </li>
              </ul>
            </div>
            <div class="risk-suggestions">
              <p class="text-xs text-gray-600">
                建议仓位: {{ decision.riskAssessment.positionSuggestion }}%
              </p>
            </div>
          </div>
        </div>

        <!-- 自定义内容插槽 -->
        <slot name="custom-content" :decision="decision"></slot>
      </slot>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <slot name="footer" :decision="decision">
        <div class="footer-actions">
          <button
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('view-details', decision)"
          >
            查看详情
          </button>
          <button
            v-if="decision.riskAssessment.isApproved"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            @click="$emit('execute-trade', decision)"
          >
            执行交易
          </button>
          <button
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('backtest-decision', decision)"
          >
            回测分析
          </button>
          <slot name="extra-actions" :decision="decision"></slot>
        </div>
      </slot>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <svg
          class="animate-spin h-5 w-5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="ml-2 text-sm text-gray-600">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <div class="error-message">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="ml-2 text-sm text-red-600">{{ error }}</span>
        <button
          class="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          @click="$emit('retry', decision)"
        >
          重试
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DecisionResult } from '~/types/decisions';

interface Props {
  decision: DecisionResult;
  loading?: boolean;
  error?: string;
  showRiskAssessment?: boolean;
  showModelDetails?: boolean;
}

interface Emits {
  (
    e: 'view-details' | 'execute-trade' | 'backtest-decision' | 'retry',
    decision: DecisionResult
  ): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  showRiskAssessment: true,
  showModelDetails: true,
});

defineEmits<Emits>();

// 决策标签和样式
const decisionLabel = computed(() => {
  const labelMap: Record<string, string> = {
    BUY: '买入',
    SELL: '卖出',
    HOLD: '持有',
  };
  return labelMap[props.decision.finalDecision.decision] || props.decision.finalDecision.decision;
});

const decisionBadgeClass = computed(() => {
  const classMap: Record<string, string> = {
    BUY: 'bg-green-100 text-green-800 border-green-200',
    SELL: 'bg-red-100 text-red-800 border-red-200',
    HOLD: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return `decision-badge-base ${classMap[props.decision.finalDecision.decision] || 'bg-gray-100 text-gray-800 border-gray-200'}`;
});

// 置信度样式
const confidenceText = computed(() => {
  return `${(props.decision.finalDecision.confidence * 100).toFixed(1)}%`;
});

const confidenceClass = computed(() => {
  const confidence = props.decision.finalDecision.confidence;
  if (confidence >= 0.8) return 'confidence-high';
  if (confidence >= 0.6) return 'confidence-medium';
  return 'confidence-low';
});

// 风险标签和样式
const riskLabel = computed(() => {
  const labelMap: Record<string, string> = {
    LOW: '低风险',
    MEDIUM: '中风险',
    HIGH: '高风险',
  };
  return labelMap[props.decision.finalDecision.riskLevel] || props.decision.finalDecision.riskLevel;
});

const riskBadgeClass = computed(() => {
  const classMap: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  };
  return classMap[props.decision.finalDecision.riskLevel] || 'bg-gray-100 text-gray-800';
});

// 投票分布
const voteDistribution = computed(() => {
  const { BUY, SELL, HOLD } = props.decision.finalDecision.voteSummary;
  const total = BUY + SELL + HOLD;

  return [
    {
      type: 'BUY',
      label: '买入',
      count: BUY,
      percentage: total > 0 ? Math.round((BUY / total) * 100) : 0,
      colorClass: 'vote-buy',
    },
    {
      type: 'SELL',
      label: '卖出',
      count: SELL,
      percentage: total > 0 ? Math.round((SELL / total) * 100) : 0,
      colorClass: 'vote-sell',
    },
    {
      type: 'HOLD',
      label: '持有',
      count: HOLD,
      percentage: total > 0 ? Math.round((HOLD / total) * 100) : 0,
      colorClass: 'vote-hold',
    },
  ];
});

// 模型决策样式
const modelDecisionClass = (decision: string) => {
  const classMap: Record<string, string> = {
    BUY: 'model-decision-buy',
    SELL: 'model-decision-sell',
    HOLD: 'model-decision-hold',
  };
  return classMap[decision] || 'model-decision-hold';
};
</script>

<style scoped>
.decision-card {
  @apply bg-white shadow rounded-lg p-6 relative;
  min-height: 300px;
}

.card-header {
  @apply mb-6 pb-4 border-b border-gray-200;
}

.card-content {
  @apply mb-6 space-y-6;
}

.card-footer {
  @apply pt-4 border-t border-gray-200;
}

.decision-main h3 {
  @apply text-lg font-semibold text-gray-900;
}

.decision-main p {
  @apply text-sm text-gray-500;
}

.decision-badge-base {
  @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border;
}

.confidence-badge {
  @apply inline-flex items-center px-2 py-1 rounded text-xs font-medium;
}

.confidence-high {
  @apply bg-green-100 text-green-800;
}

.confidence-medium {
  @apply bg-yellow-100 text-yellow-800;
}

.confidence-low {
  @apply bg-red-100 text-red-800;
}

.risk-badge {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
}

/* 投票分布样式 */
.vote-distribution {
  @apply space-y-3;
}

.vote-bars {
  @apply space-y-2;
}

.vote-bar-item {
  @apply space-y-1;
}

.vote-info {
  @apply flex justify-between items-center text-xs;
}

.vote-label {
  @apply font-medium;
}

.vote-count {
  @apply text-gray-500;
}

.vote-percentage {
  @apply font-medium text-gray-700;
}

.vote-bar {
  @apply w-full bg-gray-200 rounded-full h-2;
}

.vote-progress {
  @apply h-2 rounded-full transition-all duration-500;
}

.vote-buy {
  @apply bg-green-500;
}

.vote-sell {
  @apply bg-red-500;
}

.vote-hold {
  @apply bg-gray-500;
}

/* 模型详情样式 */
.model-details {
  @apply space-y-3;
}

.model-list {
  @apply space-y-3;
}

.model-item {
  @apply p-3 border border-gray-200 rounded-lg;
}

.model-info {
  @apply flex justify-between items-center mb-2;
}

.model-name {
  @apply text-sm font-medium text-gray-700;
}

.model-decision {
  @apply text-xs font-medium px-2 py-1 rounded;
}

.model-decision-buy {
  @apply bg-green-100 text-green-800;
}

.model-decision-sell {
  @apply bg-red-100 text-red-800;
}

.model-decision-hold {
  @apply bg-gray-100 text-gray-800;
}

.model-metrics {
  @apply flex space-x-4 text-xs text-gray-500;
}

.model-reasoning {
  @apply mt-2 pt-2 border-t border-gray-100;
}

/* 风险评估样式 */
.risk-assessment {
  @apply space-y-3;
}

.risk-details {
  @apply space-y-2;
}

.risk-status {
  @apply mb-2;
}

.status-badge {
  @apply inline-flex items-center px-2 py-1 rounded text-xs font-medium;
}

.status-badge.approved {
  @apply bg-green-100 text-green-800;
}

.status-badge.rejected {
  @apply bg-red-100 text-red-800;
}

.risk-warnings {
  @apply space-y-1;
}

.risk-suggestions {
  @apply text-xs text-gray-600;
}

/* 底部操作按钮 */
.footer-actions {
  @apply flex space-x-3;
}

/* 加载和错误状态 */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg;
}

.loading-spinner {
  @apply flex items-center;
}

.error-overlay {
  @apply absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg;
}

.error-message {
  @apply flex items-center;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .card-header .flex.items-center.justify-between {
    @apply flex-col items-start space-y-3;
  }

  .vote-info {
    @apply flex-col items-start space-y-1;
  }

  .model-info {
    @apply flex-col items-start space-y-2;
  }

  .model-metrics {
    @apply flex-col space-x-0 space-y-1;
  }

  .footer-actions {
    @apply flex-col space-x-0 space-y-2;
  }

  .footer-actions button {
    @apply w-full justify-center;
  }
}
</style>
