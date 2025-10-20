<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">模型投票分布</h3>
        <div class="flex gap-2">
          <UButton v-for="chartType in chartTypes" :key="chartType.value"
            :variant="selectedChartType === chartType.value ? 'solid' : 'outline'"
            @click="selectedChartType = chartType.value">
            {{ chartType.label }}
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

    <div v-else-if="!data || data.length === 0" class="h-80 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-chart-bar" class="h-8 w-8 text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">暂无投票数据</p>
      </div>
    </div>

    <div v-else class="h-80">
      <Pie v-if="selectedChartType === 'pie'" :data="pieChartData" :options="pieChartOptions"
        :key="`pie-${chartKey}`" />
      <Bar v-else :data="barChartData" :options="barChartOptions" :key="`bar-${chartKey}`" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Pie, Bar } from '@ant-design/charts';
import type { ModelDecision } from '~/types/decisions';
import { chartTheme } from '~/utils/chartTheme';

interface VoteData {
  decision: string;
  count: number;
  percentage: number;
  color: string;
}

interface Props {
  data: ModelDecision[];
  loading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
});

defineEmits<{
  retry: [];
}>();

const selectedChartType = ref<'pie' | 'bar'>('pie');
const chartKey = ref(0);

const chartTypes = [
  { label: '饼图', value: 'pie' as const },
  { label: '柱状图', value: 'bar' as const },
];

const decisionColors = {
  BUY: 'var(--color-emerald-500)',
  SELL: 'var(--color-red-500)',
  HOLD: 'var(--color-amber-500)',
};

const decisionLabels = {
  BUY: '买入',
  SELL: '卖出',
  HOLD: '持有',
};

// 计算投票数据
const voteData = computed<VoteData[]>(() => {
  if (!props.data || props.data.length === 0) return [];

  const decisionCounts = props.data.reduce(
    (acc, item) => {
      acc[item.voteType] = (acc[item.voteType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = props.data.length;

  return Object.entries(decisionCounts).map(([decision, count]) => ({
    decision,
    count,
    percentage: (count / total) * 100,
    color: decisionColors[decision as keyof typeof decisionColors] || 'var(--color-gray-500)',
  }));
});

// 饼图数据
const pieChartData = computed(() => ({
  datasets: [{
    data: voteData.value.map(item => ({
      label: decisionLabels[item.decision as keyof typeof decisionLabels] || item.decision,
      value: item.count,
      color: item.color,
    })),
  }],
}));

// 柱状图数据
const barChartData = computed(() => ({
  datasets: [{
    label: '投票数',
    data: voteData.value.map(item => ({
      decision: decisionLabels[item.decision as keyof typeof decisionLabels] || item.decision,
      count: item.count,
      color: item.color,
    })),
  }],
}));

// 饼图配置
const pieChartOptions = computed(() => ({
  animation: {
    duration: 1000,
    easing: 'easeOutQuart' as const,
  },
  plugins: {
    legend: {
      display: true,
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
        },
        generateLabels: (chart: any) => {
          const data = chart.data.datasets[0].data;
          return data.map((item: any, index: number) => ({
            text: `${item.label} (${item.value}票)`,
            fillStyle: item.color,
            strokeStyle: item.color,
            pointStyle: 'circle',
            hidden: false,
            index,
          }));
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#374151',
      bodyColor: '#6B7280',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      cornerRadius: 6,
      padding: 12,
      callbacks: {
        label: (context: any) => {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((sum: number, item: any) => sum + item.value, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value}票 (${percentage}%)`;
        },
      },
    },
  },
  maintainAspectRatio: false,
}));

// 柱状图配置
const barChartOptions = computed(() => ({
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
      display: false,
    },
    tooltip: {
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
          const total = voteData.value.reduce((sum, item) => sum + item.count, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value}票 (${percentage}%)`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#F3F4F6',
      },
      ticks: {
        callback: (value: any) => {
          return `${value}票`;
        },
      },
    },
  },
  maintainAspectRatio: false,
}));

// 监听数据变化
watch(() => props.data, () => {
  chartKey.value++;
}, { deep: true });

// 监听图表类型变化
watch(selectedChartType, () => {
  chartKey.value++;
});
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
