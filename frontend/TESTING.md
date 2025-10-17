# STOK 前端测试套件文档

## 概述

本文档描述了 STOK 项目前端的完整测试套件配置和使用方法。测试套件包含单元测试、集成测试和 E2E 测试，确保代码质量和功能稳定性。

## 测试架构

### 测试类型

1. **单元测试** - 测试独立的函数、组件和 Store
2. **集成测试** - 测试组件间的协作和 API 集成
3. **E2E 测试** - 测试完整的用户流程

### 技术栈

- **测试运行器**: Vitest
- **组件测试**: Vue Test Utils
- **E2E 测试**: Playwright
- **API 模拟**: Axios Mock Adapter
- **覆盖率**: @vitest/coverage-v8

## 测试文件结构

```
frontend/tests/
├── setup.ts                    # 全局测试配置
├── unit/                       # 单元测试
│   ├── utils/                  # 工具函数测试
│   │   └── stockUtils.test.ts
│   ├── api/                    # API 服务测试
│   │   └── api.test.ts
│   ├── store/                  # 状态管理测试
│   │   └── stocks.test.ts
│   ├── components/             # 组件测试
│   │   └── stocks/
│   │       └── StockTable.test.ts
│   └── views/                  # 页面组件测试
│       └── Stocks.test.ts
├── integration/                # 集成测试
│   └── setup.ts
├── e2e/                        # E2E 测试
│   ├── setup.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
└── utils/                      # 测试工具
    └── test-utils.ts
```

## 配置说明

### 主要配置文件

1. **vitest.config.ts** - Vitest 测试配置
2. **playwright.config.ts** - Playwright E2E 测试配置
3. **package.json** - 测试脚本和依赖

### 测试环境设置

- **测试环境**: jsdom
- **全局设置**: 模拟 Element Plus 组件、localStorage、API 等
- **覆盖率阈值**: 70% (branches, functions, lines, statements)

## 测试脚本

### 单元测试

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行单元测试
npm run test:unit

# 运行测试 UI
npm run test:ui
```

### E2E 测试

```bash
# 运行 E2E 测试
npm run test:e2e

# 运行带界面的 E2E 测试
npm run test:e2e:headed

# 调试 E2E 测试
npm run test:e2e:debug
```

### 集成测试

```bash
# 运行集成测试
npm run test:integration
```

### 完整测试套件

```bash
# 运行所有测试类型
npm run test:all
```

## 测试覆盖范围

### 工具函数测试 (`stockUtils.test.ts`)

- 价格格式化和计算
- 技术指标计算 (MA, RSI, MACD, 布林带)
- 数据过滤和统计
- 搜索建议生成
- 股票代码验证

### API 服务测试 (`api.test.ts`)

- 请求/响应拦截器
- 错误处理机制
- 股票 API 服务
- 认证和缓存处理

### Store 状态管理测试 (`stocks.test.ts`)

- 状态初始化和计算属性
- 异步操作 (fetchStocks, fetchStock, searchStocks)
- 缓存机制
- 错误处理和状态重置

### 组件测试 (`StockTable.test.ts`)

- 组件渲染和 props 验证
- 事件处理和 emit
- 分页和排序功能
- 列设置和自定义功能

### 页面组件测试 (`Stocks.test.ts`)

- 页面布局和路由
- 数据管理和状态同步
- 用户交互流程
- 错误边界处理

## 测试数据工厂

### 测试工具函数 (`test-utils.ts`)

提供以下测试数据工厂：

```typescript
// 创建模拟数据
createMockStock();
createMockStockDailyData();
createMockStockDataArray();
createMockBacktestModel();
createMockDecisionResponse();

// 测试辅助函数
waitForAsync();
simulateUserInteraction();
createMockApiError();
validateComponentProps();
validateComponentEmits();
```

## E2E 测试场景

### 用户旅程

1. **股票分析流程**

   - 用户登录 → 搜索股票 → 查看详情 → 分析信号

2. **模型管理流程**

   - 查看模型列表 → 创建模型 → 配置参数 → 测试性能

3. **决策生成流程**

   - 选择股票 → 生成决策 → 查看详情 → 风险评估

4. **回测分析流程**
   - 配置参数 → 运行回测 → 查看结果 → 模型比较

### 关键路径

- 用户认证流程
- 股票搜索功能
- 数据展示功能
- 模型性能评估
- 决策准确性验证
- 回测结果可靠性

## 持续集成

### GitHub Actions 配置建议

```yaml
name: Frontend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
```

## 最佳实践

### 编写测试

1. **命名规范**: 使用描述性的测试名称
2. **单一职责**: 每个测试只验证一个功能
3. **AAA 模式**: Arrange-Act-Assert
4. **模拟外部依赖**: 使用 vi.mock() 模拟 API 调用
5. **清理状态**: 在每个测试后重置状态

### 测试数据

1. **使用工厂函数**: 创建一致的测试数据
2. **避免硬编码**: 使用可配置的测试数据
3. **边界测试**: 测试空数据、错误情况
4. **性能考虑**: 避免不必要的异步操作

### 调试技巧

1. **使用 test:ui**: 可视化测试运行器
2. **调试模式**: 使用 --debug 标志
3. **截图功能**: E2E 测试自动截图
4. **跟踪记录**: Playwright 跟踪功能

## 故障排除

### 常见问题

1. **模块未找到**: 检查 tsconfig 路径配置
2. **组件渲染错误**: 验证 Element Plus 组件模拟
3. **异步测试超时**: 调整 timeout 配置
4. **E2E 测试失败**: 检查网络连接和服务器状态

### 性能优化

1. **并行测试**: 使用 fullyParallel 配置
2. **测试分组**: 按功能模块组织测试
3. **缓存利用**: 重用浏览器实例
4. **资源清理**: 及时清理测试数据

## 贡献指南

### 添加新测试

1. 在相应的测试目录创建测试文件
2. 使用现有的测试模式和工具函数
3. 确保测试覆盖所有边界情况
4. 验证测试通过并更新文档

### 维护测试

1. 定期更新测试数据
2. 修复失败的测试
3. 优化测试性能
4. 保持测试文档同步

## 联系方式

如有测试相关问题，请联系开发团队或查看项目文档。
