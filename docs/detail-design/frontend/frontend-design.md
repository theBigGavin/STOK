# 股票回测决策系统 - 前端设计文档

## 1. 前端架构总览

### 1.1 技术栈选择

#### 核心框架

- **Vue.js 3**: 现代化前端框架，Composition API
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 快速构建工具，支持热重载

#### UI 组件库

- **Element Plus**: 基于 Vue 3 的企业级 UI 组件库
- **ECharts**: 强大的数据可视化图表库
- **Vue-ECharts**: ECharts 的 Vue 3 封装

#### 状态管理

- **Pinia**: Vue 3 官方推荐的状态管理库
- **Vue Router**: 官方路由管理

#### 开发工具

- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Vitest**: 单元测试框架

### 1.2 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 静态资源 (图片、样式等)
│   ├── components/        # 可复用组件
│   ├── views/             # 页面组件
│   ├── router/            # 路由配置
│   ├── store/             # 状态管理
│   ├── api/               # API接口封装
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript类型定义
│   └── main.ts            # 应用入口
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 2. 核心页面设计

### 2.1 仪表盘页面 (Dashboard)

**功能概述**: 系统概览、关键指标展示、最近决策、实时数据

```vue
<template>
  <div class="dashboard">
    <!-- 系统概览卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <StatCard title="股票数量" :value="stockCount" description="活跃股票" />
      </el-col>
      <el-col :span="6">
        <StatCard title="模型数量" :value="modelCount" description="活跃模型" />
      </el-col>
      <el-col :span="6">
        <StatCard
          title="今日决策"
          :value="todayDecisions"
          description="生成决策"
        />
      </el-col>
      <el-col :span="6">
        <SystemStatusCard :status="systemStatus" />
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <RecentDecisions :decisions="recentDecisions" />
      </el-col>
      <el-col :span="12">
        <ModelPerformanceChart :models="models" />
      </el-col>
    </el-row>

    <!-- 实时数据 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <RealTimeData :stocks="activeStocks" />
      </el-col>
    </el-row>
  </div>
</template>
```

### 2.2 股票监控页面 (Stocks)

**功能概述**: 股票列表、数据查看、图表分析、数据刷新

```vue
<template>
  <div class="stocks-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <h2>股票监控</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showAddStockDialog = true">
              添加股票
            </el-button>
            <el-button @click="refreshAllData"> 刷新数据 </el-button>
          </div>
        </div>
      </template>

      <!-- 股票列表表格 -->
      <StockTable
        :stocks="stocks"
        :loading="loading"
        @view-details="viewStockDetails"
        @refresh-data="refreshStockData"
      />

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalStocks"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </el-card>

    <!-- 股票详情对话框 -->
    <StockDetailDialog v-model="showDetailDialog" :stock="selectedStock" />
  </div>
</template>
```

### 2.3 决策分析页面 (Decisions)

**功能概述**: 决策历史、筛选查询、决策详情、批量操作

```vue
<template>
  <div class="decisions-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <h2>决策分析</h2>
          <div class="header-actions">
            <el-button type="primary" @click="generateNewDecision">
              生成新决策
            </el-button>
            <el-button @click="exportDecisions"> 导出数据 </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <DecisionFilters :filters="filterForm" @filter-change="applyFilters" />

      <!-- 决策表格 -->
      <DecisionTable
        :decisions="filteredDecisions"
        :loading="loading"
        @view-detail="viewDecisionDetail"
      />

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalDecisions"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </el-card>

    <!-- 决策详情对话框 -->
    <DecisionDetailDialog
      v-model="showDetailDialog"
      :decision="selectedDecision"
    />
  </div>
</template>
```

### 2.4 模型管理页面 (Models)

**功能概述**: 模型列表、性能监控、参数配置、回测分析

```vue
<template>
  <div class="models-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <h2>模型管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateModelDialog = true">
              创建模型
            </el-button>
            <el-button @click="evaluateAllModels"> 评估性能 </el-button>
          </div>
        </div>
      </template>

      <!-- 模型卡片网格 -->
      <el-row :gutter="20">
        <el-col v-for="model in models" :key="model.model_id" :span="8">
          <ModelCard
            :model="model"
            @edit="editModel"
            @delete="deleteModel"
            @backtest="runBacktest"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- 创建模型对话框 -->
    <CreateModelDialog
      v-model="showCreateModelDialog"
      @model-created="handleModelCreated"
    />
  </div>
</template>
```

### 2.5 回测分析页面 (Backtest)

**功能概述**: 回测配置、结果展示、性能指标、对比分析

```vue
<template>
  <div class="backtest-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <h2>回测分析</h2>
        </div>
      </template>

      <!-- 回测配置表单 -->
      <BacktestConfigForm
        :config="backtestConfig"
        @run-backtest="runBacktest"
      />

      <!-- 回测结果 -->
      <div v-if="backtestResult" class="backtest-results">
        <el-row :gutter="20">
          <el-col :span="12">
            <PerformanceMetrics :metrics="backtestResult.metrics" />
          </el-col>
          <el-col :span="12">
            <EquityCurveChart :data="backtestResult.equityCurve" />
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-20">
          <el-col :span="24">
            <TradeHistoryTable :trades="backtestResult.trades" />
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>
```

## 3. 核心组件设计

### 3.1 状态管理 (Pinia Store)

```typescript
// store/app.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { StockInfo, DecisionResult, ModelInfo } from "../types";

export const useAppStore = defineStore("app", () => {
  // 状态
  const stocks = ref<StockInfo[]>([]);
  const decisions = ref<DecisionResult[]>([]);
  const models = ref<ModelInfo[]>([]);
  const selectedStock = ref<StockInfo | null>(null);
  const loading = ref(false);

  // Getters
  const activeStocks = computed(() =>
    stocks.value.filter((stock) => stock.isActive)
  );

  const recentDecisions = computed(() => decisions.value.slice(0, 10));

  const modelCount = computed(() => models.value.length);

  // Actions
  const setStocks = (newStocks: StockInfo[]) => {
    stocks.value = newStocks;
  };

  const addDecision = (decision: DecisionResult) => {
    decisions.value.unshift(decision);
  };

  const setModels = (newModels: ModelInfo[]) => {
    models.value = newModels;
  };

  return {
    // State
    stocks,
    decisions,
    models,
    selectedStock,
    loading,

    // Getters
    activeStocks,
    recentDecisions,
    modelCount,

    // Actions
    setStocks,
    addDecision,
    setModels,
  };
});
```

### 3.2 API 服务封装

```typescript
// api/stocks.ts
import { request } from "../utils/request";
import type { StockInfo, StockDailyData } from "../types";

export const stockApi = {
  // 获取股票列表
  async getStocks(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
  }) {
    return request.get<StockInfo[]>("/stocks", { params });
  },

  // 获取股票数据
  async getStockData(
    symbol: string,
    startDate: string,
    endDate: string,
    includeFeatures = false
  ) {
    return request.get(`/stocks/${symbol}/data`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_features: includeFeatures,
      },
    });
  },

  // 刷新股票数据
  async refreshStockData(symbol: string) {
    return request.post(`/stocks/${symbol}/refresh`);
  },
};

// api/decisions.ts
export const decisionApi = {
  // 生成决策
  async generateDecision(
    symbol: string,
    tradeDate: string,
    currentPosition = 0
  ) {
    return request.post("/decisions/generate", {
      symbol,
      trade_date: tradeDate,
      current_position: currentPosition,
    });
  },

  // 批量生成决策
  async generateBatchDecisions(symbols: string[], tradeDate: string) {
    return request.post("/decisions/batch", {
      symbols,
      trade_date: tradeDate,
    });
  },

  // 获取决策历史
  async getDecisionHistory(symbol: string, startDate: string, endDate: string) {
    return request.get(`/decisions/history/${symbol}`, {
      params: { start_date: startDate, end_date: endDate },
    });
  },
};
```

### 3.3 决策列表组件

```vue
<template>
  <div class="decision-list">
    <el-table :data="decisions" stripe>
      <el-table-column prop="symbol" label="股票代码" width="120" />
      <el-table-column prop="timestamp" label="决策时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column prop="finalDecision.decision" label="决策" width="100">
        <template #default="{ row }">
          <el-tag :type="getDecisionTagType(row.finalDecision.decision)">
            {{ row.finalDecision.decision }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="finalDecision.confidence"
        label="置信度"
        width="120"
      >
        <template #default="{ row }">
          <el-progress
            :percentage="Math.round(row.finalDecision.confidence * 100)"
            :status="getConfidenceStatus(row.finalDecision.confidence)"
          />
        </template>
      </el-table-column>
      <el-table-column
        prop="finalDecision.voteSummary"
        label="投票结果"
        width="200"
      >
        <template #default="{ row }">
          <div class="vote-summary">
            <span class="vote-buy"
              >买: {{ row.finalDecision.voteSummary.BUY || 0 }}</span
            >
            <span class="vote-sell"
              >卖: {{ row.finalDecision.voteSummary.SELL || 0 }}</span
            >
            <span class="vote-hold"
              >观: {{ row.finalDecision.voteSummary.HOLD || 0 }}</span
            >
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" link @click="$emit('view-detail', row)">
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DecisionResult } from "../../types";

interface Props {
  decisions: DecisionResult[];
}

defineProps<Props>();
defineEmits<{
  "view-detail": [decision: DecisionResult];
}>();

const getDecisionTagType = (decision: string) => {
  switch (decision) {
    case "BUY":
      return "success";
    case "SELL":
      return "danger";
    case "HOLD":
      return "info";
    default:
      return "info";
  }
};

const getConfidenceStatus = (confidence: number) => {
  if (confidence >= 0.8) return "success";
  if (confidence >= 0.6) return "warning";
  return "exception";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};
</script>

<style scoped>
.vote-summary {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.vote-buy {
  color: #67c23a;
}
.vote-sell {
  color: #f56c6c;
}
.vote-hold {
  color: #909399;
}
</style>
```

### 3.4 股票图表组件

```vue
<template>
  <div class="stock-chart">
    <v-chart :option="chartOption" :autoresize="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, CandlestickChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  CandlestickChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

interface Props {
  data: StockDailyData[]
  showVolume?: boolean
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  showVolume: true,
  height: '400px'
})

const chartOption = computed(() => {
  const dates = props.data.map(item => item.trade_date)
  const prices = props.data.map(item => [item.open, item.close, item.low, item.high])
  const volumes = props.data.map(item => item.volume)

  return {
    animation: false,
    legend: {
      data: ['日K', 'MA5', 'MA10', '成交量'],
      bottom: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: [
      {
        left: '10%',
        right: '10%',
        height: '50%'
      },
      {
        left: '10%',
        right: '10%',
        top: '63%',
        height: '16%'
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        splitNumber: 20,
        min: 'dataMin',
        max: 'dataMax'
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        splitNumber: 20,
        min: 'dataMin',
        max: 'dataMax'
      }
    ],
    yAxis: [
      {
        scale: true,
        splitArea: {
          show: true
        }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 98,
        end
```
