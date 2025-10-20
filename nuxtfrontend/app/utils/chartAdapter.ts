// 图表数据转换工具 - 从 Unovis 格式转换为 Ant Design Charts 格式
import type { EquityCurve, PerformanceHistory, ModelDecision, StockPrice } from '~/types'
import { getModelColor, getDecisionColor, formatValue, formatDate } from './chartTheme'

// 临时类型定义 - 等待后端API完善
interface VoteData {
  decision: string;
  count: number;
  percentage: number;
  color: string;
}

interface PriceData {
  date: Date;
  value?: number;
  open?: number;
  close?: number;
  high?: number;
  low?: number;
  volume?: number;
}

// 净值曲线数据转换
export function transformEquityData(curves: EquityCurve[]) {
  return curves.flatMap((curve) =>
    curve.data.map((point) => ({
      date: new Date(point.date),
      value: point.value,
      name: curve.name,
      color: curve.color,
    }))
  )
}

// 性能数据转换
export function transformPerformanceData(
  data: PerformanceHistory[],
  metric: string
) {
  return data.map((item) => ({
    date: new Date(item.date),
    value: item.metrics[metric as keyof typeof item.metrics] || 0,
    model: item.modelName,
    modelId: item.modelId,
  }))
}

// 投票数据转换
export function transformVoteData(data: ModelDecision[]): VoteData[] {
  const decisionCounts = data.reduce((acc, item) => {
    const decision = item.voteType
    acc[decision] = (acc[decision] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = data.length

  return Object.entries(decisionCounts).map(([decision, count]) => ({
    decision,
    count,
    percentage: (count / total) * 100,
    color: getDecisionColor(decision),
  }))
}

// 价格数据转换
export function transformPriceData(prices: StockPrice[], chartType: 'line' | 'candlestick' = 'line'): PriceData[] {
  if (chartType === 'candlestick') {
    return prices.map((price) => ({
      date: new Date(price.date),
      open: price.openPrice || 0,
      close: price.closePrice || 0,
      high: price.highPrice || 0,
      low: price.lowPrice || 0,
      volume: price.volume || 0,
    }))
  }

  return prices.map((price) => ({
    date: new Date(price.date),
    value: price.closePrice || 0,
    open: price.openPrice || 0,
    high: price.highPrice || 0,
    low: price.lowPrice || 0,
    volume: price.volume || 0,
  }))
}

// 净值曲线图配置
export function getEquityChartConfig(data: any[]) {
  return {
    data,
    xField: 'date',
    yField: 'value',
    seriesField: 'name',
    color: ({ name }: { name: string }) => getModelColor(name),
    smooth: true,
    tooltip: {
      showTitle: true,
      formatter: (datum: any) => ({
        name: datum.name,
        value: formatValue(datum.value, 'currency'),
      }),
    },
    interactions: [
      { type: 'crosshair' },
      { type: 'element-active' },
    ],
    animation: {
      appear: {
        duration: 800,
        easing: 'easeQuadOut',
      },
    },
  }
}

// 性能趋势图配置
export function getPerformanceChartConfig(data: any[], metric: string) {
  return {
    data,
    xField: 'date',
    yField: 'value',
    seriesField: 'model',
    color: ({ model }: { model: string }) => getModelColor(model),
    smooth: true,
    tooltip: {
      showTitle: true,
      formatter: (datum: any) => ({
        name: datum.model,
        value: formatValue(datum.value, metric.includes('Ratio') || metric.includes('Return') ? 'percent' : 'number'),
      }),
    },
    interactions: [
      { type: 'crosshair' },
      { type: 'element-active' },
    ],
    animation: {
      appear: {
        duration: 800,
        easing: 'easeQuadOut',
      },
    },
  }
}

// 投票分布图配置
export function getVoteChartConfig(data: any[]) {
  return {
    data,
    xField: 'decision',
    yField: 'count',
    colorField: 'color',
    label: {
      position: 'middle',
      style: {
        fill: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
      },
      formatter: (datum: any) => `${datum.count}票 (${datum.percentage.toFixed(1)}%)`,
    },
    tooltip: {
      showTitle: false,
      formatter: (datum: any) => ({
        name: datum.decision,
        value: `${datum.count}票 (${datum.percentage.toFixed(1)}%)`,
      }),
    },
    interactions: [
      { type: 'element-active' },
    ],
    animation: {
      appear: {
        duration: 600,
        easing: 'easeQuadOut',
      },
    },
  }
}

// 价格走势图配置
export function getPriceChartConfig(data: any[], chartType: 'line' | 'candlestick' = 'line') {
  if (chartType === 'candlestick') {
    return {
      data,
      xField: 'date',
      yField: ['open', 'close', 'low', 'high'],
      tooltip: {
        showTitle: true,
        formatter: (datum: any) => ({
          name: '价格',
          value: `开: ${formatValue(datum.open, 'currency')}, 收: ${formatValue(datum.close, 'currency')}, 高: ${formatValue(datum.high, 'currency')}, 低: ${formatValue(datum.low, 'currency')}`,
        }),
      },
      interactions: [
        { type: 'crosshair' },
      ],
      animation: {
        appear: {
          duration: 800,
          easing: 'easeQuadOut',
        },
      },
    }
  }

  return {
    data,
    xField: 'date',
    yField: 'value',
    color: 'var(--color-primary-500)',
    smooth: true,
    tooltip: {
      showTitle: true,
      formatter: (datum: any) => ({
        name: '收盘价',
        value: formatValue(datum.value, 'currency'),
      }),
    },
    interactions: [
      { type: 'crosshair' },
      { type: 'element-active' },
    ],
    animation: {
      appear: {
        duration: 800,
        easing: 'easeQuadOut',
      },
    },
  }
}

// 通用图表配置
export const commonChartConfig = {
  // 响应式配置
  responsive: true,
  
  // 主题配置
  theme: 'classic',
  
  // 通用交互配置
  interactions: [
    { type: 'element-active' },
    { type: 'legend-highlight' },
  ],
  
  // 通用图例配置
  legend: {
    position: 'top' as const,
    layout: 'horizontal' as const,
    itemName: {
      style: {
        fontSize: 11,
        fill: 'var(--color-gray-600)',
      },
    },
  },
  
  // 通用工具提示配置
  tooltip: {
    showTitle: true,
    showMarkers: true,
    shared: true,
  },
}

// 图表加载状态配置
export const loadingConfig = {
  loading: true,
  loadingTemplate: () => `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--color-gray-400);
      font-size: 14px;
    ">
      <div style="
        animation: spin 1s linear infinite;
        border: 2px solid var(--color-gray-200);
        border-top: 2px solid var(--color-primary-500);
        border-radius: 50%;
        width: 20px;
        height: 20px;
        margin-right: 8px;
      "></div>
      加载中...
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `,
}

// 图表错误状态配置
export const errorConfig = {
  errorTemplate: (error: Error) => `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--color-red-500);
      font-size: 14px;
      text-align: center;
      padding: 20px;
    ">
      <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
      <div style="font-weight: 600; margin-bottom: 4px;">图表加载失败</div>
      <div style="font-size: 12px; color: var(--color-gray-500);">${error.message}</div>
    </div>
  `,
}