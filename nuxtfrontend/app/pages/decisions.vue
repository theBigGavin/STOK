<template>
  <div>
    <!-- 错误提示 -->
    <UAlert v-if="error" :title="'操作失败'" :description="error" color="error" variant="solid"
      icon="i-lucide-alert-triangle" class="mb-4" closable @close="clearError" />

    <UDashboardPage>
      <UDashboardPanel grow>
        <!-- 页面标题和操作栏 -->
        <UDashboardNavbar title="AI选股推荐" :ui="{ right: 'gap-3' }">
          <template #right>
            <!-- 操作按钮 -->
            <UButton label="刷新推荐" color="primary" variant="solid" icon="i-lucide-refresh-cw" :loading="refreshing"
              @click="refreshRecommendations" />
            <UButton label="统计信息" color="neutral" variant="ghost" icon="i-lucide-bar-chart-3" @click="showStatistics" />
          </template>
        </UDashboardNavbar>

        <UDashboardPanelContent>
          <!-- 统计信息卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-trending-up" class="size-5 text-green-600" />
                  <h3 class="text-sm font-medium text-gray-900">买入推荐</h3>
                </div>
              </template>
              <div class="text-2xl font-bold text-green-600">{{ statistics.buyCount }}</div>
              <p class="text-sm text-gray-500 mt-1">当前买入信号</p>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-trending-down" class="size-5 text-red-600" />
                  <h3 class="text-sm font-medium text-gray-900">卖出推荐</h3>
                </div>
              </template>
              <div class="text-2xl font-bold text-red-600">{{ statistics.sellCount }}</div>
              <p class="text-sm text-gray-500 mt-1">当前卖出信号</p>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-pause" class="size-5 text-gray-600" />
                  <h3 class="text-sm font-medium text-gray-900">观望推荐</h3>
                </div>
              </template>
              <div class="text-2xl font-bold text-gray-600">{{ statistics.holdCount }}</div>
              <p class="text-sm text-gray-500 mt-1">当前观望信号</p>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-bar-chart" class="size-5 text-blue-600" />
                  <h3 class="text-sm font-medium text-gray-900">平均置信度</h3>
                </div>
              </template>
              <div class="text-2xl font-bold text-blue-600">{{ statistics.avgConfidence }}%</div>
              <p class="text-sm text-gray-500 mt-1">模型平均置信度</p>
            </UCard>
          </div>

          <!-- 推荐列表 -->
          <UDashboardSection title="推荐列表" description="基于多模型投票的AI选股推荐">
            <DecisionList :recommendations="recommendations" :loading="loading" :error="error" :refreshing="refreshing"
              @recommendation-detail="viewRecommendationDetail" @execute-trade="executeTrade"
              @refresh-recommendations="refreshRecommendations" />
          </UDashboardSection>
        </UDashboardPanelContent>
      </UDashboardPanel>
    </UDashboardPage>

    <!-- 推荐详情模态框 -->
    <UModal v-model="showDetailModal" size="4xl">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">推荐详情</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="showDetailModal = false" />
          </div>
        </template>

        <div v-if="selectedRecommendation" class="space-y-6">
          <!-- 股票基本信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-2">股票信息</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">代码</span>
                  <span class="text-sm font-medium">{{ selectedRecommendation.stock.symbol }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">名称</span>
                  <span class="text-sm font-medium">{{ selectedRecommendation.stock.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">市场</span>
                  <span class="text-sm font-medium">{{ selectedRecommendation.stock.market }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">行业</span>
                  <span class="text-sm font-medium">{{ selectedRecommendation.stock.industry || '未知' }}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-2">价格信息</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">当前价格</span>
                  <span class="text-sm font-medium">
                    {{ selectedRecommendation.stock.current_price ?
                      `¥${selectedRecommendation.stock.current_price.toFixed(2)}` : '未知' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">涨跌幅</span>
                  <span class="text-sm font-medium"
                    :class="selectedRecommendation.stock.price_change_percent >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ selectedRecommendation.stock.price_change_percent ?
                      `${selectedRecommendation.stock.price_change_percent >= 0 ? '+' :
                        ''}${selectedRecommendation.stock.price_change_percent.toFixed(2)}%` : '未知' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">目标价格</span>
                  <span class="text-sm font-medium text-green-600">
                    {{ selectedRecommendation.decision.target_price ?
                      `¥${selectedRecommendation.decision.target_price.toFixed(2)}` : '未设置' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-500">止损价格</span>
                  <span class="text-sm font-medium text-red-600">
                    {{ selectedRecommendation.decision.stop_loss_price ?
                      `¥${selectedRecommendation.decision.stop_loss_price.toFixed(2)}` : '未设置' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 决策信息 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">决策信息</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold"
                  :class="getDecisionColorClass(selectedRecommendation.decision.decision_type)">
                  {{ getDecisionText(selectedRecommendation.decision.decision_type) }}
                </div>
                <p class="text-sm text-gray-500 mt-1">最终决策</p>
              </div>
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">
                  {{ (selectedRecommendation.decision.confidence * 100).toFixed(1) }}%
                </div>
                <p class="text-sm text-gray-500 mt-1">置信度</p>
              </div>
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-purple-600">
                  {{ selectedRecommendation.decision.time_horizon || 'N/A' }}
                </div>
                <p class="text-sm text-gray-500 mt-1">时间周期(天)</p>
              </div>
            </div>
          </div>

          <!-- 投票详情 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">投票详情</h4>
            <div class="space-y-3">
              <div v-for="vote in selectedRecommendation.vote_details" :key="vote.vote_id"
                class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div class="flex items-center gap-3">
                  <UBadge :color="getDecisionColor(vote.vote_type)" variant="subtle" size="sm">
                    {{ getDecisionText(vote.vote_type) }}
                  </UBadge>
                  <span class="text-sm text-gray-600">模型 {{ vote.model_id.slice(0, 8) }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-500">置信度: {{ (vote.confidence * 100).toFixed(1) }}%</span>
                  <span class="text-sm text-gray-500">信号强度: {{ vote.signal_strength.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 决策理由 -->
          <div v-if="selectedRecommendation.decision.reasoning">
            <h4 class="text-sm font-medium text-gray-900 mb-2">决策理由</h4>
            <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {{ selectedRecommendation.decision.reasoning }}
            </p>
          </div>
        </div>
      </UCard>
    </UModal>

    <!-- 统计信息模态框 -->
    <UModal v-model="showStatisticsModal" size="2xl">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">系统统计信息</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="showStatisticsModal = false" />
          </div>
        </template>

        <div class="space-y-6">
          <!-- 股票统计 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">股票统计</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <div class="text-lg font-bold text-gray-900">{{ systemStats.totalStocks }}</div>
                <p class="text-sm text-gray-500">总股票数</p>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <div class="text-lg font-bold text-blue-600">{{ systemStats.stocksWithDecisions }}</div>
                <p class="text-sm text-gray-500">有决策股票</p>
              </div>
            </div>
          </div>

          <!-- 决策统计 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">决策统计</h4>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <div class="text-lg font-bold text-green-600">{{ systemStats.buyDecisions }}</div>
                <p class="text-sm text-green-600">买入决策</p>
              </div>
              <div class="text-center p-3 bg-red-50 rounded-lg">
                <div class="text-lg font-bold text-red-600">{{ systemStats.sellDecisions }}</div>
                <p class="text-sm text-red-600">卖出决策</p>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <div class="text-lg font-bold text-gray-600">{{ systemStats.holdDecisions }}</div>
                <p class="text-sm text-gray-600">观望决策</p>
              </div>
            </div>
          </div>

          <!-- 模型统计 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">模型统计</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-lg font-bold text-blue-600">{{ systemStats.totalModels }}</div>
                <p class="text-sm text-blue-600">总模型数</p>
              </div>
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <div class="text-lg font-bold text-green-600">{{ systemStats.activeModels }}</div>
                <p class="text-sm text-green-600">活跃模型</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Recommendation } from '~/types/decisions';

// 响应式数据
const loading = ref(false);
const refreshing = ref(false);
const error = ref('');
const recommendations = ref<Recommendation[]>([]);
const selectedRecommendation = ref<Recommendation | null>(null);
const showDetailModal = ref(false);
const showStatisticsModal = ref(false);

// 统计信息
const statistics = ref({
  buyCount: 0,
  sellCount: 0,
  holdCount: 0,
  avgConfidence: 0
});

const systemStats = ref({
  totalStocks: 0,
  stocksWithDecisions: 0,
  buyDecisions: 0,
  sellDecisions: 0,
  holdDecisions: 0,
  totalModels: 0,
  activeModels: 0
});

// 获取推荐列表
const fetchRecommendations = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await $fetch<any>('/api/decisions/recommendations', {
      method: 'GET',
      params: {
        limit: 50
      }
    });

    if (response.status === 'success') {
      recommendations.value = response.data.data;
      updateStatistics();
    } else {
      error.value = response.message || '获取推荐列表失败';
    }
  } catch (err: any) {
    error.value = err.message || '网络请求失败';
  } finally {
    loading.value = false;
  }
};

// 刷新推荐
const refreshRecommendations = async () => {
  refreshing.value = true;

  try {
    const response = await $fetch<any>('/api/decisions/refresh', {
      method: 'POST'
    });

    if (response.status === 'success') {
      await fetchRecommendations();
      useToast().add({
        title: '刷新成功',
        description: `成功刷新 ${response.data.generated_count} 个决策`,
        color: 'success'
      });
    } else {
      error.value = response.message || '刷新推荐失败';
    }
  } catch (err: any) {
    error.value = err.message || '刷新请求失败';
  } finally {
    refreshing.value = false;
  }
};

// 获取系统统计信息
const fetchSystemStatistics = async () => {
  try {
    const response = await $fetch<any>('/api/decisions/statistics', {
      method: 'GET'
    });

    if (response.status === 'success') {
      const stats = response.data;
      systemStats.value = {
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
};

// 更新统计信息
const updateStatistics = () => {
  const buyRecs = recommendations.value.filter(r => r.decision.decision_type === 'buy');
  const sellRecs = recommendations.value.filter(r => r.decision.decision_type === 'sell');
  const holdRecs = recommendations.value.filter(r => r.decision.decision_type === 'hold');

  statistics.value = {
    buyCount: buyRecs.length,
    sellCount: sellRecs.length,
    holdCount: holdRecs.length,
    avgConfidence: recommendations.value.length > 0
      ? Number((recommendations.value.reduce((sum, r) => sum + r.decision.confidence, 0) / recommendations.value.length * 100).toFixed(1))
      : 0
  };
};

// 查看推荐详情
const viewRecommendationDetail = (recommendation: Recommendation) => {
  selectedRecommendation.value = recommendation;
  showDetailModal.value = true;
};

// 执行交易
const executeTrade = (recommendation: Recommendation) => {
  useToast().add({
    title: '交易执行',
    description: `已为 ${recommendation.stock.symbol} 执行${getDecisionText(recommendation.decision.decision_type)}操作`,
    color: 'primary'
  });
};

// 显示统计信息
const showStatistics = async () => {
  await fetchSystemStatistics();
  showStatisticsModal.value = true;
};

// 清除错误
const clearError = () => {
  error.value = '';
};

// 决策类型颜色映射
const getDecisionColor = (decisionType: string) => {
  switch (decisionType) {
    case 'buy': return 'success';
    case 'sell': return 'error';
    case 'hold': return 'neutral';
    default: return 'neutral';
  }
};

// 决策类型文本映射
const getDecisionText = (decisionType: string) => {
  switch (decisionType) {
    case 'buy': return '买入';
    case 'sell': return '卖出';
    case 'hold': return '观望';
    default: return '未知';
  }
};

// 决策类型CSS类映射
const getDecisionColorClass = (decisionType: string) => {
  switch (decisionType) {
    case 'buy': return 'text-green-600';
    case 'sell': return 'text-red-600';
    case 'hold': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

// 生命周期
onMounted(async () => {
  await fetchRecommendations();
  await fetchSystemStatistics();
});
</script>
