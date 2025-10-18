<template>
  <div class="performance-chart">
    <!-- 图表头部 -->
    <div class="chart-header">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">性能图表</h3>
      </slot>

      <!-- 图表控制 -->
      <div class="chart-controls">
        <slot name="controls">
          <div class="flex items-center space-x-4">
            <select
              v-model="chartType"
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="line">折线图</option>
              <option value="bar">柱状图</option>
              <option value="radar">雷达图</option>
            </select>

            <select
              v-model="timeRange"
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1w">1周</option>
              <option value="1m">1月</option>
              <option value="3m">3月</option>
              <option value="1y">1年</option>
              <option value="all">全部</option>
            </select>
          </div>
        </slot>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="flex items-center justify-center h-64">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">图表加载失败</h3>
          <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
          <button
            class="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('retry')"
          >
            重试
          </button>
        </div>
      </div>
    </div>

    <!-- 图表容器 -->
    <div v-else class="chart-container">
      <div class="chart-wrapper">
        <canvas ref="chartCanvas" class="chart-canvas"></canvas>
      </div>

      <!-- 性能指标摘要 -->
      <div v-if="showSummary" class="performance-summary">
        <h4 class="text-sm font-medium text-gray-700 mb-3">性能指标摘要</h4>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">平均准确率</span>
            <span class="summary-value">{{ averageAccuracy }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">平均收益</span>
            <span class="summary-value" :class="averageReturnClass"> {{ averageReturn }}% </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">夏普比率</span>
            <span class="summary-value">{{ averageSharpeRatio }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">最大回撤</span>
            <span class="summary-value negative">{{ averageMaxDrawdown }}%</span>
          </div>
        </div>
      </div>

      <!-- 图例 -->
      <div v-if="showLegend" class="chart-legend">
        <div class="legend-title">模型对比</div>
        <div class="legend-items">
          <div
            v-for="(model, index) in performanceData"
            :key="model.modelId"
            class="legend-item"
            @click="toggleDataset(index)"
          >
            <div class="legend-color" :style="{ backgroundColor: getColor(index) }"></div>
            <span class="legend-label">{{ model.modelName }}</span>
            <span class="legend-stats">
              准确率: {{ (model.averageAccuracy * 100).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && performanceData.length === 0" class="empty-state">
      <div class="flex items-center justify-center h-64">
        <div class="text-center">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无性能数据</h3>
          <p class="mt-1 text-sm text-gray-500">没有可显示的模型性能数据。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Chart, type ChartConfiguration } from 'chart.js/auto';

interface PerformanceData {
  modelId: number;
  modelName: string;
  dates: string[];
  accuracy: number[];
  totalReturn: number[];
  sharpeRatio: number[];
  maxDrawdown: number[];
  averageAccuracy: number;
  averageReturn: number;
  averageSharpeRatio: number;
  averageMaxDrawdown: number;
}

interface Props {
  performanceData: PerformanceData[];
  loading?: boolean;
  error?: string;
  chartType?: 'line' | 'bar' | 'radar';
  timeRange?: string;
  showSummary?: boolean;
  showLegend?: boolean;
  metric?: 'accuracy' | 'return' | 'sharpe' | 'drawdown';
}

interface Emits {
  (e: 'chart-click', modelId: number, metric: string, value: number): void;
  (e: 'time-range-change' | 'metric-change', value: string): void;
  (e: 'retry'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  chartType: 'line',
  timeRange: '1m',
  showSummary: true,
  showLegend: true,
  metric: 'accuracy',
});

const emit = defineEmits<Emits>();

// Chart.js 实例
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// 图表状态
const chartType = ref(props.chartType);
const timeRange = ref(props.timeRange);
const selectedMetric = ref(props.metric);

// 颜色生成器
const colors = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
];

const getColor = (index: number) => {
  return colors[index % colors.length];
};

// 性能摘要计算
const averageAccuracy = computed(() => {
  if (props.performanceData.length === 0) return 0;
  const sum = props.performanceData.reduce((acc, model) => acc + model.averageAccuracy, 0);
  return ((sum / props.performanceData.length) * 100).toFixed(1);
});

const averageReturn = computed(() => {
  if (props.performanceData.length === 0) return 0;
  const sum = props.performanceData.reduce((acc, model) => acc + model.averageReturn, 0);
  return ((sum / props.performanceData.length) * 100).toFixed(1);
});

const averageReturnClass = computed(() => {
  return Number(averageReturn.value) >= 0 ? 'positive' : 'negative';
});

const averageSharpeRatio = computed(() => {
  if (props.performanceData.length === 0) return 0;
  const sum = props.performanceData.reduce((acc, model) => acc + model.averageSharpeRatio, 0);
  return (sum / props.performanceData.length).toFixed(2);
});

const averageMaxDrawdown = computed(() => {
  if (props.performanceData.length === 0) return 0;
  const sum = props.performanceData.reduce((acc, model) => acc + model.averageMaxDrawdown, 0);
  return ((sum / props.performanceData.length) * 100).toFixed(1);
});

// 初始化图表
const initChart = () => {
  if (!chartCanvas.value || props.performanceData.length === 0) return;

  // 销毁现有图表
  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  // 准备图表数据
  const datasets = props.performanceData.map((model, index) => {
    let data: number[] = [];
    let label = '';

    switch (selectedMetric.value) {
      case 'accuracy':
        data = model.accuracy;
        label = `${model.modelName} - 准确率`;
        break;
      case 'return':
        data = model.totalReturn;
        label = `${model.modelName} - 收益`;
        break;
      case 'sharpe':
        data = model.sharpeRatio;
        label = `${model.modelName} - 夏普比率`;
        break;
      case 'drawdown':
        data = model.maxDrawdown;
        label = `${model.modelName} - 最大回撤`;
        break;
    }

    return {
      label,
      data,
      borderColor: getColor(index),
      backgroundColor: getColor(index) + '20',
      borderWidth: 2,
      fill: chartType.value === 'line',
      tension: 0.4,
    };
  });

  const labels = props.performanceData[0]?.dates || [];

  const config: ChartConfiguration = {
    type: chartType.value,
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: context => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              let formattedValue = value.toFixed(2);

              if (
                selectedMetric.value === 'accuracy' ||
                selectedMetric.value === 'return' ||
                selectedMetric.value === 'drawdown'
              ) {
                formattedValue = (value * 100).toFixed(1) + '%';
              }

              return `${label}: ${formattedValue}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: '日期',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: getYAxisLabel(),
          },
          ticks: {
            callback: value => {
              if (typeof value === 'number') {
                if (
                  selectedMetric.value === 'accuracy' ||
                  selectedMetric.value === 'return' ||
                  selectedMetric.value === 'drawdown'
                ) {
                  return (value * 100).toFixed(0) + '%';
                }
                return value.toFixed(2);
              }
              return value;
            },
          },
        },
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const dataIndex = element.index;
          const modelId = props.performanceData[datasetIndex].modelId;
          const value = datasets[datasetIndex].data[dataIndex];
          emit('chart-click', modelId, selectedMetric.value, value);
        }
      },
    },
  };

  chartInstance = new Chart(ctx, config);
};

// 获取Y轴标签
const getYAxisLabel = () => {
  const labelMap: Record<string, string> = {
    accuracy: '准确率 (%)',
    return: '收益率 (%)',
    sharpe: '夏普比率',
    drawdown: '最大回撤 (%)',
  };
  return labelMap[selectedMetric.value] || '数值';
};

// 切换数据集显示
const toggleDataset = (index: number) => {
  if (chartInstance) {
    const meta = chartInstance.getDatasetMeta(index);
    if (meta) {
      chartInstance.setDatasetVisibility(index, !meta.hidden);
      chartInstance.update();
    }
  }
};

// 监听数据变化
watch(
  [() => props.performanceData, chartType, selectedMetric],
  () => {
    initChart();
  },
  { deep: true }
);

// 监听时间范围变化
watch(timeRange, newVal => {
  emit('time-range-change', newVal);
});

// 监听指标变化
watch(selectedMetric, newVal => {
  emit('metric-change', newVal);
});

// 生命周期
onMounted(() => {
  initChart();
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});

// 监听props变化
watch(
  () => props.chartType,
  newVal => {
    chartType.value = newVal;
  }
);

watch(
  () => props.timeRange,
  newVal => {
    timeRange.value = newVal;
  }
);

watch(
  () => props.metric,
  newVal => {
    selectedMetric.value = newVal;
  }
);
</script>

<style scoped>
.performance-chart {
  @apply bg-white shadow rounded-lg p-6;
}

.chart-header {
  @apply flex justify-between items-center mb-6;
}

.chart-controls {
  @apply flex items-center space-x-4;
}

.loading-state {
  @apply flex items-center justify-center h-64;
}

.error-state {
  @apply flex items-center justify-center h-64;
}

.chart-container {
  @apply space-y-6;
}

.chart-wrapper {
  @apply h-64 relative;
}

.chart-canvas {
  @apply w-full h-full;
}

.performance-summary {
  @apply border-t border-gray-200 pt-4;
}

.summary-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.summary-item {
  @apply text-center;
}

.summary-label {
  @apply block text-xs text-gray-500 mb-1;
}

.summary-value {
  @apply block text-lg font-semibold;
}

.summary-value.positive {
  @apply text-green-600;
}

.summary-value.negative {
  @apply text-red-600;
}

.chart-legend {
  @apply border-t border-gray-200 pt-4;
}

.legend-title {
  @apply text-sm font-medium text-gray-700 mb-3;
}

.legend-items {
  @apply space-y-2;
}

.legend-item {
  @apply flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors;
}

.legend-color {
  @apply w-4 h-4 rounded-full;
}

.legend-label {
  @apply text-sm font-medium text-gray-700 flex-1;
}

.legend-stats {
  @apply text-sm text-gray-500;
}

.empty-state {
  @apply flex items-center justify-center h-64;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .chart-header {
    @apply flex-col items-start space-y-4;
  }

  .chart-controls {
    @apply w-full justify-start;
  }

  .summary-grid {
    @apply grid-cols-2 gap-3;
  }

  .legend-item {
    @apply flex-col items-start space-y-2;
  }

  .legend-stats {
    @apply text-xs;
  }
}
</style>
