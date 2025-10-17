import type { StockDailyData } from '@/types/api'

// 股票相关工具函数和类型定义

/**
 * 股票价格格式化
 */
export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals)
}

/**
 * 涨跌幅格式化
 */
export const formatChange = (change: number, decimals: number = 2): string => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(decimals)}%`
}

/**
 * 涨跌幅计算
 */
export const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * 成交量格式化
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(2)}B`
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`
  }
  return volume.toString()
}

/**
 * 日期格式化
 */
export const formatDate = (date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('zh-CN')
  } else if (format === 'long') {
    return dateObj.toLocaleString('zh-CN')
  } else {
    return dateObj.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

/**
 * 获取涨跌幅颜色类名
 */
export const getChangeColorClass = (change: number): string => {
  if (change > 0) return 'text-success'
  if (change < 0) return 'text-danger'
  return 'text-muted'
}

/**
 * 获取涨跌幅标签类型
 */
export const getChangeTagType = (change: number): 'success' | 'danger' | 'info' => {
  if (change > 0) return 'success'
  if (change < 0) return 'danger'
  return 'info'
}

/**
 * 获取信号类型
 */
export const getSignalType = (signal: string): 'success' | 'danger' | 'warning' | 'info' => {
  const types: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    BUY: 'success',
    SELL: 'danger',
    HOLD: 'warning'
  }
  return types[signal] || 'info'
}

/**
 * 获取信号文本
 */
export const getSignalText = (signal: string): string => {
  const texts: Record<string, string> = {
    BUY: '买入',
    SELL: '卖出',
    HOLD: '持有'
  }
  return texts[signal] || signal
}

/**
 * 获取置信度状态
 */
export const getConfidenceStatus = (confidence: number): 'success' | 'warning' | 'exception' => {
  if (confidence >= 80) return 'success'
  if (confidence >= 60) return 'warning'
  return 'exception'
}

/**
 * 计算移动平均线
 */
export const calculateMA = (data: StockDailyData[], period: number): number[] => {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
    } else {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close_price
      }
      result.push(sum / period)
    }
  }
  return result
}

/**
 * 计算相对强弱指数 (RSI)
 */
export const calculateRSI = (data: StockDailyData[], period: number = 14): number[] => {
  const gains: number[] = []
  const losses: number[] = []
  
  // 计算价格变化
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close_price - data[i - 1].close_price
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  const result: number[] = new Array(data.length).fill(NaN)
  
  for (let i = period; i < data.length; i++) {
    const avgGain = gains.slice(i - period, i).reduce((sum, gain) => sum + gain, 0) / period
    const avgLoss = losses.slice(i - period, i).reduce((sum, loss) => sum + loss, 0) / period
    
    if (avgLoss === 0) {
      result[i] = 100
    } else {
      const rs = avgGain / avgLoss
      result[i] = 100 - (100 / (1 + rs))
    }
  }
  
  return result
}

/**
 * 计算布林带
 */
export const calculateBollingerBands = (data: StockDailyData[], period: number = 20, multiplier: number = 2) => {
  const middleBand: number[] = calculateMA(data, period)
  const upperBand: number[] = []
  const lowerBand: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upperBand.push(NaN)
      lowerBand.push(NaN)
    } else {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += Math.pow(data[i - j].close_price - middleBand[i], 2)
      }
      const std = Math.sqrt(sum / period)
      upperBand.push(middleBand[i] + multiplier * std)
      lowerBand.push(middleBand[i] - multiplier * std)
    }
  }
  
  return { middleBand, upperBand, lowerBand }
}

/**
 * 计算 MACD
 */
export const calculateMACD = (data: StockDailyData[]) => {
  const ema12 = calculateEMA(data, 12)
  const ema26 = calculateEMA(data, 26)
  const dif: number[] = []
  const dea: number[] = []
  const macd: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    dif.push(ema12[i] - ema26[i])
  }
  
  const deaData = calculateEMAFromArray(dif, 9)
  for (let i = 0; i < data.length; i++) {
    dea.push(deaData[i])
    macd.push((dif[i] - deaData[i]) * 2)
  }
  
  return { dif, dea, macd }
}

/**
 * 计算指数移动平均线 (EMA)
 */
export const calculateEMA = (data: StockDailyData[], period: number): number[] => {
  const result: number[] = []
  const multiplier = 2 / (period + 1)
  
  // 第一个 EMA 是简单移动平均
  let ema = data.slice(0, period).reduce((sum, item) => sum + item.close_price, 0) / period
  result.push(...new Array(period - 1).fill(NaN))
  result.push(ema)
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close_price - ema) * multiplier + ema
    result.push(ema)
  }
  
  return result
}

/**
 * 从数组计算 EMA
 */
export const calculateEMAFromArray = (data: number[], period: number): number[] => {
  const result: number[] = []
  const multiplier = 2 / (period + 1)
  
  // 第一个 EMA 是简单移动平均
  let ema = data.slice(0, period).reduce((sum, value) => sum + value, 0) / period
  result.push(...new Array(period - 1).fill(NaN))
  result.push(ema)
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema
    result.push(ema)
  }
  
  return result
}

/**
 * 过滤有效数据点
 */
export const filterValidData = (data: StockDailyData[]): StockDailyData[] => {
  return data.filter(item => 
    item.open_price > 0 && 
    item.high_price > 0 && 
    item.low_price > 0 && 
    item.close_price > 0 &&
    item.volume > 0
  )
}

/**
 * 按日期范围过滤数据
 */
export const filterDataByDateRange = (
  data: StockDailyData[], 
  startDate: string, 
  endDate: string
): StockDailyData[] => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return data.filter(item => {
    const tradeDate = new Date(item.trade_date)
    return tradeDate >= start && tradeDate <= end
  })
}

/**
 * 获取最新价格数据
 */
export const getLatestPriceData = (data: StockDailyData[]): StockDailyData | null => {
  if (data.length === 0) return null
  
  return data.reduce((latest, current) => {
    const latestDate = new Date(latest.trade_date)
    const currentDate = new Date(current.trade_date)
    return currentDate > latestDate ? current : latest
  })
}

/**
 * 计算价格统计数据
 */
export const calculatePriceStats = (data: StockDailyData[]) => {
  if (data.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      volatility: 0
    }
  }
  
  const prices = data.map(item => item.close_price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length
  
  // 计算波动率 (标准差)
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length
  const volatility = Math.sqrt(variance)
  
  return { min, max, avg, volatility }
}

/**
 * 生成股票图表数据
 */
export const generateChartData = (data: StockDailyData[]) => {
  return data.map(item => ({
    date: item.trade_date,
    open: item.open_price,
    high: item.high_price,
    low: item.low_price,
    close: item.close_price,
    volume: item.volume
  }))
}

/**
 * 验证股票代码格式
 */
export const validateSymbol = (symbol: string): boolean => {
  // 简单的股票代码验证，可以根据需要扩展
  const symbolRegex = /^[A-Z]{1,6}$/
  return symbolRegex.test(symbol.toUpperCase())
}

/**
 * 生成股票搜索建议
 */
export const generateSearchSuggestions = (stocks: any[], query: string, limit: number = 10) => {
  if (!query.trim()) return []
  
  const lowerQuery = query.toLowerCase()
  return stocks
    .filter(stock => 
      stock.symbol.toLowerCase().includes(lowerQuery) ||
      stock.name.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit)
    .map(stock => ({
      value: stock.symbol,
      label: `${stock.symbol} - ${stock.name}`,
      stock
    }))
}

export default {
  formatPrice,
  formatChange,
  calculateChange,
  formatVolume,
  formatDate,
  getChangeColorClass,
  getChangeTagType,
  getSignalType,
  getSignalText,
  getConfidenceStatus,
  calculateMA,
  calculateRSI,
  calculateBollingerBands,
  calculateMACD,
  calculateEMA,
  filterValidData,
  filterDataByDateRange,
  getLatestPriceData,
  calculatePriceStats,
  generateChartData,
  validateSymbol,
  generateSearchSuggestions
}