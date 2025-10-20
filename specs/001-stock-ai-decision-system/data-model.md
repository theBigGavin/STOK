# 图表库迁移数据模型

## 概述

本文档定义了图表库迁移过程中的数据模型和转换规则。迁移的核心是保持现有数据结构不变，仅调整数据访问和渲染方式。

## 核心数据实体

### 1. 净值曲线数据 (EquityCurve)

**现有结构**:

```typescript
interface EquityPoint {
  date: string;
  value: number;
}

interface EquityCurve {
  name: string;
  data: EquityPoint[];
  color: string;
}
```

**迁移策略**: 保持结构不变，调整渲染方式

### 2. 性能数据 (PerformanceData)

**现有结构**:

```typescript
interface PerformanceHistory {
  date: string;
  modelId: number;
  modelName: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    totalReturn?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
  };
}
```

**迁移策略**: 保持结构不变，调整数据聚合方式

### 3. 投票数据 (VoteData)

**现有结构**:

```typescript
interface ModelDecision {
  modelId: number;
  modelName: string;
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  signalStrength: number;
}

interface VoteData {
  decision: string;
  count: number;
  percentage: number;
  color: string;
}
```

**迁移策略**: 保持结构不变，调整图表渲染方式

## 数据转换规则

### 1. 净值曲线数据转换

**Unovis 方式**:

```typescript
const chartData = computed<EquityData[]>(() => {
  // 复杂的数据合并逻辑
  const dateMap = new Map<string, EquityData>();
  // ... 数据合并代码
  return Array.from(dateMap.values());
});

const x = (d: EquityData) => d.date;
const getCurveValue = (d: EquityData, curveName: string) => d[curveName] || 0;
```

**Ant Design Charts 方式**:

```typescript
const chartConfig = computed(() => {
  return props.curves.map((curve) => ({
    type: "line",
    data: curve.data.map((point) => ({
      date: new Date(point.date),
      value: point.value,
      name: curve.name,
    })),
    xField: "date",
    yField: "value",
    seriesField: "name",
    color: curve.color,
    smooth: true,
  }));
});
```

### 2. 性能数据转换

**Unovis 方式**:

```typescript
const chartData = computed<PerformanceData[]>(() => {
  // 按日期分组的数据聚合
  const dateGroups = props.data.reduce((acc, item) => {
    const date = new Date(item.date);
    if (!acc[date.toISOString()]) {
      acc[date.toISOString()] = { date } as PerformanceData;
    }
    acc[date.toISOString()][item.modelName] =
      item.metrics[selectedMetric.value];
    return acc;
  }, {});
  return Object.values(dateGroups);
});
```

**Ant Design Charts 方式**:

```typescript
const chartConfig = computed(() => {
  const metric = selectedMetric.value;
  return {
    data: props.data.map((item) => ({
      date: new Date(item.date),
      value: item.metrics[metric],
      model: item.modelName,
    })),
    xField: "date",
    yField: "value",
    seriesField: "model",
    color: ({ model }) => getModelColor(model),
  };
});
```

### 3. 投票数据转换

**Unovis 方式**:

```typescript
const voteData = computed<VoteData[]>(() => {
  const decisionCounts = props.data.reduce((acc, item) => {
    acc[item.decision] = (acc[item.decision] || 0) + 1;
    return acc;
  }, {});

  const total = props.data.length;
  return Object.entries(decisionCounts).map(([decision, count]) => ({
    decision,
    count,
    percentage: (count / total) * 100,
    color: decisionColors[decision],
  }));
});
```

**Ant Design Charts 方式**:

```typescript
const chartConfig = computed(() => {
  const decisionCounts = props.data.reduce((acc, item) => {
    acc[item.decision] = (acc[item.decision] || 0) + 1;
    return acc;
  }, {});

  return {
    data: Object.entries(decisionCounts).map(([decision, count]) => ({
      decision,
      count,
      color: decisionColors[decision],
    })),
    xField: "decision",
    yField: "count",
    colorField: "color",
    label: {
      position: "middle",
      style: {
        fill: "#fff",
      },
    },
  };
});
```

## 配置对象映射

### 通用配置映射

| Unovis 配置         | Ant Design Charts 配置  | 说明               |
| ------------------- | ----------------------- | ------------------ |
| `:data`             | `data`                  | 数据源             |
| `:x` 函数           | `xField`                | X 轴字段           |
| `:y` 函数           | `yField`                | Y 轴字段           |
| `:color` 函数       | `colorField` 或 `color` | 颜色字段或固定颜色 |
| `VisAxis` 组件      | 内置轴配置              | 自动配置坐标轴     |
| `VisTooltip` 组件   | 内置提示框              | 自动显示提示信息   |
| `VisCrosshair` 组件 | 内置十字准星            | 鼠标悬停显示十字线 |

### 交互配置映射

| 交互功能 | Unovis 方式         | Ant Design Charts 方式   |
| -------- | ------------------- | ------------------------ |
| 工具提示 | `VisTooltip` 组件   | 内置 `tooltip` 配置      |
| 十字准星 | `VisCrosshair` 组件 | 内置 `crosshair` 配置    |
| 图例     | `VisLegend` 组件    | 内置 `legend` 配置       |
| 数据筛选 | 自定义逻辑          | 内置 `interactions` 配置 |

## 样式和主题

### 颜色映射

保持现有颜色系统不变：

```typescript
const decisionColors = {
  BUY: "var(--color-emerald-500)",
  SELL: "var(--color-red-500)",
  HOLD: "var(--color-amber-500)",
};

const modelColors = [
  "var(--color-primary-500)",
  "var(--color-emerald-500)",
  "var(--color-amber-500)",
  // ... 其他颜色
];
```

### 主题配置

创建统一的主题配置：

```typescript
const chartTheme = {
  // 与 UnoCSS 主题保持一致
  colors10: [
    "var(--color-primary-500)",
    "var(--color-emerald-500)",
    "var(--color-amber-500)",
    "var(--color-red-500)",
    "var(--color-purple-500)",
  ],
  // 其他主题配置...
};
```

## 迁移验证标准

### 功能对等性验证

1. **数据准确性**: 图表显示的数据与源数据一致
2. **交互完整性**: 工具提示、十字准星等交互功能正常工作
3. **响应式设计**: 图表在不同屏幕尺寸下正常显示
4. **性能表现**: 图表渲染和交互响应时间符合要求

### 视觉一致性验证

1. **颜色一致**: 图表颜色与现有 UI 保持一致
2. **样式统一**: 字体、间距等样式元素统一
3. **动画流畅**: 过渡动画流畅自然
4. **无障碍性**: 支持键盘导航和屏幕阅读器
