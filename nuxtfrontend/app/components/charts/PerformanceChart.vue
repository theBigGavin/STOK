<!-- components/charts/PerformanceChart.vue -->
<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">模型性能趋势</h3>
        <div class="flex gap-2">
          <USelect v-model="selectedMetric" :options="metricOptions" class="w-40" />
          <USelect v-model="selectedPeriod" :options="periodOptions" class="w-32" />
        </div>
      </div>
    </template>

    <div v-if="loading" class="h-80 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary" />
        <p class="mt-2 text-sm text-gray-500">加载中...</p>
      </div>
    </div>

    <div v-else-if="error" class="h-80 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-8 w-8 text-red-500" />
        <p class="mt-2 text-sm text-red-500">{{ error }}</p>
        <UButton class="mt-4" @click="$emit('retry')">重试</UButton>
      </div>
    </div>

    <div v-else-if="!data || data.length === 0" class="h-80 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-chart-bar" class="h-8 w-8 text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">暂无性能数据</p>
      </div>
    </div>

    <VisXYContainer v-else :data="chartData" class="h-80">
      <template v-for="model in uniqueModels" :key="model">
        <VisLine
          :x="x"
          :y="(d: PerformanceData) => getMetricValue(d, model)"
          :color="getModelColor(model)"
        />
        <VisArea
          :x="x"
          :y="(d: PerformanceData) => getMetricValue(d, model)"
          :color="getModelColor(model)"
          :opacity="0.1"
        />
      </template>
      <VisAxis type="x" :tick-format="formatDate" />
      <VisAxis type="y" :tick-format="formatMetric" />
      <VisCrosshair :template="tooltipTemplate" />
      <VisTooltip />
      <!-- <VisLegend :items="legendItems" /> -->
    </VisXYContainer>
  </UCard>
</template>

<script setup lang="ts">
import {
  VisXYContainer,
  VisLine,
  VisArea,
  VisAxis,
  VisCrosshair,
  VisTooltip,
  // VisLegend,
} from '@unovis/vue';

interface PerformanceData {
  date: Date;
  [model: string]: number | undefined;
}

interface PerformanceHistory {
  date: string;
  modelId: number;
  modelName: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    totalReturn?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
  };
}

interface Props {
  data: PerformanceHistory[];
  loading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
});

const emit = defineEmits<{
  retry: [];
  metricChange: [metric: string];
  periodChange: [period: string];
}>();

const selectedMetric = ref('totalReturn');
const selectedPeriod = ref('1M');

const metricOptions = [
  { label: '总收益率', value: 'totalReturn' },
  { label: '夏普比率', value: 'sharpeRatio' },
  { label: '最大回撤', value: 'maxDrawdown' },
  { label: '准确率', value: 'accuracy' },
  { label: '精确率', value: 'precision' },
  { label: '召回率', value: 'recall' },
  { label: 'F1分数', value: 'f1Score' },
];

const periodOptions = [
  { label: '1个月', value: '1M' },
  { label: '3个月', value: '3M' },
  { label: '6个月', value: '6M' },
  { label: '1年', value: '1Y' },
];

const modelColors = [
  'var(--color-primary-500)',
  'var(--color-emerald-500)',
  'var(--color-amber-500)',
  'var(--color-red-500)',
  'var(--color-purple-500)',
  'var(--color-cyan-500)',
];

// 获取唯一模型列表
const uniqueModels = computed(() => {
  if (!props.data) return [];
  return [...new Set(props.data.map(item => item.modelName))];
});

// 获取模型颜色
const getModelColor = (modelName: string) => {
  const index = uniqueModels.value.indexOf(modelName);
  return modelColors[index % modelColors.length] || 'var(--color-gray-500)';
};

// 转换数据格式
const chartData = computed<PerformanceData[]>(() => {
  if (!props.data) return [];

  // 按日期分组
  const dateGroups = props.data.reduce(
    (acc, item) => {
      const date = new Date(item.date);
      if (!acc[date.toISOString()]) {
        acc[date.toISOString()] = { date } as PerformanceData;
      }
      acc[date.toISOString()][item.modelName] =
        item.metrics[selectedMetric.value as keyof typeof item.metrics] || 0;
      return acc;
    },
    {} as Record<string, PerformanceData>
  );

  return Object.values(dateGroups).sort((a, b) => a.date.getTime() - b.date.getTime());
});

// 获取指标值
const getMetricValue = (d: PerformanceData, model: string) => {
  return d[model] || 0;
};

const x = (d: PerformanceData) => d.date;

const formatDate = (date: Date) =>
  date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

const formatMetric = (value: number) => {
  const metric = selectedMetric.value;
  if (metric === 'totalReturn') return `${(value * 100).toFixed(1)}%`;
  if (metric === 'maxDrawdown') return `${(value * 100).toFixed(1)}%`;
  if (metric === 'sharpeRatio') return value.toFixed(2);
  return value.toFixed(3);
};

const tooltipTemplate = (d: PerformanceData) => {
  const date = d.date.toLocaleDateString('zh-CN');
  const lines = uniqueModels.value
    .map(model => {
      const value = d[model];
      if (value === undefined) return null;
      const formattedValue = formatMetric(value);
      return `${model}: ${formattedValue}`;
    })
    .filter(Boolean);

  return [`${date}`, ...lines].join('<br>');
};

// 图例项
// const legendItems = computed(() =>
//   uniqueModels.value.map(model => ({
//     name: model,
//     color: getModelColor(model),
//   }))
// );

// 监听指标变化
watch(selectedMetric, newMetric => {
  emit('metricChange', newMetric);
});

watch(selectedPeriod, newPeriod => {
  emit('periodChange', newPeriod);
});
</script>

<style scoped>
:deep(.vis-tooltip) {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  font-size: 14px;
}

:deep(.vis-legend) {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}
</style>
