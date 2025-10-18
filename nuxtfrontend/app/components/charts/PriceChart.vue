<!-- components/charts/PriceChart.vue -->
<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">{{ symbol }} 价格走势</h3>
        <div class="flex gap-2">
          <UButton
            v-for="period in periods"
            :key="period.value"
            :variant="selectedPeriod === period.value ? 'solid' : 'outline'"
            @click="handlePeriodChange(period.value)"
          >
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

    <VisXYContainer v-else :data="chartData" class="h-80">
      <VisLine :x="x" :y="y" :color="primaryColor" />
      <VisArea :x="x" :y="y" :color="primaryColor" :opacity="0.1" />
      <VisAxis type="x" :tick-format="formatDate" />
      <VisAxis type="y" :tick-format="formatPrice" />
      <VisCrosshair :template="tooltipTemplate" />
      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<script setup lang="ts">
import { VisXYContainer, VisLine, VisArea, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue';
import type { StockDailyData } from '~/types/stocks';

interface PriceData {
  date: Date;
  price: number;
  volume: number;
}

interface Props {
  symbol: string;
  data: StockDailyData[];
  loading?: boolean;
  error?: string;
  selectedPeriod?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  selectedPeriod: '1M',
});

const emit = defineEmits<{
  periodChange: [period: string];
  retry: [];
}>();

const selectedPeriod = ref(props.selectedPeriod);
const primaryColor = 'var(--color-primary-500)';

const periods = [
  { label: '1月', value: '1M' },
  { label: '3月', value: '3M' },
  { label: '6月', value: '6M' },
  { label: '1年', value: '1Y' },
];

const chartData = computed<PriceData[]>(() =>
  props.data.map(item => ({
    date: new Date(item.tradeDate),
    price: Number(item.closePrice),
    volume: item.volume,
  }))
);

const x = (d: PriceData) => d.date;
const y = (d: PriceData) => d.price;

const formatDate = (date: Date) =>
  date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

const tooltipTemplate = (d: PriceData) =>
  `${d.date.toLocaleDateString('zh-CN')}: ¥${d.price.toFixed(2)}`;

const handlePeriodChange = (period: string) => {
  selectedPeriod.value = period;
  emit('periodChange', period);
};
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
</style>
