# 图表库迁移研究文档

## 研究任务

### 1. Ant Design Charts Vue 集成研究

**研究目标**: 了解如何在 Nuxt 3 + Vue 3 项目中集成 Ant Design Charts

**发现**:

- Ant Design Charts 提供 Vue 3 版本：`@ant-design/charts-vue`
- 支持 Composition API 和 TypeScript
- 与现有的 Ant Design 生态系统（@nuxt/ui）有更好的集成
- 基于 G2Plot 图表引擎，提供丰富的图表类型和配置选项

**决策**: 使用 `@ant-design/charts-vue` 作为替代方案

**理由**:

- 与现有 UI 组件库保持一致
- 更丰富的图表类型和配置选项
- 更好的 TypeScript 支持
- 活跃的社区和维护

**替代方案考虑**:

- Chart.js: 功能丰富但集成度较低
- ECharts: 功能强大但学习曲线较陡
- D3.js: 灵活性高但开发成本大

### 2. Unovis 到 Ant Design Charts 组件映射

**研究目标**: 建立 Unovis 组件到 Ant Design Charts 的映射关系

**发现**:

| Unovis 组件      | Ant Design Charts 对应     | 迁移复杂度 |
| ---------------- | -------------------------- | ---------- |
| `VisXYContainer` | `Line`, `Area`, `DualAxes` | 中等       |
| `VisLine`        | `Line` 图表                | 低         |
| `VisArea`        | `Area` 图表                | 低         |
| `VisAxis`        | 内置轴配置                 | 低         |
| `VisCrosshair`   | 内置十字准星               | 低         |
| `VisTooltip`     | 内置提示框                 | 低         |
| `VisBar`         | `Bar` 图表                 | 低         |
| `VisLegend`      | 内置图例                   | 低         |

**决策**: 采用直接组件替换策略

**理由**:

- Ant Design Charts 提供更简洁的 API
- 减少组件嵌套层级
- 更好的性能表现

### 3. 数据格式转换需求

**研究目标**: 分析数据格式转换需求

**发现**:

- Unovis 使用函数式数据访问器模式
- Ant Design Charts 使用配置对象模式
- 需要将函数式数据访问器转换为配置对象

**转换示例**:

```typescript
// Unovis 方式
const x = (d: EquityData) => d.date;
const y = (d: EquityData) => d.value;

// Ant Design Charts 方式
const config = {
  data: chartData,
  xField: "date",
  yField: "value",
};
```

**决策**: 创建数据适配器函数

**理由**:

- 保持现有数据结构不变
- 简化迁移过程
- 便于后续维护

### 4. 交互功能兼容性

**研究目标**: 确保交互功能（工具提示、十字准星、事件）的兼容性

**发现**:

- Ant Design Charts 提供内置的交互功能
- 工具提示配置更灵活
- 事件系统略有不同但功能完整

**决策**: 使用 Ant Design Charts 的内置交互功能

**理由**:

- 减少自定义代码
- 更好的性能
- 更稳定的交互体验

### 5. 样式和主题一致性

**研究目标**: 确保图表样式与现有 UI 保持一致

**发现**:

- Ant Design Charts 支持主题配置
- 可以集成 UnoCSS 颜色系统
- 响应式设计支持良好

**决策**: 创建统一的图表主题配置

**理由**:

- 保持视觉一致性
- 便于主题切换
- 减少样式冲突

## 技术决策总结

### 主要技术栈

- **新图表库**: `@ant-design/charts-vue`
- **集成方式**: 直接组件替换 + 数据适配器
- **样式方案**: 统一主题配置
- **测试策略**: 组件级测试 + 可视化回归测试

### 迁移策略

1. **渐进式迁移**: 逐个组件迁移，确保每个组件功能完整
2. **功能对等**: 保持现有功能不变，仅替换底层实现
3. **数据兼容**: 保持现有数据结构，仅调整数据访问方式
4. **样式一致**: 确保视觉样式与现有 UI 保持一致

### 风险评估

- **低风险**: 组件 API 相对简单，迁移复杂度可控
- **中风险**: 交互功能需要仔细测试
- **低风险**: 数据格式转换有明确的映射关系

## 后续步骤

1. 创建数据模型文档
2. 定义 API 契约
3. 制定详细的迁移计划
4. 创建快速开始指南
