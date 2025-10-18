<template>
  <UCard class="h-full">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-bar-chart-3" class="size-5 text-primary" />
          <h3 class="text-lg font-semibold text-highlighted">模型性能</h3>
        </div>
        <div class="flex items-center gap-2">
          <USelect v-model="selectedMetric" :options="metricOptions" size="sm" class="w-32" />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="loading"
            @click="refresh"
          >
            刷新
          </UButton>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- 空状态 -->
      <div v-else-if="modelPerformance.length === 0" class="text-center py-12">
        <UIcon name="i-lucide-bar-chart-3" class="size-16 text-muted mb-4" />
        <p class="text-muted">暂无性能数据</p>
      </div>

      <!-- 性能图表 -->
      <div v-else class="space-y-6">
        <!-- 性能指标卡片 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="metric in performanceMetrics"
            :key="metric.name"
            class="p-4 rounded-lg border border-default bg-elevated/50"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted">{{ metric.label }}</span>
              <UIcon :name="metric.icon" class="size-4" :class="metric.color" />
            </div>
            <div class="text-2xl font-semibold text-highlighted">
              {{ metric.value }}
            </div>
            <div class="text-xs text-muted mt-1">
              {{ metric.description }}
            </div>
          </div>
        </div>

        <!-- 模型性能比较图表 -->
        <div class="bg-elevated/30 rounded-lg p-4">
          <h4 class="text-sm font-medium text-highlighted mb-4">
            模型性能比较 - {{ selectedMetricLabel }}
          </h4>
          <div class="space-y-3">
            <div
              v-for="model in sortedModels"
              :key="model.modelName"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-3 flex-1">
                <span class="text-sm font-medium text-highlighted min-w-24">
                  {{ model.modelName }}
                </span>
                <UProgress
                  :value="getMetricValue(model, selectedMetric)"
                  :max="100"
                  size="sm"
                  :color="getProgressColor(getMetricValue(model, selectedMetric))"
                  class="flex-1"
                />
                <span class="text-sm text-muted min-w-12 text-right">
                  {{ getMetricValue(model, selectedMetric).toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 性能趋势图表 -->
        <div class="bg-elevated/30 rounded-lg p-4">
          <h4 class="text-sm font-medium text-highlighted mb-4">性能趋势</h4>
          <div class="h-48 flex items-end justify-between gap-2">
            <div
              v-for="(trend, index) in performanceTrend"
              :key="index"
              class="flex flex-col items-center flex-1"
            >
              <div
                class="w-full bg-primary/20 rounded-t transition-all duration-300 hover:bg-primary/30"
                :style="{ height: `${trend.accuracy}%` }"
              />
              <div class="text-xs text-muted mt-2">
                {{ trend.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between text-xs text-muted">
        <span>数据更新: {{ formatTime(lastUpdated) }}</span>
        <span>共 {{ modelPerformance.length }} 个模型</span>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDashboardData } from '~/composables/useDashboardData';

interface ModelPerformanceData {
  modelName: string;
  accuracy?: number;
  totalReturn?: number;
  sharpeRatio?: number;
  winRate?: number;
  lastUpdated?: string;
}

const { modelPerformance, loading, lastUpdated, refreshDashboard } = useDashboardData();

// 状态
const selectedMetric = ref('accuracy');

// 指标选项
const metricOptions = [
  { value: 'accuracy', label: '准确率' },
  { value: 'totalReturn', label: '总回报' },
  { value: 'sharpeRatio', label: '夏普比率' },
  { value: 'winRate', label: '胜率' },
];

// 计算属性
const selectedMetricLabel = computed(() => {
  const option = metricOptions.find(opt => opt.value === selectedMetric.value);
  return option?.label || '准确率';
});

const sortedModels = computed(() => {
  return [...modelPerformance.value]
    .sort(
      (a, b) => getMetricValue(b, selectedMetric.value) - getMetricValue(a, selectedMetric.value)
    )
    .slice(0, 6); // 只显示前6个模型
});

const performanceMetrics = computed(() => [
  {
    name: 'avgAccuracy',
    label: '平均准确率',
    value: `${calculateAverage('accuracy').toFixed(1)}%`,
    icon: 'i-lucide-target',
    color: 'text-success',
    description: '所有模型平均',
  },
  {
    name: 'avgReturn',
    label: '平均回报',
    value: `${calculateAverage('totalReturn').toFixed(1)}%`,
    icon: 'i-lucide-trending-up',
    color: 'text-primary',
    description: '年化回报率',
  },
  {
    name: 'avgSharpe',
    label: '平均夏普',
    value: calculateAverage('sharpeRatio').toFixed(2),
    icon: 'i-lucide-chart-line',
    color: 'text-warning',
    description: '风险调整收益',
  },
  {
    name: 'bestModel',
    label: '最佳模型',
    value: getBestModel(),
    icon: 'i-lucide-award',
    color: 'text-error',
    description: '最高准确率',
  },
]);

const performanceTrend = computed(() => [
  { label: '1月', accuracy: 82 },
  { label: '2月', accuracy: 85 },
  { label: '3月', accuracy: 83 },
  { label: '4月', accuracy: 87 },
  { label: '5月', accuracy: 89 },
  { label: '6月', accuracy: 88 },
]);

// 方法
const refresh = () => {
  refreshDashboard();
};

const getMetricValue = (model: ModelPerformanceData, metric: string) => {
  switch (metric) {
    case 'accuracy':
      return model.accuracy || 0;
    case 'totalReturn':
      return Math.max(0, model.totalReturn || 0);
    case 'sharpeRatio':
      return Math.max(0, model.sharpeRatio || 0) * 10; // 缩放显示
    case 'winRate':
      return (model.winRate || 0) * 100;
    default:
      return 0;
  }
};

const getProgressColor = (value: number) => {
  if (value >= 80) return 'success';
  if (value >= 60) return 'warning';
  return 'error';
};

const calculateAverage = (metric: string) => {
  if (modelPerformance.value.length === 0) return 0;

  const sum = modelPerformance.value.reduce((total, model) => {
    return total + getMetricValue(model, metric);
  }, 0);

  return sum / modelPerformance.value.length;
};

const getBestModel = () => {
  if (modelPerformance.value.length === 0) return '-';

  const bestModel = modelPerformance.value.reduce((best, current) => {
    return (current.accuracy || 0) > (best.accuracy || 0) ? current : best;
  });

  return bestModel.modelName.split(' ')[0] || bestModel.modelName;
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString('zh-CN') +
    ' ' +
    date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};
</script>
