<template>
  <div class="decision-list">
    <!-- 列表头部 -->
    <div class="list-header">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">AI选股推荐</h3>
      </slot>

      <!-- 筛选和排序控制 -->
      <div class="controls">
        <slot name="controls">
          <div class="flex items-center space-x-4">
            <select
              v-model="filterDecision"
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部推荐</option>
              <option value="buy">买入推荐</option>
              <option value="sell">卖出推荐</option>
              <option value="hold">观望推荐</option>
            </select>

            <select
              v-model="sortBy"
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="confidence">置信度</option>
              <option value="votes">投票数</option>
              <option value="symbol">股票代码</option>
            </select>

            <button
              @click="refreshRecommendations"
              :disabled="refreshing"
              class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ refreshing ? '刷新中...' : '刷新推荐' }}
            </button>
          </div>
        </slot>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="animate-pulse space-y-4">
        <div v-for="n in 5" :key="n" class="bg-gray-200 rounded-lg p-4">
          <div class="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div class="h-3 bg-gray-300 rounded w-3/4"></div>
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

    <!-- 推荐列表 -->
    <div v-else class="list-container">
      <ul class="divide-y divide-gray-200">
        <li
          v-for="recommendation in filteredAndSortedRecommendations"
          :key="recommendation.stock.id"
          class="recommendation-item hover:bg-gray-50 transition-colors duration-150"
        >
          <div class="px-4 py-4 sm:px-6">
            <div class="flex items-center justify-between">
              <!-- 股票信息 -->
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div
                    class="decision-badge"
                    :class="decisionBadgeClass(recommendation.decision.decision_type)"
                  >
                    {{ decisionLabel(recommendation.decision.decision_type) }}
                  </div>
                </div>
                <div class="ml-4">
                  <div class="flex items-center">
                    <p class="text-sm font-medium text-gray-900">
                      {{ recommendation.stock.symbol }}
                    </p>
                    <span class="ml-2 text-xs text-gray-500">{{ recommendation.stock.name }}</span>
                  </div>
                  <div class="flex items-center space-x-4 mt-1">
                    <p class="text-sm text-gray-500">
                      置信度: {{ (recommendation.decision.confidence * 100).toFixed(1) }}%
                    </p>
                    <p v-if="recommendation.stock.current_price" class="text-sm text-gray-500">
                      当前价: ¥{{ recommendation.stock.current_price.toFixed(2) }}
                    </p>
                    <p
                      v-if="recommendation.stock.price_change_percent"
                      class="text-sm"
                      :class="
                        recommendation.stock.price_change_percent >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      "
                    >
                      {{ recommendation.stock.price_change_percent >= 0 ? '+' : ''
                      }}{{ recommendation.stock.price_change_percent.toFixed(2) }}%
                    </p>
                  </div>
                </div>
              </div>

              <!-- 投票分布 -->
              <div class="flex items-center space-x-4">
                <div class="vote-summary">
                  <div class="flex items-center space-x-2 text-xs">
                    <span class="text-green-600"
                      >买: {{ recommendation.vote_summary.buy_votes }}</span
                    >
                    <span class="text-red-600"
                      >卖: {{ recommendation.vote_summary.sell_votes }}</span
                    >
                    <span class="text-gray-600"
                      >持: {{ recommendation.vote_summary.hold_votes }}</span
                    >
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    总投票: {{ recommendation.vote_summary.total_votes }}
                  </div>
                </div>

                <!-- 目标价格 -->
                <div v-if="recommendation.decision.target_price" class="target-price">
                  <div class="text-xs text-gray-500">目标价</div>
                  <div class="text-sm font-medium text-green-600">
                    ¥{{ recommendation.decision.target_price.toFixed(2) }}
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                  <slot name="actions" :recommendation="recommendation">
                    <button
                      class="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      @click="$emit('recommendation-detail', recommendation)"
                    >
                      详情
                    </button>
                    <button
                      v-if="recommendation.decision.decision_type === 'buy'"
                      class="ml-3 text-green-600 hover:text-green-900 text-sm font-medium"
                      @click="$emit('execute-trade', recommendation)"
                    >
                      执行买入
                    </button>
                  </slot>
                </div>
              </div>
            </div>

            <!-- 详细投票信息 -->
            <div class="mt-3">
              <div class="model-votes">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="vote in recommendation.vote_details"
                    :key="vote.model_id"
                    class="inline-flex items-center px-2 py-1 rounded text-xs"
                    :class="modelVoteClass(vote.vote_type)"
                  >
                    {{
                      vote.vote_type === 'buy'
                        ? '买入'
                        : vote.vote_type === 'sell'
                          ? '卖出'
                          : '观望'
                    }}
                    ({{ (vote.confidence * 100).toFixed(0) }}%)
                  </span>
                </div>
              </div>

              <!-- 推理说明 -->
              <div v-if="showReasoning" class="reasoning mt-2">
                <p class="text-xs text-gray-600">
                  {{ recommendation.decision.reasoning }}
                </p>
              </div>

              <!-- 时间信息 -->
              <div class="time-info mt-2">
                <span class="text-xs text-gray-500">
                  生成时间: {{ formatDate(recommendation.decision.generated_at) }}
                </span>
                <span
                  v-if="recommendation.decision.time_horizon"
                  class="text-xs text-gray-500 ml-4"
                >
                  时间周期: {{ recommendation.decision.time_horizon }}天
                </span>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- 空状态 -->
      <div v-if="filteredAndSortedRecommendations.length === 0" class="empty-state">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无推荐数据</h3>
          <p class="mt-1 text-sm text-gray-500">没有找到符合条件的推荐记录。</p>
          <button
            @click="refreshRecommendations"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            刷新推荐
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="pagination">
      <slot name="pagination">
        <div
          class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6"
        >
          <div class="flex justify-between flex-1 sm:hidden">
            <button
              class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              上一页
            </button>
            <button
              class="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recommendation } from '~/types/decisions';

interface Props {
  recommendations: Recommendation[];
  loading?: boolean;
  error?: string;
  filterDecision?: string;
  sortBy?: string;
  showPagination?: boolean;
  showReasoning?: boolean;
  refreshing?: boolean;
}

interface Emits {
  (e: 'filter-change' | 'sort-change', value: string): void;
  (e: 'recommendation-detail' | 'execute-trade', recommendation: Recommendation): void;
  (e: 'refresh-recommendations'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  filterDecision: '',
  sortBy: 'confidence',
  showPagination: false,
  showReasoning: false,
  refreshing: false,
});

const emit = defineEmits<Emits>();

// 筛选和排序状态
const filterDecision = ref(props.filterDecision);
const sortBy = ref(props.sortBy);

// 筛选和排序后的推荐数据
const filteredAndSortedRecommendations = computed(() => {
  let recommendations = [...props.recommendations];

  // 应用筛选
  if (filterDecision.value) {
    recommendations = recommendations.filter(
      rec => rec.decision.decision_type === filterDecision.value
    );
  }

  // 应用排序
  recommendations.sort((a, b) => {
    switch (sortBy.value) {
      case 'confidence':
        return b.decision.confidence - a.decision.confidence;
      case 'votes':
        return b.vote_summary.total_votes - a.vote_summary.total_votes;
      case 'symbol':
        return a.stock.symbol.localeCompare(b.stock.symbol);
      default:
        return 0;
    }
  });

  return recommendations;
});

// 决策标签和样式
const decisionLabel = (decision: string) => {
  const labelMap: Record<string, string> = {
    buy: '买入',
    sell: '卖出',
    hold: '观望',
  };
  return labelMap[decision] || decision;
};

const decisionBadgeClass = (decision: string) => {
  const classMap: Record<string, string> = {
    buy: 'bg-green-100 text-green-800',
    sell: 'bg-red-100 text-red-800',
    hold: 'bg-gray-100 text-gray-800',
  };
  return classMap[decision] || 'bg-gray-100 text-gray-800';
};

// 模型投票样式
const modelVoteClass = (decision: string) => {
  const classMap: Record<string, string> = {
    buy: 'bg-green-50 text-green-700 border border-green-200',
    sell: 'bg-red-50 text-red-700 border border-red-200',
    hold: 'bg-gray-50 text-gray-700 border border-gray-200',
  };
  return classMap[decision] || 'bg-gray-50 text-gray-700 border border-gray-200';
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 刷新推荐
const refreshRecommendations = () => {
  emit('refresh-recommendations');
};

// 监听筛选和排序变化
watch(filterDecision, newVal => {
  emit('filter-change', newVal);
});

watch(sortBy, newVal => {
  emit('sort-change', newVal);
});

// 监听props变化
watch(
  () => props.filterDecision,
  newVal => {
    filterDecision.value = newVal;
  }
);

watch(
  () => props.sortBy,
  newVal => {
    sortBy.value = newVal;
  }
);
</script>

<style scoped>
.decision-list {
  @apply bg-white shadow overflow-hidden sm:rounded-lg;
}

.list-header {
  @apply px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200;
}

.controls {
  @apply flex items-center space-x-4;
}

.loading-state {
  @apply p-8;
}

.error-state {
  @apply m-4;
}

.list-container {
  @apply divide-y divide-gray-200;
}

.recommendation-item {
  @apply transition-colors duration-150;
}

.decision-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.empty-state {
  @apply border-t border-gray-200;
}

.pagination {
  @apply border-t border-gray-200;
}

.model-votes {
  @apply flex flex-wrap gap-2;
}

.reasoning {
  @apply text-xs text-gray-600;
}

.time-info {
  @apply flex items-center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .list-header {
    @apply flex-col items-start space-y-4;
  }

  .controls {
    @apply w-full justify-start;
  }

  .recommendation-item .flex.items-center.justify-between {
    @apply flex-col items-start space-y-4;
  }

  .action-buttons {
    @apply w-full flex space-x-3;
  }

  .action-buttons button {
    @apply flex-1 text-center;
  }

  .time-info {
    @apply flex-col items-start space-y-1;
  }
}
</style>
