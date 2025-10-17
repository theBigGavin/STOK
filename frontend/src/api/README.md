# STOK API 服务层

## 概述

STOK 项目的完整 API 服务层，提供股票数据、模型管理、决策引擎和回测分析等功能。

## 安装和导入

```typescript
// 导入所有 API 服务
import * as api from '@/api';

// 或者按需导入特定服务
import { stocks, models, decisions, backtest } from '@/api';
import type { Stock, BacktestModel, DecisionResponse } from '@/api';
```

## API 服务模块

### 1. 股票数据 API (`stocks`)

```typescript
import { stocks } from '@/api';

// 获取股票列表
const stockList = await stocks.getStocks({
  skip: 0,
  limit: 50,
  active_only: true,
  market: 'SH',
});

// 获取股票详情
const stockDetail = await stocks.getStock('000001');

// 获取股票历史数据
const stockData = await stocks.getStockData('000001', {
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  include_features: true,
});

// 刷新股票数据
const refreshResult = await stocks.refreshStockData('000001');
```

### 2. 模型管理 API (`models`)

```typescript
import { models } from '@/api';

// 获取模型列表
const modelList = await models.getModels({
  active_only: true,
  model_type: 'moving_average_crossover',
});

// 创建新模型
const newModel = await models.createModel({
  name: '我的移动平均模型',
  model_type: 'moving_average_crossover',
  parameters: {
    short_window: 5,
    long_window: 20,
  },
});

// 运行模型回测
const backtestResult = await models.runModelBacktest(1, {
  symbol: '000001',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  initial_capital: 100000,
});
```

### 3. 决策引擎 API (`decisions`)

```typescript
import { decisions } from '@/api';

// 生成单个决策
const decision = await decisions.generateDecision({
  symbol: '000001',
  trade_date: '2024-10-17',
});

// 批量生成决策
const batchDecisions = await decisions.generateBatchDecisions({
  symbols: ['000001', '000002', '000003'],
  trade_date: '2024-10-17',
});

// 获取决策历史
const decisionHistory = await decisions.getDecisionHistory(
  '000001',
  '2024-10-01',
  '2024-10-17'
);

// 获取今日决策
const todayDecisions = await decisions.getTodayDecisions(['000001', '000002']);
```

### 4. 回测分析 API (`backtest`)

```typescript
import { backtest } from '@/api';

// 运行模型回测
const modelBacktest = await backtest.runModelBacktest({
  symbol: '000001',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  initial_capital: 100000,
  model_ids: [1, 2, 3],
});

// 执行组合回测
const portfolioBacktest = await backtest.runPortfolioBacktest({
  symbols: ['000001', '000002', '000003'],
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  initial_capital: 100000,
  rebalance_frequency: 'monthly',
});

// 比较回测结果
const comparison = await backtest.compareBacktestResults([
  {
    symbol: '000001',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    initial_capital: 100000,
  },
  {
    symbol: '000002',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    initial_capital: 100000,
  },
]);
```

## 错误处理

所有 API 方法都使用 try-catch 进行错误处理：

```typescript
try {
  const stocks = await api.stocks.getStocks();
  console.log('获取股票列表成功:', stocks);
} catch (error) {
  console.error('获取股票列表失败:', error.message);
  // 显示用户友好的错误信息
}
```

## 类型安全

API 服务层提供完整的 TypeScript 类型定义：

```typescript
import type {
  Stock,
  BacktestModel,
  DecisionResponse,
  BacktestResult,
} from '@/api';

// 类型安全的函数调用
const getStockData = async (symbol: string): Promise<Stock> => {
  return await api.stocks.getStock(symbol);
};

// 类型安全的参数验证
const createModel = async (
  model: BacktestModelCreate
): Promise<BacktestModel> => {
  return await api.models.createModel(model);
};
```

## 配置

API 基础配置在 `base.ts` 中定义：

- 基础 URL: `http://localhost:8099`
- 超时时间: 15 秒
- 请求头: `Content-Type: application/json`

## 开发说明

### 添加新的 API 方法

1. 在相应的服务文件中添加新方法
2. 在 `types/api.ts` 中添加对应的类型定义
3. 在服务文件中导出新方法

### 类型定义更新

当后端 API 发生变化时，需要更新 `types/api.ts` 中的类型定义以保持类型安全。

## 测试

运行 TypeScript 编译检查：

```bash
cd frontend
npm run type-check
```

## 注意事项

1. 所有 API 调用都是异步的，需要使用 `await` 或 `.then()`
2. 错误处理是必须的，建议使用 try-catch 包装
3. 类型定义提供了编译时类型检查，确保代码质量
4. API 响应已经过拦截器处理，直接返回数据部分
