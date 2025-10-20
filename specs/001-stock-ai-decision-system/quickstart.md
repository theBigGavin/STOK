# 图表库迁移快速开始指南

## 概述

本指南提供从 Unovis 迁移到 Ant Design Charts 的快速开始步骤。迁移涉及 4 个主要图表组件，目标是保持功能完整性同时提升与现有 Ant Design 生态系统的集成度。

## 前置要求

- Node.js 18+
- pnpm 8+
- Nuxt 3 项目
- 现有 Unovis 图表组件

## 安装依赖

### 1. 安装 Ant Design Charts Vue

```bash
cd nuxtfrontend
pnpm add @ant-design/charts-vue
```

### 2. 移除 Unovis 依赖

```bash
pnpm remove @unovis/ts @unovis/vue
```

### 3. 更新 package.json

确保 `package.json` 包含新的依赖：

```json
{
  "dependencies": {
    "@ant-design/charts-vue": "^1.4.0"
    // 移除 @unovis/ts 和 @unovis/vue
  }
}
```

## 组件迁移步骤

### 1. 净值曲线图 (EquityCurveChart)

**迁移前** (Unovis):

```vue
<VisXYContainer :data="chartData" class="h-80">
  <VisLine :x="x" :y="(d) => getCurveValue(d, curve.name)" :color="curve.color" />
  <VisArea :x="x" :y="(d) => getCurveValue(d, curve.name)" :color="curve.color" :opacity="0.1" />
  <VisAxis type="x" :tick-format="formatDate" />
  <VisAxis type="y" :tick-format="formatEquity" />
  <VisCrosshair :template="tooltipTemplate" />
  <VisTooltip />
</VisXYContainer>
```

**迁移后** (Ant Design Charts):

```vue
<Line
  :chart-style="{ height: '320px' }"
  :data="transformedData"
  :x-field="'date'"
  :y-field="'value'"
  :series-field="'name'"
  :color="getCurveColor"
  :smooth="true"
  :tooltip="tooltipConfig"
  :legend="legendConfig"
  :interactions="[{ type: 'crosshair' }]"
/>
```

### 2. 性能趋势图 (PerformanceChart)

**迁移前**:

```vue
<VisXYContainer :data="chartData" class="h-80">
  <VisLine :x="x" :y="(d) => getMetricValue(d, model)" :color="getModelColor(model)" />
  <VisArea :x="x" :y="(d) => getMetricValue(d, model)" :color="getModelColor(model)" :opacity="0.1" />
  <VisAxis type="x" :tick-format="formatDate" />
  <VisAxis type="y" :tick-format="formatMetric" />
  <VisCrosshair :template="tooltipTemplate" />
  <VisTooltip />
</VisXYContainer>
```

**迁移后**:

```vue
<Line
  :chart-style="{ height: '320px' }"
  :data="performanceData"
  :x-field="'date'"
  :y-field="'value'"
  :series-field="'model'"
  :color="getModelColor"
  :smooth="true"
  :tooltip="performanceTooltip"
  :legend="performanceLegend"
  :interactions="[{ type: 'crosshair' }]"
/>
```

### 3. 投票分布图 (VoteChart)

**迁移前**:

```vue
<VisXYContainer :data="barChartData" class="h-80">
  <VisBar :x="barX" :y="barY" :color="barColor" />
  <VisAxis type="x" />
  <VisAxis type="y" :tick-format="formatCount" />
  <VisTooltip :triggers="barTooltipTriggers" />
</VisXYContainer>
```

**迁移后**:

```vue
<Bar
  :chart-style="{ height: '320px' }"
  :data="voteData"
  :x-field="'decision'"
  :y-field="'count'"
  :color-field="'color'"
  :label="voteLabel"
  :tooltip="voteTooltip"
  :interactions="[{ type: 'active-region' }]"
/>
```

### 4. 价格走势图 (PriceChart)

**迁移前**:

```vue
<!-- 自定义 SVG 图表 -->
<div ref="chartContainer" class="chart-canvas"></div>
```

**迁移后**:

```vue
<Line
  v-if="chartType === 'line'"
  :chart-style="{ height: '400px' }"
  :data="priceData"
  :x-field="'date'"
  :y-field="'close'"
  :color="priceColor"
  :tooltip="priceTooltip"
  :interactions="[{ type: 'crosshair' }]"
/>

<Candlestick
  v-else
  :chart-style="{ height: '400px' }"
  :data="priceData"
  :x-field="'date'"
  :y-field="['open', 'close', 'low', 'high']"
  :tooltip="candlestickTooltip"
  :interactions="[{ type: 'crosshair' }]"
/>
```

## 数据转换助手

创建 `utils/chartAdapter.ts` 文件提供数据转换功能：

```typescript
// 净值曲线数据转换
export function transformEquityData(curves: EquityCurve[]) {
  return curves.flatMap((curve) =>
    curve.data.map((point) => ({
      date: new Date(point.date),
      value: point.value,
      name: curve.name,
    }))
  );
}

// 性能数据转换
export function transformPerformanceData(
  data: PerformanceHistory[],
  metric: string
) {
  return data.map((item) => ({
    date: new Date(item.date),
    value: item.metrics[metric as keyof PerformanceMetrics] || 0,
    model: item.modelName,
  }));
}

// 投票数据转换
export function transformVoteData(data: ModelDecision[]) {
  const decisionCounts = data.reduce((acc, item) => {
    acc[item.decision] = (acc[item.decision] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(decisionCounts).map(([decision, count]) => ({
    decision,
    count,
    color: decisionColors[decision as keyof typeof decisionColors],
  }));
}
```

## 配置对象定义

创建统一的图表配置：

```typescript
// config/chartConfig.ts
export const tooltipConfig = {
  showTitle: true,
  formatter: (datum: any) => ({
    name: datum.name,
    value: formatValue(datum.value),
  }),
};

export const legendConfig = {
  position: "top" as const,
  itemName: {
    formatter: (text: string) => text,
  },
};

export const crosshairInteraction = {
  type: "crosshair" as const,
  cfg: {
    line: {
      style: {
        lineWidth: 1,
        stroke: "#bfbfbf",
        lineDash: [4, 4],
      },
    },
  },
};
```

## 测试验证

### 1. 功能测试

```typescript
// tests/components/charts/EquityCurveChart.test.ts
import { mount } from "@vue/test-utils";
import EquityCurveChart from "~/components/charts/EquityCurveChart.vue";

describe("EquityCurveChart", () => {
  it("renders chart with correct data", () => {
    const wrapper = mount(EquityCurveChart, {
      props: {
        curves: mockCurves,
        loading: false,
      },
    });

    expect(wrapper.find(".ant-chart").exists()).toBe(true);
    expect(wrapper.emitted("periodChange")).toBeTruthy();
  });
});
```

### 2. 可视化回归测试

使用 chrome-devtools MCP 进行可视化测试：

```typescript
// tests/e2e/charts.spec.ts
describe("Chart Migration E2E Tests", () => {
  it("should display equity curve correctly", async () => {
    // 使用 MCP 工具进行截图对比
    const snapshot = await takeChartSnapshot("equity-curve");
    expect(snapshot).toMatchVisualSnapshot();
  });
});
```

## 部署检查清单

- [ ] 所有图表组件已迁移
- [ ] 数据转换功能正常
- [ ] 交互功能完整
- [ ] 样式保持一致
- [ ] 测试用例通过
- [ ] 性能指标达标
- [ ] 无障碍性验证通过

## 故障排除

### 常见问题

1. **图表不显示**

   - 检查数据格式是否正确
   - 验证字段名是否匹配
   - 确认颜色配置有效

2. **工具提示不工作**

   - 检查 tooltip 配置
   - 验证数据字段存在
   - 确认交互配置正确

3. **样式不一致**
   - 检查主题配置
   - 验证颜色映射
   - 确认 CSS 变量正确

### 调试技巧

```typescript
// 在组件中添加调试信息
const debugConfig = computed(() => {
  console.log("Chart config:", config);
  console.log("Chart data:", data.value);
  return config;
});
```

## 下一步

1. 逐个组件进行迁移测试
2. 进行端到端功能验证
3. 性能基准测试
4. 用户验收测试
5. 生产环境部署
