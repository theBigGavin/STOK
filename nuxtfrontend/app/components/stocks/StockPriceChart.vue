<template>
  <div ref="chartContainer" class="w-full h-full">
    <VisXYContainer
      :data="chartData"
      :padding="{ top: 20, bottom: 40, left: 50, right: 20 }"
      class="h-full"
    >
      <VisLine :x="x" :y="y" :color="lineColor" />
      <VisArea :x="x" :y="y" :color="areaColor" :opacity="0.1" />
      <VisAxis type="x" :tick-format="formatXAxis" :grid-line="true" />
      <VisAxis type="y" :tick-format="formatYAxis" :grid-line="true" />
      <VisCrosshair :color="crosshairColor" :template="tooltipTemplate" />
      <VisTooltip />
    </VisXYContainer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StockDailyData } from '~/types/stocks';

interface Props {
  data: StockDailyData[];
  symbol: string;
}

const props = defineProps<Props>();

// 图表数据转换
interface ChartDataPoint {
  date: Date;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

const chartData = computed((): ChartDataPoint[] => {
  return props.data.map(item => ({
    date: new Date(item.tradeDate),
    price: item.closePrice,
    open: item.openPrice,
    high: item.highPrice,
    low: item.lowPrice,
    volume: item.volume,
  }));
});

// 图表配置
const x = (d: ChartDataPoint) => d.date;
const y = (d: ChartDataPoint) => d.price;

// 颜色配置
const lineColor = 'var(--ui-primary)';
const areaColor = 'var(--ui-primary)';
const crosshairColor = 'var(--ui-primary)';

// 格式化函数
const formatXAxis = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
};

const formatYAxis = (value: number) => {
  return `¥${value.toFixed(2)}`;
};

const tooltipTemplate = (d: ChartDataPoint) => {
  return `
        <div class="p-2 text-sm">
            <div class="font-semibold">${props.symbol}</div>
            <div>日期: ${d.date.toLocaleDateString('zh-CN')}</div>
            <div>收盘价: ¥${d.price.toFixed(2)}</div>
            <div>开盘价: ¥${d.open.toFixed(2)}</div>
            <div>最高价: ¥${d.high.toFixed(2)}</div>
            <div>最低价: ¥${d.low.toFixed(2)}</div>
            <div>成交量: ${d.volume.toLocaleString()}</div>
        </div>
    `;
};
</script>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);

  --vis-line-stroke-color: var(--ui-primary);
  --vis-area-fill-color: var(--ui-primary);
}
</style>
