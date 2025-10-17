# 股票数据展示模块

STOK 项目的股票数据展示模块，提供完整的股票 CRUD 操作界面、实时数据展示、数据可视化等功能。

## 组件概览

### 核心组件

1. **StockSearch** - 股票搜索组件

   - 实时搜索建议
   - 搜索历史记录
   - 热门股票推荐

2. **StockTable** - 股票表格组件

   - 股票列表展示
   - 分页和排序
   - 列设置和筛选

3. **StockChart** - 股票图表组件

   - K 线图展示
   - 技术指标叠加
   - 图表交互功能

4. **StockDetail** - 股票详情组件
   - 股票基本信息
   - 实时价格数据
   - 技术指标分析

### 状态管理

- **useStocksStore** - 股票数据状态管理
  - 股票列表管理
  - 数据缓存机制
  - 分页和搜索状态

### 工具函数

- **stockUtils** - 股票数据处理工具
  - 价格格式化
  - 技术指标计算
  - 数据转换

## 快速开始

### 安装依赖

确保项目已安装必要的依赖：

```bash
npm install echarts @element-plus/icons-vue
```

### 基本使用

#### 1. 在页面中使用股票列表

```vue
<template>
  <div>
    <StockSearch @select="handleStockSelect" />
    <StockTable
      :stocks="stocks"
      :loading="loading"
      @refresh="fetchStocks"
      @view="viewStockDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { StockSearch, StockTable, useStocksStore } from '@/components/stocks';
import { onMounted } from 'vue';

const stocksStore = useStocksStore();
const stocks = computed(() => stocksStore.stockList);
const loading = computed(() => stocksStore.isLoading);

const handleStockSelect = stock => {
  console.log('选择股票:', stock);
};

const fetchStocks = async () => {
  await stocksStore.fetchStocks();
};

const viewStockDetail = stock => {
  // 跳转到详情页面或打开弹窗
};

onMounted(() => {
  fetchStocks();
});
</script>
```

#### 2. 使用股票详情页面

```vue
<template>
  <StockDetail :symbol="symbol" />
</template>

<script setup lang="ts">
import { StockDetail } from '@/components/stocks';
import { useRoute } from 'vue-router';

const route = useRoute();
const symbol = computed(() => route.params.symbol as string);
</script>
```

#### 3. 使用股票图表

```vue
<template>
  <StockChart
    :chart-data="chartData"
    :symbol="symbol"
    chart-type="candle"
    :indicators="['MA5', 'MA10', 'VOLUME']"
  />
</template>

<script setup lang="ts">
import { StockChart } from '@/components/stocks';
import { ref, onMounted } from 'vue';

const symbol = ref('AAPL');
const chartData = ref([]);

const fetchChartData = async () => {
  // 获取图表数据
};
</script>
```

## API 集成

### 股票数据 API

组件已集成以下 API 端点：

- `GET /api/v1/stocks` - 获取股票列表
- `GET /api/v1/stocks/{symbol}` - 获取股票详情
- `GET /api/v1/stocks/{symbol}/data` - 获取股票历史数据
- `POST /api/v1/stocks/{symbol}/refresh` - 刷新股票数据

### 数据格式

#### Stock 类型

```typescript
interface Stock {
  id: number;
  symbol: string;
  name: string;
  market: string;
  industry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### StockDailyData 类型

```typescript
interface StockDailyData {
  id: number;
  stock_id: number;
  trade_date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  turnover?: number;
  created_at: string;
  updated_at: string;
}
```

## 功能特性

### 1. 实时数据展示

- 自动刷新机制
- 数据缓存优化
- 错误重试机制

### 2. 数据可视化

- K 线图展示
- 成交量柱状图
- 技术指标叠加（MA、RSI、MACD、布林带等）

### 3. 搜索和筛选

- 实时搜索建议
- 多条件筛选
- 搜索历史记录

### 4. 响应式设计

- 移动端适配
- 表格列自适应
- 图表响应式布局

### 5. 用户体验

- 加载状态指示
- 错误处理
- 空状态提示

## 自定义配置

### StockTable 配置

```vue
<StockTable
  :stocks="stocks"
  :show-toolbar="true"
  :show-pagination="true"
  :selectable="true"
  :show-signal="true"
  :show-confidence="true"
  :show-actions="true"
  @selection-change="handleSelection"
  @sort-change="handleSort"
/>
```

### StockChart 配置

```vue
<StockChart
  :chart-data="data"
  :chart-type="'candle'"
  :time-period="'1m'"
  :show-toolbar="true"
  :show-indicators="true"
  :indicators="['MA5', 'MA10', 'RSI', 'VOLUME']"
  height="500px"
  @period-change="handlePeriodChange"
  @chart-type-change="handleChartTypeChange"
/>
```

### StockSearch 配置

```vue
<StockSearch
  v-model="searchQuery"
  :placeholder="'搜索股票...'"
  :trigger-on-focus="true"
  :show-history="true"
  :show-hot="true"
  :hot-stocks="hotStocks"
  @select="handleSelect"
  @search="handleSearch"
  @change="handleChange"
/>
```

## 技术实现

### 架构设计

- **组件化设计** - 每个组件职责单一，易于维护
- **状态管理** - 使用 Pinia 进行集中状态管理
- **TypeScript** - 完整的类型定义
- **响应式设计** - 基于 Vue 3 Composition API

### 性能优化

- **数据缓存** - 减少重复 API 调用
- **虚拟滚动** - 大数据量表格性能优化
- **图表懒加载** - 按需加载图表资源
- **防抖搜索** - 优化搜索性能

### 错误处理

- **网络错误** - 自动重试机制
- **数据验证** - 输入数据格式验证
- **边界情况** - 空数据、加载失败等状态处理

## 开发指南

### 添加新的技术指标

1. 在 `stockUtils.ts` 中添加指标计算函数
2. 在 `StockChart.vue` 中集成新的指标
3. 更新类型定义

### 自定义样式

组件使用 CSS 变量进行样式定制：

```css
:root {
  --stock-primary-color: #409eff;
  --stock-success-color: #67c23a;
  --stock-danger-color: #f56c6c;
  --stock-warning-color: #e6a23c;
}
```

### 国际化支持

组件支持中英文切换，通过全局配置实现。

## 常见问题

### Q: 如何添加新的股票市场？

A: 在 `StockTable` 组件中添加新的市场标签，并在 API 中支持相应的市场数据。

### Q: 图表加载缓慢怎么办？

A: 可以启用数据缓存，或使用数据分页加载。

### Q: 如何自定义技术指标？

A: 在 `stockUtils.ts` 中添加自定义指标计算函数，并在图表组件中集成。

## 版本历史

- v1.0.0 - 初始版本，基础股票数据展示功能
- v1.1.0 - 添加技术指标和图表功能
- v1.2.0 - 优化性能和用户体验

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个模块。
