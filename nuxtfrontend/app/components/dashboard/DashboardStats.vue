<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <!-- 活跃股票数 -->
    <UPageCard
      icon="i-lucide-trending-up"
      title="活跃股票"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stats.activeStocks }}
        </span>
        <UBadge color="success" variant="subtle" class="text-xs"> +5% </UBadge>
      </div>
      <p class="text-xs text-muted">监控中的股票数量</p>
    </UPageCard>

    <!-- 模型数量 -->
    <UPageCard
      icon="i-lucide-brain"
      title="模型数量"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stats.totalModels }}
        </span>
        <UBadge color="primary" variant="subtle" class="text-xs"> 活跃 </UBadge>
      </div>
      <p class="text-xs text-muted">决策模型总数</p>
    </UPageCard>

    <!-- 决策成功率 -->
    <UPageCard
      icon="i-lucide-target"
      title="决策成功率"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-success/10 ring ring-inset ring-success/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stats.decisionSuccessRate.toFixed(1) }}%
        </span>
        <UBadge :color="successRateColor" variant="subtle" class="text-xs">
          {{ successRateTrend }}
        </UBadge>
      </div>
      <p class="text-xs text-muted">基于历史数据</p>
    </UPageCard>

    <!-- 系统状态 -->
    <UPageCard
      icon="i-lucide-server"
      title="系统状态"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-neutral/10 ring ring-inset ring-neutral/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ systemStatusText }}
        </span>
        <UBadge :color="systemStatusColor" variant="subtle" class="text-xs">
          {{ systemUptimeText }}
        </UBadge>
      </div>
      <p class="text-xs text-muted">内存使用: {{ stats.memoryUsage.toFixed(1) }}%</p>
    </UPageCard>
  </UPageGrid>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDashboardData } from '~/composables/useDashboardData';

const { dashboardStats, systemStatusColor, successRateColor } = useDashboardData();

// 计算属性
const systemStatusText = computed(() => {
  switch (dashboardStats.value.systemStatus) {
    case 'healthy':
      return '正常';
    case 'degraded':
      return '降级';
    case 'unhealthy':
      return '异常';
    default:
      return '未知';
  }
});

const systemUptimeText = computed(() => {
  const uptime = dashboardStats.value.systemUptime;
  if (uptime < 3600) return `${Math.floor(uptime / 60)}分钟`;
  if (uptime < 86400) return `${Math.floor(uptime / 3600)}小时`;
  return `${Math.floor(uptime / 86400)}天`;
});

const successRateTrend = computed(() => {
  const rate = dashboardStats.value.decisionSuccessRate;
  if (rate >= 85) return '优秀';
  if (rate >= 75) return '良好';
  if (rate >= 60) return '一般';
  return '需改进';
});

// 模拟统计数据（用于开发阶段）
const stats = computed(() => ({
  activeStocks: dashboardStats.value.activeStocks || 156,
  totalModels: dashboardStats.value.totalModels || 8,
  decisionSuccessRate: dashboardStats.value.decisionSuccessRate || 78.5,
  systemStatus: dashboardStats.value.systemStatus || 'healthy',
  totalDecisions: dashboardStats.value.totalDecisions || 1247,
  avgConfidence: dashboardStats.value.avgConfidence || 82.3,
  systemUptime: dashboardStats.value.systemUptime || 86400, // 1天
  memoryUsage: dashboardStats.value.memoryUsage || 45.2,
}));
</script>
