// Ant Design Charts 主题配置
export const chartTheme = {
  // 颜色配置 - 与 UnoCSS 主题保持一致
  colors10: [
    'var(--color-primary-500)',
    'var(--color-emerald-500)',
    'var(--color-amber-500)',
    'var(--color-red-500)',
    'var(--color-purple-500)',
    'var(--color-cyan-500)',
    'var(--color-orange-500)',
    'var(--color-lime-500)',
    'var(--color-pink-500)',
    'var(--color-indigo-500)',
  ],
  
  // 决策颜色映射
  decisionColors: {
    BUY: 'var(--color-emerald-500)',
    SELL: 'var(--color-red-500)',
    HOLD: 'var(--color-amber-500)',
  },
  
  // 模型颜色映射
  modelColors: [
    'var(--color-primary-500)',
    'var(--color-emerald-500)',
    'var(--color-amber-500)',
    'var(--color-red-500)',
    'var(--color-purple-500)',
    'var(--color-cyan-500)',
  ],
  
  // 图表样式配置
  style: {
    // 字体配置
    fontFamily: 'Inter, system-ui, sans-serif',
    
    // 轴配置
    axis: {
      title: {
        style: {
          fontSize: 12,
          fill: 'var(--color-gray-600)',
        },
      },
      label: {
        style: {
          fontSize: 11,
          fill: 'var(--color-gray-500)',
        },
      },
      line: {
        style: {
          stroke: 'var(--color-gray-200)',
          lineWidth: 1,
        },
      },
      grid: {
        line: {
          style: {
            stroke: 'var(--color-gray-100)',
            lineWidth: 1,
            lineDash: [4, 4],
          },
        },
      },
    },
    
    // 图例配置
    legend: {
      title: {
        style: {
          fontSize: 12,
          fill: 'var(--color-gray-600)',
        },
      },
      itemName: {
        style: {
          fontSize: 11,
          fill: 'var(--color-gray-600)',
        },
      },
    },
    
    // 工具提示配置
    tooltip: {
      domStyles: {
        'g2-tooltip': {
          backgroundColor: 'var(--color-white)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '6px',
          border: '1px solid var(--color-gray-200)',
          fontSize: '12px',
          color: 'var(--color-gray-700)',
        },
        'g2-tooltip-title': {
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '4px',
          color: 'var(--color-gray-900)',
        },
        'g2-tooltip-list-item': {
          marginBottom: '2px',
        },
        'g2-tooltip-marker': {
          width: '8px',
          height: '8px',
          borderRadius: '50%',
        },
      },
    },
  },
  
  // 动画配置
  animations: {
    appear: {
      duration: 400,
      easing: 'easeQuadOut',
    },
    update: {
      duration: 300,
      easing: 'easeQuadOut',
    },
    enter: {
      duration: 300,
      easing: 'easeQuadOut',
    },
    leave: {
      duration: 200,
      easing: 'easeQuadIn',
    },
  },
}

// 通用图表配置
export const commonChartConfig = {
  // 通用工具提示配置
  tooltip: {
    showTitle: true,
    showMarkers: true,
    shared: true,
  },
  
  // 通用图例配置
  legend: {
    position: 'top' as const,
    layout: 'horizontal' as const,
    itemName: {
      formatter: (text: string) => text,
      style: {
        fontSize: 11,
        fill: 'var(--color-gray-600)',
      },
    },
  },
  
  // 通用交互配置
  interactions: [
    { type: 'element-active' },
    { type: 'legend-highlight' },
  ],
  
  // 响应式配置
  responsive: true,
  
  // 主题配置
  theme: chartTheme,
}

// 获取模型颜色
export function getModelColor(modelName: string): string {
  const colors = chartTheme.modelColors
  let hash = 0
  for (let i = 0; i < modelName.length; i++) {
    hash = modelName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length] || 'var(--color-primary-500)'
}

// 获取决策颜色
export function getDecisionColor(decision: string): string {
  return chartTheme.decisionColors[decision as keyof typeof chartTheme.decisionColors] || 'var(--color-gray-400)'
}

// 格式化数值
export function formatValue(value: number, type: 'percent' | 'currency' | 'number' = 'number'): string {
  switch (type) {
    case 'percent':
      return `${(value * 100).toFixed(2)}%`
    case 'currency':
      return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    default:
      return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
}

// 格式化日期
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}