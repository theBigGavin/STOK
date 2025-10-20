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

    <div v-else class="h-80">
      <Line :data="chartData" :options="chartOptions" :key="chartKey" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Line } from '@ant-design/charts';
import { chartTheme } from '~/utils/chartTheme';

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
const chartKey = ref(0);

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
const chartData = computed(() => {
  if (!props.data || props.data.length === 0) {
    return { datasets: [] };
  }

  // 按模型分组数据
  const datasets = uniqueModels.value.map(modelName => {
    const modelData = props.data
      .filter(item => item.modelName === modelName)
      .map(item => ({
        x: new Date(item.date),
        y: item.metrics[selectedMetric.value as keyof typeof item.metrics] || 0,
      }))
      .sort((a, b) => a.x.getTime() - b.x.getTime());

    return {
      label: modelName,
      data: modelData,
      borderColor: getModelColor(modelName),
      backgroundColor: getModelColor(modelName) + '20',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    };
  });

  return { datasets };
});

// 格式化指标值
const formatMetricValue = (value: number) => {
  const metric = selectedMetric.value;
  if (metric === 'totalReturn') return `${(value * 100).toFixed(1)}%`;
  if (metric === 'maxDrawdown') return `${(value * 100).toFixed(1)}%`;
  if (metric === 'sharpeRatio') return value.toFixed(2);
  return value.toFixed(3);
};

// 图表配置
const chartOptions = computed(() => ({
  animation: {
    duration: 1000,
    easing: 'easeOutQuart' as const,
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#374151',
      bodyColor: '#6B7280',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      cornerRadius: 6,
      padding: 12,
      callbacks: {
        title: (context: any) => {
          const date = new Date(context[0].parsed.x);
          return date.toLocaleDateString('zh-CN');
        },
        label: (context: any) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: ${formatMetricValue(value)}`;
        },
      },
    },
  },
  scales: {
    x: {
      type: 'time' as const,
      time: {
        unit: 'day' as const,
        displayFormats: {
          day: 'MM-dd',
        },
      },
      grid: {
        display: false,
      },
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
      },
    },
    y: {
      beginAtZero: false,
      grid: {
        color: '#F3F4F6',
      },
      ticks: {
        callback: (value: any) => {
          return formatMetricValue(value);
        },
      },
    },
  },
  maintainAspectRatio: false,
}));

// 监听指标变化
watch(selectedMetric, (newMetric) => {
  emit('metricChange', newMetric);
  chartKey.value++;
});

// 监听周期变化
watch(selectedPeriod, (newPeriod) => {
  emit('periodChange', newPeriod);
  chartKey.value++;
});

// 监听数据变化
watch(() => props.data, () => {
  chartKey.value++;
}, { deep: true });
</script>

<style scoped>
:deep(.ant-chart) {
  width: 100%;
  height: 100%;
}

:deep(.ant-chart-legend) {
  padding: 8px 0;
}

:deep(.ant-chart-tooltip) {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
</style>
