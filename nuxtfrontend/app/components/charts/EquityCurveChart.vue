<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">净值曲线</h3>
        <div class="flex gap-2">
          <USelect v-model="selectedComparison" :options="comparisonOptions" class="w-40" />
          <UButton v-for="period in periods" :key="period.value"
            :variant="selectedPeriod === period.value ? 'solid' : 'outline'" @click="handlePeriodChange(period.value)">
            {{ period.label }}
          </UButton>
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

    <div v-else-if="!curves || curves.length === 0" class="h-80 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-chart-line" class="h-8 w-8 text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">暂无净值数据</p>
      </div>
    </div>

    <div v-else class="h-80">
      <Line :data="chartData" :options="chartOptions" :key="chartKey" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Line } from '@ant-design/charts';
import type { EquityPoint } from '~/types/backtest';
import { chartTheme } from '~/utils/chartTheme';
import { transformEquityData } from '~/utils/chartAdapter';

interface EquityCurve {
  name: string;
  data: EquityPoint[];
  color: string;
}

interface Props {
  curves: EquityCurve[];
  loading?: boolean;
  error?: string;
  selectedPeriod?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  selectedPeriod: '1Y',
});

const emit = defineEmits<{
  retry: [];
  periodChange: [period: string];
  comparisonChange: [comparison: string];
}>();

const selectedPeriod = ref(props.selectedPeriod);
const selectedComparison = ref('all');
const chartKey = ref(0);

const periods = [
  { label: '1月', value: '1M' },
  { label: '3月', value: '3M' },
  { label: '6月', value: '6M' },
  { label: '1年', value: '1Y' },
  { label: '全部', value: 'all' },
];

const comparisonOptions = [
  { label: '所有曲线', value: 'all' },
  { label: '仅策略', value: 'strategy' },
  { label: '策略vs基准', value: 'vsBenchmark' },
];

// 获取可见曲线
const visibleCurves = computed(() => {
  if (!props.curves) return [];

  switch (selectedComparison.value) {
    case 'strategy':
      return props.curves.filter(curve => curve.name !== '基准净值');
    case 'vsBenchmark':
      return props.curves.filter(curve => curve.name === '策略净值' || curve.name === '基准净值');
    default:
      return props.curves;
  }
});

// 转换数据格式
const chartData = computed(() => {
  if (!visibleCurves.value || visibleCurves.value.length === 0) {
    return { datasets: [] };
  }

  const transformedData = transformEquityData(visibleCurves.value);

  return {
    datasets: visibleCurves.value.map(curve => ({
      label: curve.name,
      data: transformedData.filter(item => item.name === curve.name),
      borderColor: curve.color,
      backgroundColor: curve.color + '20', // 添加透明度
      borderWidth: curve.name === '基准净值' ? 1 : 2,
      fill: curve.name !== '基准净值',
      tension: 0.4,
      pointRadius: 0,
    }))
  };
});

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
        label: (context: any) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: ¥${value.toFixed(2)}`;
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
          if (value >= 1000) {
            return `¥${(value / 1000).toFixed(1)}k`;
          }
          return `¥${value.toFixed(0)}`;
        },
      },
    },
  },
  maintainAspectRatio: false,
}));

const handlePeriodChange = (period: string) => {
  selectedPeriod.value = period;
  emit('periodChange', period);
  // 强制重新渲染图表
  chartKey.value++;
};

// 监听比较模式变化
watch(selectedComparison, (newComparison) => {
  emit('comparisonChange', newComparison);
  // 强制重新渲染图表
  chartKey.value++;
});

// 监听曲线数据变化
watch(() => props.curves, () => {
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
