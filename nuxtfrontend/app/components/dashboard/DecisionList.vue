<template>
  <UCard class="h-full">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-zap" class="size-5 text-primary" />
          <h3 class="text-lg font-semibold text-highlighted">实时决策</h3>
        </div>
        <div class="flex items-center gap-2">
          <UBadge v-if="hasHighRiskDecisions" color="error" variant="subtle" class="text-xs">
            高风险
          </UBadge>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="sm" :loading="loading"
            @click="refresh">
            刷新
          </UButton>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
      </div>

      <!-- 空状态 -->
      <div v-else-if="decisions.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-clock" class="size-12 text-muted mb-4" />
        <p class="text-muted">暂无决策数据</p>
      </div>

      <!-- 决策列表 -->
      <div v-else class="space-y-3">
        <div v-for="decision in decisions" :key="`${decision.symbol}-${decision.timestamp}`"
          class="flex items-center justify-between p-3 rounded-lg border border-default hover:bg-elevated transition-colors">
          <div class="flex items-center gap-3">
            <!-- 决策类型图标 -->
            <div class="p-2 rounded-full" :class="decisionColorClasses(decision.decision)">
              <UIcon :name="decisionIcon(decision.decision)" class="size-4"
                :class="decisionIconColor(decision.decision)" />
            </div>

            <!-- 股票信息 -->
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-highlighted">
                  {{ decision.symbol }}
                </span>
                <UBadge :color="riskLevelColor(decision.riskLevel)" variant="subtle" size="xs">
                  {{ riskLevelText(decision.riskLevel) }}
                </UBadge>
              </div>
              <p class="text-xs text-muted">
                {{ formatTime(decision.timestamp) }}
              </p>
            </div>
          </div>

          <!-- 置信度和操作 -->
          <div class="flex items-center gap-4">
            <!-- 置信度进度条 -->
            <div class="w-20">
              <div class="flex justify-between text-xs text-muted mb-1">
                <span>置信度</span>
                <span>{{ decision.confidence.toFixed(1) }}%</span>
              </div>
              <UProgress :value="decision.confidence" :max="100" size="xs"
                :color="confidenceColor(decision.confidence)" />
            </div>

            <!-- 查看详情按钮 -->
            <UButton icon="i-lucide-eye" color="neutral" variant="ghost" size="sm" class="rounded-full"
              @click="viewDecision(decision)" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between text-xs text-muted">
        <span>最近更新: {{ formatTime(lastUpdated) }}</span>
        <span>共 {{ decisions.length }} 条决策</span>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useDashboardData } from '~/composables/useDashboardData';
import type { DecisionType, RiskLevel } from '~/types/decisions';

interface DashboardDecision {
  symbol: string;
  decision: DecisionType;
  confidence: number;
  timestamp: string;
  riskLevel: RiskLevel;
}

const {
  realTimeDecisions,
  loading,
  lastUpdated,
  hasHighRiskDecisions,
  refreshDashboard,
  loadRealTimeDecisions,
} = useDashboardData();

// 组件挂载时加载实时决策数据
onMounted(async () => {
  if (realTimeDecisions.value.length === 0 && !loading.value) {
    await loadRealTimeDecisions();
  }
});

// 计算属性
const decisions = computed(() => realTimeDecisions.value.slice(0, 8)); // 最多显示8条

// 方法
const refresh = () => {
  refreshDashboard();
};

const viewDecision = (decision: DashboardDecision) => {
  // 跳转到决策详情页面
  console.log('查看决策详情:', decision);
  // 这里可以添加路由跳转逻辑
};

const decisionColorClasses = (decision: DecisionType) => {
  switch (decision) {
    case 'buy':
      return 'bg-success/10';
    case 'sell':
      return 'bg-error/10';
    case 'hold':
      return 'bg-warning/10';
    default:
      return 'bg-neutral/10';
  }
};

const decisionIcon = (decision: DecisionType) => {
  switch (decision) {
    case 'buy':
      return 'i-lucide-trending-up';
    case 'sell':
      return 'i-lucide-trending-down';
    case 'hold':
      return 'i-lucide-minus';
    default:
      return 'i-lucide-help-circle';
  }
};

const decisionIconColor = (decision: DecisionType) => {
  switch (decision) {
    case 'buy':
      return 'text-success';
    case 'sell':
      return 'text-error';
    case 'hold':
      return 'text-warning';
    default:
      return 'text-neutral';
  }
};

const riskLevelColor = (riskLevel: RiskLevel) => {
  switch (riskLevel) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
    default:
      return 'neutral';
  }
};

const riskLevelText = (riskLevel: RiskLevel) => {
  switch (riskLevel) {
    case 'low':
      return '低风险';
    case 'medium':
      return '中风险';
    case 'high':
      return '高风险';
    default:
      return '未知';
  }
};

const confidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'success';
  if (confidence >= 60) return 'warning';
  return 'error';
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
  return date.toLocaleDateString('zh-CN');
};
</script>
