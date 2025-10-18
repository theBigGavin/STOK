<template>
  <div class="stock-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <slot name="header">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="stock-symbol">
              <h3 class="text-lg font-semibold text-gray-900">{{ stock.symbol }}</h3>
              <p class="text-sm text-gray-500">{{ stock.name }}</p>
            </div>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="marketBadgeClass"
            >
              {{ marketLabel }}
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="statusBadgeClass"
            >
              {{ statusLabel }}
            </span>
            <slot name="header-actions" :stock="stock"></slot>
          </div>
        </div>
      </slot>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <slot name="content">
        <!-- 基本信息 -->
        <div class="basic-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">市场</span>
              <span class="info-value">{{ marketLabel }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态</span>
              <span class="info-value">{{ statusLabel }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ formatDate(stock.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">股票ID</span>
              <span class="info-value">{{ stock.id }}</span>
            </div>
          </div>
        </div>

        <!-- 价格信息插槽 -->
        <slot name="price-info" :stock="stock">
          <div v-if="priceData" class="price-info">
            <div class="price-grid">
              <div class="price-item">
                <span class="price-label">最新价</span>
                <span class="price-value" :class="priceChangeClass">
                  {{ formatPrice(priceData.closePrice) }}
                </span>
              </div>
              <div class="price-item">
                <span class="price-label">涨跌幅</span>
                <span class="price-change" :class="priceChangeClass">
                  {{ formatPercent(priceChange) }}
                </span>
              </div>
              <div class="price-item">
                <span class="price-label">成交量</span>
                <span class="price-value">{{ formatVolume(priceData.volume) }}</span>
              </div>
            </div>
          </div>
        </slot>

        <!-- 自定义内容插槽 -->
        <slot name="custom-content" :stock="stock"></slot>
      </slot>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <slot name="footer" :stock="stock">
        <div class="footer-actions">
          <button
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('view-details', stock)"
          >
            查看详情
          </button>
          <button
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('analyze-stock', stock)"
          >
            分析股票
          </button>
          <slot name="extra-actions" :stock="stock"></slot>
        </div>
      </slot>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <svg
          class="animate-spin h-5 w-5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="ml-2 text-sm text-gray-600">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <div class="error-message">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="ml-2 text-sm text-red-600">{{ error }}</span>
        <button
          class="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          @click="$emit('retry', stock)"
        >
          重试
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StockInfo, StockDailyData } from '~/types/stocks';

interface Props {
  stock: StockInfo;
  priceData?: StockDailyData | null;
  loading?: boolean;
  error?: string;
  showPriceInfo?: boolean;
}

interface Emits {
  (e: 'view-details' | 'analyze-stock' | 'retry', stock: StockInfo): void;
}

const props = withDefaults(defineProps<Props>(), {
  priceData: null,
  loading: false,
  error: '',
  showPriceInfo: true,
});

defineEmits<Emits>();

// 市场标签和样式
const marketLabel = computed(() => {
  const marketMap: Record<string, string> = {
    SH: '上证',
    SZ: '深证',
    BJ: '北证',
  };
  return marketMap[props.stock.market] || props.stock.market;
});

const marketBadgeClass = computed(() => {
  const marketClassMap: Record<string, string> = {
    SH: 'bg-green-100 text-green-800',
    SZ: 'bg-blue-100 text-blue-800',
    BJ: 'bg-purple-100 text-purple-800',
  };
  return marketClassMap[props.stock.market] || 'bg-gray-100 text-gray-800';
});

// 状态标签和样式
const statusLabel = computed(() => {
  return props.stock.isActive ? '活跃' : '停牌';
});

const statusBadgeClass = computed(() => {
  return props.stock.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
});

// 价格变化计算
const priceChange = computed(() => {
  if (!props.priceData) return 0;

  // 这里可以根据需要计算涨跌幅
  // 假设我们有一个基准价格，这里简化处理
  return 0;
});

const priceChangeClass = computed(() => {
  if (priceChange.value > 0) return 'text-green-600';
  if (priceChange.value < 0) return 'text-red-600';
  return 'text-gray-600';
});

// 格式化函数
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const formatPrice = (price: number) => {
  return `¥${price.toFixed(2)}`;
};

const formatPercent = (percent: number) => {
  return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
};

const formatVolume = (volume: number) => {
  if (volume >= 100000000) {
    return `${(volume / 100000000).toFixed(2)}亿股`;
  } else if (volume >= 10000) {
    return `${(volume / 10000).toFixed(2)}万股`;
  }
  return `${volume}股`;
};
</script>

<style scoped>
.stock-card {
  @apply bg-white shadow rounded-lg p-6 relative;
  min-height: 200px;
}

.card-header {
  @apply mb-4 pb-4 border-b border-gray-200;
}

.card-content {
  @apply mb-6;
}

.card-footer {
  @apply pt-4 border-t border-gray-200;
}

.stock-symbol h3 {
  @apply text-lg font-semibold text-gray-900;
}

.stock-symbol p {
  @apply text-sm text-gray-500;
}

.basic-info {
  @apply mb-4;
}

.info-grid {
  @apply grid grid-cols-2 gap-4;
}

.info-item {
  @apply flex flex-col;
}

.info-label {
  @apply text-xs text-gray-500 mb-1;
}

.info-value {
  @apply text-sm font-medium text-gray-900;
}

.price-info {
  @apply mb-4;
}

.price-grid {
  @apply grid grid-cols-3 gap-4;
}

.price-item {
  @apply flex flex-col items-center;
}

.price-label {
  @apply text-xs text-gray-500 mb-1;
}

.price-value {
  @apply text-sm font-semibold;
}

.price-change {
  @apply text-sm font-semibold;
}

.footer-actions {
  @apply flex space-x-3;
}

.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg;
}

.loading-spinner {
  @apply flex items-center;
}

.error-overlay {
  @apply absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg;
}

.error-message {
  @apply flex items-center;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .info-grid {
    @apply grid-cols-1 gap-3;
  }

  .price-grid {
    @apply grid-cols-1 gap-3;
  }

  .footer-actions {
    @apply flex-col space-x-0 space-y-2;
  }

  .footer-actions button {
    @apply w-full justify-center;
  }
}
</style>
