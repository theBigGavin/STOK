import type {
  BacktestResult,
  BacktestResultDetail,
  TradeRecord,
  SignalRecord,
  EquityCurvePoint,
  BacktestComparisonItem
} from '@/types/api'

/**
 * 回测工具函数和类型定义
 */

// 回测性能指标类型
export interface BacktestMetrics {
  totalReturn: number
  annualReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  avgProfitPerTrade: number
  avgLossPerTrade: number
}

// 回测配置验证结果
export interface BacktestValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 回测比较结果
export interface BacktestComparisonData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    borderColor: string
  }[]
}

// 回测图表数据
export interface BacktestChartData {
  dates: string[]
  equity: number[]
  benchmark?: number[]
  drawdown?: number[]
  signals?: {
    date: string
    type: 'BUY' | 'SELL'
    price: number
  }[]
}

/**
 * 验证回测配置参数
 */
export const validateBacktestConfig = (config: {
  startDate: string
  endDate: string
  initialCapital: number
  models: string[]
  stocks: string[]
}): BacktestValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // 验证日期
  if (!config.startDate) {
    errors.push('开始日期不能为空')
  }
  if (!config.endDate) {
    errors.push('结束日期不能为空')
  }
  if (config.startDate && config.endDate) {
    const start = new Date(config.startDate)
    const end = new Date(config.endDate)
    if (start >= end) {
      errors.push('开始日期必须早于结束日期')
    }
    if (end.getTime() - start.getTime() < 7 * 24 * 60 * 60 * 1000) {
      warnings.push('回测时间过短，建议至少一周以上')
    }
  }

  // 验证资金
  if (config.initialCapital <= 0) {
    errors.push('初始资金必须大于0')
  }
  if (config.initialCapital < 1000) {
    warnings.push('初始资金较少，可能影响回测结果')
  }

  // 验证模型选择
  if (config.models.length === 0) {
    errors.push('至少选择一个模型')
  }

  // 验证股票选择
  if (config.stocks.length === 0) {
    errors.push('至少选择一支股票')
  }
  if (config.stocks.length > 10) {
    warnings.push('股票数量较多，回测时间可能较长')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 计算年化收益率
 */
export const calculateAnnualReturn = (
  totalReturn: number,
  startDate: string,
  endDate: string
): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const years = (end.getTime() - start.getTime()) / (365 * 24 * 60 * 60 * 1000)
  
  if (years <= 0) return 0
  
  return Math.pow(1 + totalReturn / 100, 1 / years) - 1
}

/**
 * 计算夏普比率
 */
export const calculateSharpeRatio = (
  returns: number[],
  riskFreeRate: number = 0.02
): number => {
  if (returns.length === 0) return 0
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const stdDev = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
  )
  
  if (stdDev === 0) return 0
  
  return (avgReturn - riskFreeRate) / stdDev
}

/**
 * 计算最大回撤
 */
export const calculateMaxDrawdown = (equityCurve: number[]): number => {
  if (equityCurve.length === 0) return 0
  
  let maxDrawdown = 0
  let peak = equityCurve[0]
  
  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i] > peak) {
      peak = equityCurve[i]
    } else {
      const drawdown = (peak - equityCurve[i]) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }
  }
  
  return maxDrawdown * 100 // 转换为百分比
}

/**
 * 计算胜率
 */
export const calculateWinRate = (trades: TradeRecord[]): number => {
  if (trades.length === 0) return 0
  
  const profitableTrades = trades.filter(trade => (trade.profit || 0) > 0).length
  return (profitableTrades / trades.length) * 100
}

/**
 * 计算利润因子
 */
export const calculateProfitFactor = (trades: TradeRecord[]): number => {
  const profits = trades.filter(trade => (trade.profit || 0) > 0)
  const losses = trades.filter(trade => (trade.profit || 0) < 0)
  
  const totalProfit = profits.reduce((sum, trade) => sum + (trade.profit || 0), 0)
  const totalLoss = Math.abs(losses.reduce((sum, trade) => sum + (trade.profit || 0), 0))
  
  if (totalLoss === 0) return totalProfit > 0 ? Infinity : 0
  
  return totalProfit / totalLoss
}

/**
 * 格式化货币金额
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * 格式化百分比
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/**
 * 格式化数字
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals)
}

/**
 * 获取收益率颜色类名
 */
export const getReturnColorClass = (returnRate: number): string => {
  if (returnRate > 0) return 'return-positive'
  if (returnRate < 0) return 'return-negative'
  return ''
}

/**
 * 获取回撤颜色类名
 */
export const getDrawdownColorClass = (drawdown: number): string => {
  if (drawdown > 10) return 'drawdown-high'
  if (drawdown > 5) return 'drawdown-medium'
  return 'drawdown-low'
}

/**
 * 生成回测图表数据
 */
export const generateChartData = (
  equityCurve: EquityCurvePoint[],
  signals?: SignalRecord[],
  benchmark?: EquityCurvePoint[]
): BacktestChartData => {
  const dates = equityCurve.map(point => point.date)
  const equity = equityCurve.map(point => point.value)
  
  const chartData: BacktestChartData = {
    dates,
    equity
  }
  
  // 添加基准数据
  if (benchmark && benchmark.length > 0) {
    chartData.benchmark = benchmark.map(point => point.value)
  }
  
  // 添加回撤数据
  chartData.drawdown = calculateDrawdownSeries(equity)
  
  // 添加信号数据
  if (signals && signals.length > 0) {
    chartData.signals = signals
      .filter(signal => signal.decision !== 'HOLD')
      .map(signal => ({
        date: signal.date,
        type: signal.decision as 'BUY' | 'SELL',
        price: 0 // 这里需要根据实际数据计算价格
      }))
  }
  
  return chartData
}

/**
 * 计算回撤序列
 */
export const calculateDrawdownSeries = (equity: number[]): number[] => {
  const drawdowns: number[] = []
  let peak = equity[0]
  
  for (let i = 0; i < equity.length; i++) {
    if (equity[i] > peak) {
      peak = equity[i]
    }
    const drawdown = ((peak - equity[i]) / peak) * 100
    drawdowns.push(drawdown)
  }
  
  return drawdowns
}

/**
 * 生成比较图表数据
 */
export const generateComparisonData = (
  comparisonItems: BacktestComparisonItem[]
): BacktestComparisonData => {
  const labels = comparisonItems.map(item => item.symbol)
  
  return {
    labels,
    datasets: [
      {
        label: '总收益率',
        data: comparisonItems.map(item => item.results?.total_return || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)'
      },
      {
        label: '夏普比率',
        data: comparisonItems.map(item => item.results?.sharpe_ratio || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)'
      },
      {
        label: '最大回撤',
        data: comparisonItems.map(item => item.results?.max_drawdown || 0),
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        borderColor: 'rgba(255, 206, 86, 1)'
      }
    ]
  }
}

/**
 * 计算回测统计摘要
 */
export const calculateBacktestSummary = (results: BacktestResultDetail[]) => {
  if (results.length === 0) {
    return {
      totalBacktests: 0,
      avgReturn: 0,
      bestReturn: 0,
      worstReturn: 0,
      avgSharpe: 0,
      successRate: 0
    }
  }

  const returns = results.map(r => r.results.total_return)
  const sharpeRatios = results.map(r => r.results.sharpe_ratio)
  
  return {
    totalBacktests: results.length,
    avgReturn: returns.reduce((sum, ret) => sum + ret, 0) / returns.length,
    bestReturn: Math.max(...returns),
    worstReturn: Math.min(...returns),
    avgSharpe: sharpeRatios.reduce((sum, ratio) => sum + ratio, 0) / sharpeRatios.length,
    successRate: (returns.filter(ret => ret > 0).length / returns.length) * 100
  }
}

/**
 * 导出回测结果为 CSV
 */
export const exportToCSV = (result: BacktestResultDetail): string => {
  const headers = ['日期', '操作', '股票', '价格', '股数', '价值', '利润', '原因']
  const trades = result.trades.map(trade => [
    trade.date,
    trade.type,
    trade.symbol || '',
    trade.price.toString(),
    trade.shares.toString(),
    trade.value.toString(),
    (trade.profit || 0).toString(),
    trade.reason || ''
  ])
  
  const csvContent = [headers, ...trades]
    .map(row => row.join(','))
    .join('\n')
  
  return csvContent
}

/**
 * 导出回测结果为 JSON
 */
export const exportToJSON = (result: BacktestResultDetail): string => {
  return JSON.stringify({
    ...result,
    export_timestamp: new Date().toISOString(),
    export_version: '1.0'
  }, null, 2)
}

/**
 * 生成回测报告
 */
export const generateBacktestReport = (result: BacktestResultDetail): string => {
  const { results, trades, model_name, backtest_date } = result
  
  return `
# 回测分析报告

## 基本信息
- 模型名称: ${model_name}
- 回测日期: ${backtest_date}
- 生成时间: ${new Date().toLocaleString('zh-CN')}

## 性能指标
- 总收益率: ${formatPercentage(results.total_return)}
- 年化收益率: ${formatPercentage(results.annual_return)}
- 夏普比率: ${formatNumber(results.sharpe_ratio)}
- 最大回撤: ${formatPercentage(results.max_drawdown)}
- 胜率: ${formatPercentage(results.win_rate)}
- 利润因子: ${formatNumber(results.profit_factor)}

## 交易统计
- 总交易次数: ${results.total_trades}
- 盈利交易: ${results.winning_trades}
- 亏损交易: ${results.losing_trades}
- 平均盈利: ${formatCurrency(results.avg_profit_per_trade || 0)}
- 平均亏损: ${formatCurrency(results.avg_loss_per_trade || 0)}

## 风险分析
- 波动率: ${formatPercentage(results.volatility)}
- 最大回撤发生在回测期间
- 建议仓位管理策略

---
*报告生成于 STOK 回测系统*
  `.trim()
}

/**
 * 模拟回测进度
 */
export const simulateProgress = (
  callback: (progress: number, message: string) => void,
  duration: number = 3000
): Promise<void> => {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      
      if (progress < 25) {
        callback(progress, '初始化回测环境...')
      } else if (progress < 50) {
        callback(progress, '加载历史数据...')
      } else if (progress < 75) {
        callback(progress, '执行模型计算...')
      } else if (progress < 95) {
        callback(progress, '生成回测结果...')
      } else {
        callback(progress, '完成回测分析')
      }
      
      if (progress >= 100) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
  })
}

export default {
  validateBacktestConfig,
  calculateAnnualReturn,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateWinRate,
  calculateProfitFactor,
  formatCurrency,
  formatPercentage,
  formatNumber,
  getReturnColorClass,
  getDrawdownColorClass,
  generateChartData,
  generateComparisonData,
  calculateBacktestSummary,
  exportToCSV,
  exportToJSON,
  generateBacktestReport,
  simulateProgress
}