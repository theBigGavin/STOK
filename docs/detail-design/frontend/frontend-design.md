# 股票回测决策系统 - 前端详细设计文档

## 1. 前端架构总览

### 1.1 技术栈选择

#### 核心框架

- **Nuxt 3**: 基于 Vue 3 的全栈框架，支持 SSR/SSG
- **TypeScript**: 类型安全的 JavaScript 超集
- **Nuxt UI 4.0**: 基于 Tailwind CSS 的 UI 组件库
- **Unovis**: 数据可视化图表库

#### 状态管理

- **Pinia**: Vue 3 官方推荐的状态管理库
- **VueUse**: 组合式 API 工具库

#### 开发工具

- **ESLint**: 代码质量检查
- **Vue-TSC**: TypeScript 类型检查
- **Vite**: 快速构建工具

### 1.2 UI 设计规范

基于 Nuxt UI 4.0 Dashboard 模板的设计模式和风格，制定以下 UI 设计规范：

#### 1.2.1 色彩系统

```typescript
// app.config.ts - 色彩配置
export default defineAppConfig({
  ui: {
    colors: {
      primary: "green", // 主色调：绿色
      neutral: "zinc", // 中性色调：锌色
    },
  },
});
```

**色彩应用规范**:

- **主色调 (Primary)**: 用于主要操作按钮、重要状态指示、品牌元素
- **成功色 (Success)**: 用于正向指标、增长状态、确认操作
- **错误色 (Error)**: 用于负向指标、风险状态、警告信息
- **中性色 (Neutral)**: 用于背景、边框、次要文本

#### 1.2.2 排版规范

```css
/* 文本层级规范 */
.text-xs.text-muted.uppercase    /* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
/* 小号次要文本，大写 */
.text-3xl.text-highlighted.font-semibold  /* 大号强调文本，半粗体 */
.font-normal.text-muted.text-xs.uppercase; /* 卡片标题样式 */
```

**排版层级**:

- **H1**: `text-3xl font-semibold text-highlighted` - 页面主标题
- **H2**: `text-xl font-semibold text-highlighted` - 区块标题
- **Body**: `text-base text-default` - 正文文本
- **Caption**: `text-xs text-muted uppercase` - 说明文本
- **Number**: `text-2xl font-semibold text-highlighted` - 数值显示

#### 1.2.3 间距系统

```css
/* 间距规范 */
.gap-4      /* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
/* 小间距：16px */
.gap-6      /* 中间距：24px */
.gap-px     /* 最小间距：1px */
.mt-20      /* 大外边距：80px */
.mt-auto; /* 自动外边距 */
```

**间距应用**:

- **组件内间距**: `gap-4` (16px)
- **区块间间距**: `gap-6` (24px)
- **页面级间距**: `mt-20` (80px)
- **网格间距**: `lg:gap-px` (1px 网格线)

#### 1.2.4 组件样式规范

**卡片组件 (UCard)**:

```vue
<UCard
  :ui="{
    root: 'overflow-visible',
    body: '!px-0 !pt-0 !pb-3'
  }"
>
```

**统计卡片 (UPageCard)**:

```vue
<UPageCard
  variant="subtle"
  :ui="{
    container: 'gap-y-1.5',
    wrapper: 'items-start',
    leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
    title: 'font-normal text-muted text-xs uppercase'
  }"
  class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
>
```

**按钮样式**:

```vue
<UButton
  color="neutral"
  variant="ghost"
  square
  size="md"
  class="rounded-full"
/>
```

#### 1.2.5 布局规范

**网格布局**:

```vue
<UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
  <!-- 响应式网格：桌面端4列，移动端1列 -->
</UPageGrid>
```

**面板布局**:

```vue
<UDashboardPanel id="home">
  <template #header>
    <!-- 面板头部：导航栏 + 工具栏 -->
  </template>
  <template #body>
    <!-- 面板主体内容 -->
  </template>
</UDashboardPanel>
```

#### 1.2.6 图标使用规范

```vue
<!-- Lucide 图标使用 -->
<UIcon name="i-lucide-bell" class="size-5 shrink-0" />
<UIcon name="i-lucide-chart-bar" />
<UIcon name="i-lucide-trending-up" />
```

**图标尺寸**:

- `size-5` (20px) - 标准图标尺寸
- `size-4` (16px) - 小图标尺寸
- `size-6` (24px) - 大图标尺寸

#### 1.2.7 交互状态

**悬停效果**:

```css
.hover: z-1 /* 悬停时提升层级 */ .bg-primary/10 /* 主色调10%透明度背景 */
  .ring.ring-inset.ring-primary/25; /* 内嵌边框效果 */
```

**加载状态**:

```vue
<USkeleton class="h-80 w-full" />
<!-- 图表加载骨架屏 -->
```

#### 1.2.8 数据可视化规范

**图表配色**:

```css
/* Unovis 图表配色与 UI 系统集成 */
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
```

**图表尺寸**:

```vue
<VisXYContainer class="h-96" />
<!-- 标准图表高度：384px -->
```

#### 1.2.9 状态指示规范

**徽章状态**:

```vue
<UBadge
  :color="value > 0 ? 'success' : 'error'"
  variant="subtle"
  class="text-xs"
>
  {{ value > 0 ? '+' : '' }}{{ value }}%
</UBadge>
```

**进度指示**:

```vue
<UProgress
  :percentage="confidence * 100"
  :status="getConfidenceStatus(confidence)"
/>
```

#### 1.2.10 表单控件规范

**日期选择器**:

```vue
<HomeDateRangePicker v-model="range" class="-ms-1" />
```

**下拉选择**:

```vue
<HomePeriodSelect v-model="period" :range="range" />
```

#### 1.2.11 股票回测系统特定规范

**决策状态指示**:

```vue
<!-- 决策标签 -->
<el-tag :type="getDecisionTagType(decision)">
  {{ decision }}
</el-tag>

<!-- 置信度进度条 -->
<el-progress
  :percentage="Math.round(confidence * 100)"
  :status="getConfidenceStatus(confidence)"
/>

<!-- 投票统计显示 -->
<div class="vote-summary">
  <span class="vote-buy">买: {{ voteSummary.BUY || 0 }}</span>
  <span class="vote-sell">卖: {{ voteSummary.SELL || 0 }}</span>
  <span class="vote-hold">观: {{ voteSummary.HOLD || 0 }}</span>
</div>
```

**决策状态配色**:

```typescript
const getDecisionTagType = (decision: string) => {
  switch (decision) {
    case "BUY":
      return "success"; // 绿色 - 买入
    case "SELL":
      return "danger"; // 红色 - 卖出
    case "HOLD":
      return "info"; // 蓝色 - 观望
    default:
      return "info";
  }
};

const getConfidenceStatus = (confidence: number) => {
  if (confidence >= 0.8) return "success"; // 高置信度
  if (confidence >= 0.6) return "warning"; // 中等置信度
  return "exception"; // 低置信度
};
```

**风险等级指示**:

```vue
<URiskIndicator :level="riskLevel" />

<!-- 风险等级配色 -->
- LOW: 'success' // 低风险 - 绿色 - MEDIUM: 'warning' // 中风险 - 黄色 - HIGH:
'error' // 高风险 - 红色
```

**性能指标展示**:

```vue
<PerformanceMetrics :metrics="backtestResult.metrics" />

<!-- 指标配色规范 -->
- 正向指标: 'success' (绿色) - 负向指标: 'error' (红色) - 中性指标: 'info'
(蓝色)
```

#### 1.2.12 导航规范

**侧边栏导航**:

```vue
<UNavigationMenu
  :collapsed="collapsed"
  :items="links"
  orientation="vertical"
  tooltip
  popover
/>
```

**顶部导航**:

```vue
<UDashboardNavbar title="页面标题" :ui="{ right: 'gap-3' }">
  <template #right>
    <!-- 操作按钮组 -->
  </template>
</UDashboardNavbar>
```

#### 1.2.13 实施指南

**组件开发原则**:

1. **一致性**: 所有新组件必须遵循现有模板的设计模式
2. **响应式**: 组件必须支持移动端和桌面端适配
3. **可访问性**: 确保组件支持键盘导航和屏幕阅读器
4. **性能**: 大型数据集使用虚拟滚动，图表数据使用懒加载

**样式覆盖规范**:

```vue
<!-- 正确的样式覆盖 -->
<UCard :ui="{ root: 'custom-class', body: '!px-0' }">

<!-- 避免的样式覆盖 -->
<UCard class="!p-0 !m-0"> <!-- 避免使用 !important 覆盖 -->
```

**自定义组件命名**:

```typescript
// 股票相关组件
StockTable.vue;
StockChart.vue;
StockFilter.vue;

// 决策相关组件
DecisionList.vue;
DecisionDetail.vue;
VoteChart.vue;

// 模型相关组件
ModelCard.vue;
PerformanceChart.vue;
BacktestConfig.vue;
```

**图标选择规范**:

```vue
<!-- 系统功能图标 -->
<UIcon name="i-lucide-trending-up" />
<!-- 股票监控 -->
<UIcon name="i-lucide-target" />
<!-- 决策分析 -->
<UIcon name="i-lucide-brain" />
<!-- 模型管理 -->
<UIcon name="i-lucide-test-tube" />
<!-- 回测分析 -->
<UIcon name="i-lucide-chart-bar" />
<!-- 仪表盘 -->

<!-- 操作图标 -->
<UIcon name="i-lucide-refresh" />
<!-- 刷新数据 -->
<UIcon name="i-lucide-download" />
<!-- 导出数据 -->
<UIcon name="i-lucide-settings" />
<!-- 配置 -->
<UIcon name="i-lucide-info" />
<!-- 详情 -->
```

#### 1.2.14 设计规范总结

**核心设计原则**:

1. **简洁清晰**: 界面信息层次分明，避免视觉噪音
2. **数据驱动**: 以数据展示为核心，图表可视化优先
3. **操作直观**: 常用操作一键可达，减少用户操作步骤
4. **状态明确**: 系统状态、决策结果、风险等级清晰可见

**实施检查清单**:

- [ ] 色彩系统符合主色调规范
- [ ] 排版层级清晰统一
- [ ] 组件样式与模板一致
- [ ] 响应式布局适配良好
- [ ] 交互状态反馈明确
- [ ] 图标使用规范统一
- [ ] 数据可视化配色协调
- [ ] 可访问性支持完善

### 1.3 项目结构适配

```
nuxtfrontend/
├── app/
│   ├── assets/              # 静态资源
│   ├── components/          # 可复用组件
│   │   ├── dashboard/       # 仪表盘组件
│   │   ├── stocks/          # 股票相关组件
│   │   ├── decisions/       # 决策相关组件
│   │   ├── models/          # 模型相关组件
│   │   └── backtest/        # 回测相关组件
│   ├── composables/         # 组合式函数
│   ├── layouts/             # 布局组件
│   ├── pages/               # 页面组件
│   ├── stores/              # 状态管理
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数
├── nuxt.config.ts           # Nuxt 配置
└── package.json
```

## 2. 页面路由设计

### 2.1 路由结构

```typescript
// 基于 Nuxt UI 4.0 Dashboard 模板的路由适配
const routes = [
  {
    path: "/",
    name: "dashboard",
    component: DashboardPage,
    meta: { title: "仪表盘", icon: "i-lucide-chart-bar" },
  },
  {
    path: "/stocks",
    name: "stocks",
    component: StocksPage,
    meta: { title: "股票监控", icon: "i-lucide-trending-up" },
  },
  {
    path: "/decisions",
    name: "decisions",
    component: DecisionsPage,
    meta: { title: "决策分析", icon: "i-lucide-target" },
  },
  {
    path: "/models",
    name: "models",
    component: ModelsPage,
    meta: { title: "模型管理", icon: "i-lucide-brain" },
  },
  {
    path: "/backtest",
    name: "backtest",
    component: BacktestPage,
    meta: { title: "回测分析", icon: "i-lucide-test-tube" },
  },
];
```

### 2.2 页面功能设计

#### 2.2.1 仪表盘页面 (Dashboard)

- **系统概览**: 关键指标展示
- **实时决策**: 最新决策结果
- **模型性能**: 模型表现监控
- **系统状态**: 健康检查状态

#### 2.2.2 股票监控页面 (Stocks)

- **股票列表**: 活跃股票展示
- **数据查看**: 历史数据图表
- **数据刷新**: 手动更新数据
- **股票筛选**: 按市场/状态筛选

#### 2.2.3 决策分析页面 (Decisions)

- **决策历史**: 历史决策记录
- **决策详情**: 投票详情展示
- **批量操作**: 批量生成决策
- **筛选查询**: 按股票/日期筛选

#### 2.2.4 模型管理页面 (Models)

- **模型列表**: 活跃模型展示
- **性能监控**: 模型性能指标
- **参数配置**: 模型参数调整
- **回测分析**: 模型回测结果

#### 2.2.5 回测分析页面 (Backtest)

- **回测配置**: 回测参数设置
- **结果展示**: 回测性能指标
- **对比分析**: 多模型对比
- **组合回测**: 投资组合分析

## 3. 组件架构设计

### 3.1 核心组件分类

#### 3.1.1 数据展示组件

- `StockTable`: 股票数据表格
- `DecisionList`: 决策列表组件
- `ModelCard`: 模型信息卡片
- `PerformanceChart`: 性能图表组件

#### 3.1.2 交互组件

- `DateRangePicker`: 日期范围选择器
- `StockFilter`: 股票筛选器
- `DecisionGenerator`: 决策生成器
- `BacktestConfig`: 回测配置器

#### 3.1.3 可视化组件

- `PriceChart`: 价格走势图
- `VoteChart`: 投票分布图
- `PerformanceMetrics`: 性能指标展示
- `RiskIndicator`: 风险指示器

### 3.2 组件通信设计

```typescript
// 组件间通信模式
interface ComponentCommunication {
  // Props 传递
  props: {
    data: StockData[];
    loading: boolean;
    config: BacktestConfig;
  };

  // 事件发射
  emits: {
    "filter-change": (filters: FilterParams) => void;
    "decision-generate": (symbol: string) => void;
    "model-update": (model: ModelInfo) => void;
  };

  // 插槽使用
  slots: {
    default: () => VNode;
    header: (props: { title: string }) => VNode;
    actions: (props: { item: any }) => VNode;
  };
}
```

## 4. 状态管理设计

### 4.1 Pinia Store 结构

```typescript
// stores/app.ts
export const useAppStore = defineStore("app", () => {
  // 状态定义
  const stocks = ref<StockInfo[]>([]);
  const decisions = ref<DecisionResult[]>([]);
  const models = ref<ModelInfo[]>([]);
  const backtestResults = ref<BacktestResult[]>([]);
  const loading = ref(false);
  const selectedStock = ref<StockInfo | null>(null);

  // Getters
  const activeStocks = computed(() =>
    stocks.value.filter((stock) => stock.isActive)
  );

  const recentDecisions = computed(() => decisions.value.slice(0, 10));

  const modelPerformance = computed(() =>
    models.value.map((model) => ({
      ...model,
      performance: calculatePerformance(model),
    }))
  );

  // Actions
  const fetchStocks = async (params?: StockQueryParams) => {
    loading.value = true;
    try {
      const response = await stockApi.getStocks(params);
      stocks.value = response.data.data;
    } finally {
      loading.value = false;
    }
  };

  const generateDecision = async (symbol: string, date: string) => {
    const response = await decisionApi.generateDecision(symbol, date);
    decisions.value.unshift(response.data);
  };

  return {
    // State
    stocks,
    decisions,
    models,
    backtestResults,
    loading,
    selectedStock,

    // Getters
    activeStocks,
    recentDecisions,
    modelPerformance,

    // Actions
    fetchStocks,
    generateDecision,
  };
});
```

### 4.2 模块化 Store 设计

```typescript
// stores/stocks.ts - 股票数据管理
export const useStockStore = defineStore("stocks", () => {
  const stocks = ref<StockInfo[]>([]);
  const stockData = ref<Map<string, StockDailyData[]>>(new Map());
  const loading = ref(false);

  // 股票数据操作...
});

// stores/decisions.ts - 决策数据管理
export const useDecisionStore = defineStore("decisions", () => {
  const decisions = ref<DecisionResult[]>([]);
  const decisionHistory = ref<Map<string, DecisionHistory[]>>(new Map());

  // 决策数据操作...
});

// stores/models.ts - 模型数据管理
export const useModelStore = defineStore("models", () => {
  const models = ref<ModelInfo[]>([]);
  const modelPerformance = ref<Map<number, ModelPerformance[]>>(new Map());

  // 模型数据操作...
});
```

## 5. API 集成设计

### 5.1 API 服务封装

```typescript
// composables/api.ts
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBaseUrl || "http://localhost:8099/api/v1";

  const request = $fetch.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    onRequest({ options }) {
      // 请求拦截器
      console.log("API Request:", options.method, options.url);
    },
    onResponse({ response }) {
      // 响应拦截器
      if (response.status >= 400) {
        throw new Error(`API Error: ${response.status}`);
      }
    },
  });

  return { request };
};

// api/stocks.ts
export const stockApi = {
  // 获取股票列表
  async getStocks(params?: StockQueryParams) {
    const { request } = useApi();
    return request<PaginatedResponse<StockInfo>>("/stocks", { params });
  },

  // 获取股票数据
  async getStockData(symbol: string, startDate: string, endDate: string) {
    const { request } = useApi();
    return request<StockDataResponse>(`/stocks/${symbol}/data`, {
      params: { start_date: startDate, end_date: endDate },
    });
  },

  // 刷新股票数据
  async refreshStockData(symbol: string) {
    const { request } = useApi();
    return request<RefreshResponse>(`/stocks/${symbol}/refresh`, {
      method: "POST",
    });
  },
};

// api/decisions.ts
export const decisionApi = {
  // 生成决策
  async generateDecision(symbol: string, tradeDate: string) {
    const { request } = useApi();
    return request<DecisionResponse>("/decisions/generate", {
      method: "POST",
      body: { symbol, trade_date: tradeDate },
    });
  },

  // 批量生成决策
  async generateBatchDecisions(symbols: string[], tradeDate: string) {
    const { request } = useApi();
    return request<BatchDecisionResponse>("/decisions/batch", {
      method: "POST",
      body: { symbols, trade_date: tradeDate },
    });
  },

  // 获取决策历史
  async getDecisionHistory(symbol: string, startDate: string, endDate: string) {
    const { request } = useApi();
    return request<DecisionHistoryResponse>(`/decisions/history/${symbol}`, {
      params: { start_date: startDate, end_date: endDate },
    });
  },
};
```

### 5.2 错误处理机制

```typescript
// composables/errorHandler.ts
export const useErrorHandler = () => {
  const toast = useToast();

  const handleApiError = (error: any) => {
    console.error("API Error:", error);

    if (error.status === 404) {
      toast.add({
        title: "资源未找到",
        description: "请求的资源不存在",
        color: "orange",
      });
    } else if (error.status === 500) {
      toast.add({
        title: "服务器错误",
        description: "服务器内部错误，请稍后重试",
        color: "red",
      });
    } else {
      toast.add({
        title: "请求失败",
        description: error.message || "网络请求失败",
        color: "red",
      });
    }
  };

  return { handleApiError };
};
```

## 6. 数据可视化设计

### 6.1 图表类型选择

#### 6.1.1 价格走势图

- **技术**: Unovis Line Chart
- **数据**: 股票日线数据
- **功能**: 价格趋势展示，技术指标叠加

#### 6.1.2 投票分布图

- **技术**: Unovis Pie Chart / Bar Chart
- **数据**: 模型投票结果
- **功能**: 决策投票可视化

#### 6.1.3 性能指标图

- **技术**: Unovis Area Chart
- **数据**: 模型性能历史
- **功能**: 性能趋势分析

#### 6.1.4 风险指示器

- **技术**: Custom Component + CSS
- **数据**: 风险等级指标
- **功能**: 风险状态可视化

### 6.2 图表组件设计

```vue
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
            @click="selectedPeriod = period.value"
          >
            {{ period.label }}
          </UButton>
        </div>
      </div>
    </template>

    <VisXYContainer :data="chartData" class="h-80">
      <VisLine :x="x" :y="y" color="var(--ui-primary)" />
      <VisArea :x="x" :y="y" color="var(--ui-primary)" :opacity="0.1" />
      <VisAxis type="x" :tick-format="formatDate" />
      <VisAxis type="y" :tick-format="formatPrice" />
      <VisCrosshair :template="tooltipTemplate" />
    </VisXYContainer>
  </UCard>
</template>

<script setup lang="ts">
interface PriceData {
  date: Date;
  price: number;
  volume: number;
}

const props = defineProps<{
  symbol: string;
  data: StockDailyData[];
}>();

const selectedPeriod = ref<"1M" | "3M" | "6M" | "1Y">("1M");
const periods = [
  { label: "1月", value: "1M" },
  { label: "3月", value: "3M" },
  { label: "6月", value: "6M" },
  { label: "1年", value: "1Y" },
];

const chartData = computed(() =>
  props.data.map((item) => ({
    date: new Date(item.trade_date),
    price: Number(item.close_price),
    volume: item.volume,
  }))
);

const x = (d: PriceData) => d.date;
const y = (d: PriceData) => d.price;

const formatDate = (date: Date) =>
  date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });

const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

const tooltipTemplate = (d: PriceData) =>
  `${d.date.toLocaleDateString("zh-CN")}: ¥${d.price.toFixed(2)}`;
</script>
```

## 7. 响应式设计

### 7.1 断点设计

```css
/* 响应式断点 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### 7.2 布局适配

```vue
<!-- 响应式布局示例 -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- 统计卡片 -->
    <StatCard
      v-for="stat in stats"
      :key="stat.title"
      :title="stat.title"
      :value="stat.value"
      :trend="stat.trend"
      class="col-span-1"
    />
  </div>

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- 图表区域 -->
    <PriceChart :symbol="selectedSymbol" :data="priceData" />
    <VoteChart :decision="currentDecision" />
  </div>
</template>
```

## 8. 性能优化策略

### 8.1 数据缓存

```typescript
// composables/cache.ts
export const useCache = () => {
  const cache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

  const get = (key: string) => {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > CACHE_DURATION) {
      cache.delete(key);
      return null;
    }

    return item.data;
  };

  const set = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() });
  };

  return { get, set };
};
```

### 8.2 懒加载

```vue
<!-- 组件懒加载 -->
<template>
  <div>
    <Suspense>
      <template #default>
        <LazyPriceChart :symbol="symbol" />
      </template>
      <template #fallback>
        <USkeleton class="h-80 w-full" />
      </template>
    </Suspense>
  </div>
</template>
```

## 9. 安全考虑

### 9.1 输入验证

```typescript
// utils/validation.ts
export const validateStockSymbol = (symbol: string): boolean => {
  const pattern = /^[0-9]{6}\.(SH|SZ)$/;
  return pattern.test(symbol);
};

export const validateDateRange = (start: Date, end: Date): boolean => {
  return start <= end && start <= new Date();
};

// 9.2 XSS 防护
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, "");
};
```

## 10. 类型定义设计

### 10.1 核心类型定义

```typescript
// types/stocks.ts
export interface StockInfo {
  id: number;
  symbol: string;
  name: string;
  market: string;
  isActive: boolean;
  createdAt: string;
}

export interface StockDailyData {
  id: number;
  symbol: string;
  tradeDate: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  turnover?: number;
  createdAt: string;
}

// types/decisions.ts
export interface ModelDecision {
  modelId: number;
  modelName: string;
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  signalStrength: number;
  reasoning?: string;
}

export interface FinalDecision {
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  voteSummary: {
    BUY: number;
    SELL: number;
    HOLD: number;
  };
  modelDetails: ModelDecision[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
}

export interface DecisionResult {
  symbol: string;
  tradeDate: string;
  finalDecision: FinalDecision;
  riskAssessment: {
    isApproved: boolean;
    riskLevel: string;
    warnings: string[];
    adjustedDecision: string;
    positionSuggestion: number;
  };
  timestamp: string;
}

// types/models.ts
export interface ModelInfo {
  modelId: number;
  name: string;
  description?: string;
  modelType: "technical" | "ml" | "dl";
  parameters: Record<string, any>;
  weight: number;
  isActive: boolean;
  performanceMetrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    totalReturn?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
  };
}

// types/backtest.ts
export interface BacktestResult {
  totalReturn: number;
  annualReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
  trades: Trade[];
  equityCurve: EquityPoint[];
  signals: Signal[];
}

export interface Trade {
  type: "BUY" | "SELL";
  date: string;
  price: number;
  shares: number;
  value: number;
  profit?: number;
  reason: string;
  symbol: string;
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface Signal {
  date: string;
  signal: "BUY" | "SELL" | "HOLD";
  price: number;
  model: string;
  confidence: number;
}

// types/api.ts
export interface APIResponse<T = any> {
  data?: T;
  message: string;
  status: "success" | "error";
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}
```

### 10.2 查询参数类型

```typescript
// types/query.ts
export interface StockQueryParams {
  skip?: number;
  limit?: number;
  activeOnly?: boolean;
  market?: string;
}

export interface DecisionQueryParams {
  symbol?: string;
  startDate?: string;
  endDate?: string;
  decisionType?: "BUY" | "SELL" | "HOLD";
  skip?: number;
  limit?: number;
}

export interface BacktestQueryParams {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  modelIds?: number[];
}
```

## 11. 部署配置

### 11.1 环境变量配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:8099/api/v1",
      appName: "股票回测决策系统",
      appVersion: "1.0.0",
    },
  },

  // 其他配置...
});
```

### 11.2 构建优化

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 构建优化配置
  nitro: {
    preset: "node-server",
  },

  // 资源优化
  build: {
    transpile: ["@unovis/vue"],
  },

  // 性能优化
  experimental: {
    payloadExtraction: false,
  },

  // 开发工具
  devtools: {
    enabled: true,
  },
});
```

## 12. 开发指南

### 12.1 开发环境设置

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

### 12.2 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 Vue 3 Composition API 最佳实践
- 使用 ESLint 和 Prettier 保持代码风格一致
- 编写组件文档和类型定义

### 12.3 测试策略

```typescript
// 单元测试示例
describe("StockTable Component", () => {
  it("should render stock data correctly", () => {
    const wrapper = mount(StockTable, {
      props: {
        stocks: mockStocks,
        loading: false,
      },
    });

    expect(wrapper.findAll("tr").length).toBe(mockStocks.length + 1);
  });
});
```

## 13. 总结

### 13.1 设计亮点

1. **现代化技术栈**: 采用 Nuxt 3 + TypeScript + Nuxt UI 4.0 的现代化技术组合
2. **模块化架构**: 清晰的组件分层和状态管理设计
3. **类型安全**: 完整的 TypeScript 类型定义支持
4. **响应式设计**: 适配多种屏幕尺寸的响应式布局
5. **性能优化**: 数据缓存、懒加载等性能优化策略
6. **可视化丰富**: 基于 Unovis 的多样化数据可视化方案

### 13.2 适配优势

- **无缝集成**: 基于现有 Nuxt UI 4.0 Dashboard 模板，减少开发成本
- **API 兼容**: 完整适配后端 FastAPI 接口设计
- **用户体验**: 继承模板的优秀用户体验和交互设计
- **维护性**: 清晰的代码结构和类型定义，便于维护和扩展

### 13.3 后续规划

1. **实时数据**: 集成 WebSocket 实现实时数据更新
2. **移动端适配**: 优化移动端用户体验
3. **高级功能**: 添加投资组合管理、风险分析等高级功能
4. **国际化**: 支持多语言国际化
5. **主题定制**: 支持深色模式等主题定制

---

**文档版本**: v2.0
**最后更新**: 2025-10-17
**维护者**: 前端架构团队
