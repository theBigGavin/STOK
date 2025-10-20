<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <div class="flex gap-2">
          <USelect v-model="selectedTimeRange" :options="timeRangeOptions" class="w-32" />
          <UButton :variant="chartType === 'line' ? 'solid' : 'outline'" @click="chartType = 'line'">
            折线图
          </UButton>
          <UButton :variant="chartType === 'candlestick' ? 'solid' : 'outline'" @click="chartType = 'candlestick'">
            K线图
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
        <UButton class="mt-4" @click="loadData">重试</UButton>
      </div>
    </div>

    <div v-else-if="!chartData || chartData.length === 0" class="h-80 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-chart-line" class="h-8 w-8 text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">暂无价格数据</p>
      </div>
    </div>

    <div v-else class="h-80">
      <Line v-if="chartType === 'line'" :data="lineChartData" :options="lineChartOptions" :key="`line-${chartKey}`" />
      <Bar v-else :data="candlestickChartData" :options="candlestickChartOptions" :key="`candlestick-${chartKey}`" />
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="price-info">
          <span class="current-price">当前价格: {{ formatPrice(currentPrice) }}</span>
          <span :class="['price-change', { positive: priceChange >= 0, negative: priceChange < 0 }]">
            {{ priceChange >= 0 ? '+' : '' }}{{ formatPercent(priceChange) }}
          </span>
        </div>
        <div class="decision-markers" v-if="decisionPoints && decisionPoints.length > 0">
          <div class="marker-info">
            <span class="marker-count">{{ decisionPoints.length }} 个决策点</span>
            <div class="marker-legend">
              <span class="legend-item buy">买入</span>
              <span class="legend-item sell">卖出</span>
              <span class="legend-item hold">持有</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { Line, Bar } from '@ant-design/charts';
import { chartTheme } from '~/utils/chartTheme';

interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface DecisionPoint {
  date: string;
  decisionType: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
}

interface Props {
  stockId?: string;
  symbol?: string;
  title?: string;
  height?: number;
  showDecisionPoints?: boolean;
  timeRange?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '价格走势图',
  height: 400,
  showDecisionPoints: true,
  timeRange: '1m'
});

const loading = ref(false);
const error = ref('');
const chartData = ref<PriceData[]>([]);
const decisionPoints = ref<DecisionPoint[]>([]);
const selectedTimeRange = ref(props.timeRange);
const chartType = ref<'line' | 'candlestick'>('line');
const currentPrice = ref(0);
const priceChange = ref(0);
const chartKey = ref(0);

const timeRangeOptions = [
  { label: '1天', value: '1d' },
  { label: '1周', value: '1w' },
  { label: '1月', value: '1m' },
  { label: '3月', value: '3m' },
  { label: '1年', value: '1y' },
];

// 监听属性变化
watch(() => props.stockId, () => {
  loadData();
});

watch(() => props.symbol, () => {
  loadData();
});

watch(() => props.timeRange, (newRange) => {
  selectedTimeRange.value = newRange;
  loadData();
});

onMounted(() => {
  loadData();
});

const loadData = async () => {
  if (!props.stockId && !props.symbol) {
    error.value = '请提供股票ID或代码';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // 模拟数据 - 实际项目中应该调用API
    await loadMockData();

    if (props.showDecisionPoints) {
      await loadDecisionPoints();
    }

    chartKey.value++;
  } catch (err) {
    error.value = '加载数据失败: ' + (err as Error).message;
    console.error('加载图表数据失败:', err);
  } finally {
    loading.value = false;
  }
};

const loadMockData = async () => {
  // 模拟价格数据
  const mockData: PriceData[] = [];
  const basePrice = 100;
  const volatility = 5;

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));

    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility * 2;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;

    const dateString = date.toISOString().split('T')[0];
    if (dateString) {
      mockData.push({
        date: dateString,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000)
      });
    }
  }

  chartData.value = mockData;

  // 计算当前价格和变化
  if (mockData.length > 0) {
    const latest = mockData[mockData.length - 1];
    const previous = mockData[mockData.length - 2] || latest;

    currentPrice.value = latest.close;
    priceChange.value = ((latest.close - previous.close) / previous.close) * 100;
  }
};

const loadDecisionPoints = async () => {
  // 模拟决策点数据
  const mockDecisions: DecisionPoint[] = [];

  if (chartData.value.length > 0) {
    // 随机选择几个点作为决策点
    const decisionIndices = [5, 10, 15, 20, 25];

    decisionIndices.forEach(index => {
      if (index < chartData.value.length) {
        const dataPoint = chartData.value[index];
        const decisionTypes: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD'];
        const decisionType = decisionTypes[Math.floor(Math.random() * decisionTypes.length)] as 'BUY' | 'SELL' | 'HOLD';

        if (dataPoint) {
          mockDecisions.push({
            date: dataPoint.date,
            decisionType,
            confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
            price: dataPoint.close
          });
        }
      }
    });
  }

  decisionPoints.value = mockDecisions;
};

// 折线图数据
const lineChartData = computed(() => ({
  datasets: [{
    label: '收盘价',
    data: chartData.value.map(item => ({
      x: new Date(item.date),
      y: item.close,
    })),
    borderColor: 'var(--color-primary-500)',
    backgroundColor: 'var(--color-primary-500)20',
    borderWidth: 2,
    tension: 0.4,
    pointRadius: 0,
  }],
}));

// K线图数据
const candlestickChartData = computed(() => ({
  datasets: [{
    label: 'K线',
    data: chartData.value.map(item => ({
      x: new Date(item.date),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    })),
    borderColor: (context: any) => {
      const value = context.parsed;
      return value.close >= value.open ? 'var(--color-emerald-500)' : 'var(--color-red-500)';
    },
    backgroundColor: (context: any) => {
      const value = context.parsed;
      return value.close >= value.open ? 'var(--color-emerald-500)20' : 'var(--color-red-500)20';
    },
    borderWidth: 2,
  }],
}));

// 折线图配置
const lineChartOptions = computed(() => ({
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
        title: (context: any) => {
          const date = new Date(context[0].parsed.x);
          return date.toLocaleDateString('zh-CN');
        },
        label: (context: any) => {
          return `收盘价: ${formatPrice(context.parsed.y)}`;
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
          return formatPrice(value);
        },
      },
    },
  },
  maintainAspectRatio: false,
}));

// K线图配置
const candlestickChartOptions = computed(() => ({
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
        title: (context: any) => {
          const date = new Date(context[0].parsed.x);
          return date.toLocaleDateString('zh-CN');
        },
        label: (context: any) => {
          const data = context.raw;
          return [
            `开盘: ${formatPrice(data.open)}`,
            `最高: ${formatPrice(data.high)}`,
            `最低: ${formatPrice(data.low)}`,
            `收盘: ${formatPrice(data.close)}`,
          ];
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
          return formatPrice(value);
        },
      },
    },
  },
  maintainAspectRatio: false,
}));

const formatPrice = (price: number) => {
  return `¥${price.toFixed(2)}`;
};

const formatPercent = (percent: number) => {
  return `${percent.toFixed(2)}%`;
};

// 监听数据变化
watch(() => chartData.value, () => {
  chartKey.value++;
}, { deep: true });

// 监听图表类型变化
watch(chartType, () => {
  chartKey.value++;
});
</script>

<style scoped>
:deep(.ant-chart) {
  width: 100%;
  height: 100%;
}

:deep(.ant-chart-tooltip) {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.price-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-price {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.price-change {
  font-size: 14px;
  font-weight: bold;
}

.price-change.positive {
  color: #00da3c;
}

.price-change.negative {
  color: #ec0000;
}

.decision-markers {
  display: flex;
  align-items: center;
}

.marker-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.marker-count {
  font-size: 14px;
  color: #666;
}

.marker-legend {
  display: flex;
  gap: 8px;
}

.legend-item {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.legend-item.buy {
  background: #00da3c;
}

.legend-item.sell {
  background: #ec0000;
}

.legend-item.hold {
  background: #5470c6;
}
</style>