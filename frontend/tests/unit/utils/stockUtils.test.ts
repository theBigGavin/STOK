import { describe, it, expect } from 'vitest'
import {
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
} from '@/utils/stockUtils'
import type { StockDailyData } from '@/types/api'

describe('股票工具函数', () => {
  describe('价格格式化', () => {
    it('应该正确格式化价格', () => {
      expect(formatPrice(123.456)).toBe('123.46')
      expect(formatPrice(123.456, 0)).toBe('123')
      expect(formatPrice(123.456, 4)).toBe('123.4560')
    })

    it('应该处理边界情况', () => {
      expect(formatPrice(0)).toBe('0.00')
      expect(formatPrice(-123.456)).toBe('-123.46')
    })
  })

  describe('涨跌幅格式化', () => {
    it('应该正确格式化涨跌幅', () => {
      expect(formatChange(5.678)).toBe('+5.68%')
      expect(formatChange(-3.456)).toBe('-3.46%')
      expect(formatChange(0)).toBe('+0.00%')
    })

    it('应该支持自定义小数位数', () => {
      expect(formatChange(5.678, 1)).toBe('+5.7%')
      expect(formatChange(-3.456, 0)).toBe('-3%')
    })
  })

  describe('涨跌幅计算', () => {
    it('应该正确计算涨跌幅', () => {
      expect(calculateChange(110, 100)).toBe(10)
      expect(calculateChange(90, 100)).toBe(-10)
      expect(calculateChange(100, 100)).toBe(0)
    })

    it('应该处理除零情况', () => {
      expect(calculateChange(100, 0)).toBe(0)
    })
  })

  describe('成交量格式化', () => {
    it('应该正确格式化成交量', () => {
      expect(formatVolume(1234567890)).toBe('1.23B')
      expect(formatVolume(1234567)).toBe('1.23M')
      expect(formatVolume(1234)).toBe('1.23K')
      expect(formatVolume(123)).toBe('123')
    })
  })

  describe('日期格式化', () => {
    const testDate = new Date('2023-01-15T10:30:00Z')

    it('应该正确格式化短日期', () => {
      expect(formatDate(testDate, 'short')).toBe('2023/1/15')
    })

    it('应该正确格式化长日期', () => {
      expect(formatDate(testDate, 'long')).toContain('2023/1/15')
    })

    it('应该正确格式化时间', () => {
      expect(formatDate(testDate, 'time')).toMatch(/\d{2}:\d{2}/)
    })

    it('应该处理字符串日期', () => {
      expect(formatDate('2023-01-15', 'short')).toBe('2023/1/15')
    })
  })

  describe('样式类名获取', () => {
    it('应该返回正确的涨跌幅颜色类名', () => {
      expect(getChangeColorClass(5)).toBe('text-success')
      expect(getChangeColorClass(-5)).toBe('text-danger')
      expect(getChangeColorClass(0)).toBe('text-muted')
    })

    it('应该返回正确的涨跌幅标签类型', () => {
      expect(getChangeTagType(5)).toBe('success')
      expect(getChangeTagType(-5)).toBe('danger')
      expect(getChangeTagType(0)).toBe('info')
    })

    it('应该返回正确的信号类型', () => {
      expect(getSignalType('BUY')).toBe('success')
      expect(getSignalType('SELL')).toBe('danger')
      expect(getSignalType('HOLD')).toBe('warning')
      expect(getSignalType('UNKNOWN')).toBe('info')
    })

    it('应该返回正确的信号文本', () => {
      expect(getSignalText('BUY')).toBe('买入')
      expect(getSignalText('SELL')).toBe('卖出')
      expect(getSignalText('HOLD')).toBe('持有')
      expect(getSignalText('UNKNOWN')).toBe('UNKNOWN')
    })

    it('应该返回正确的置信度状态', () => {
      expect(getConfidenceStatus(90)).toBe('success')
      expect(getConfidenceStatus(70)).toBe('warning')
      expect(getConfidenceStatus(50)).toBe('exception')
    })
  })

  describe('技术指标计算', () => {
    const mockData: StockDailyData[] = [
      { id: 1, stock_id: 1, trade_date: '2023-01-01', open_price: 100, high_price: 105, low_price: 95, close_price: 102, volume: 1000, created_at: '', updated_at: '' },
      { id: 2, stock_id: 1, trade_date: '2023-01-02', open_price: 102, high_price: 108, low_price: 100, close_price: 105, volume: 1200, created_at: '', updated_at: '' },
      { id: 3, stock_id: 1, trade_date: '2023-01-03', open_price: 105, high_price: 110, low_price: 103, close_price: 108, volume: 1500, created_at: '', updated_at: '' },
      { id: 4, stock_id: 1, trade_date: '2023-01-04', open_price: 108, high_price: 112, low_price: 106, close_price: 110, volume: 1300, created_at: '', updated_at: '' },
      { id: 5, stock_id: 1, trade_date: '2023-01-05', open_price: 110, high_price: 115, low_price: 108, close_price: 112, volume: 1400, created_at: '', updated_at: '' },
    ]

    it('应该正确计算移动平均线', () => {
      const ma = calculateMA(mockData, 3)
      expect(ma).toHaveLength(5)
      expect(ma[0]).toBeNaN()
      expect(ma[1]).toBeNaN()
      expect(ma[2]).toBeCloseTo(105)
      expect(ma[3]).toBeCloseTo(107.67)
      expect(ma[4]).toBeCloseTo(110)
    })

    it('应该正确计算RSI', () => {
      const rsi = calculateRSI(mockData, 2)
      expect(rsi).toHaveLength(5)
      expect(rsi[0]).toBeNaN()
      expect(rsi[1]).toBeNaN()
      expect(rsi[2]).toBeCloseTo(100)
      expect(rsi[3]).toBeCloseTo(100)
      expect(rsi[4]).toBeCloseTo(100)
    })

    it('应该正确计算布林带', () => {
      const bb = calculateBollingerBands(mockData, 3)
      expect(bb.middleBand).toHaveLength(5)
      expect(bb.upperBand).toHaveLength(5)
      expect(bb.lowerBand).toHaveLength(5)
      expect(bb.middleBand[2]).toBeCloseTo(105)
    })

    it('应该正确计算MACD', () => {
      const macd = calculateMACD(mockData)
      expect(macd.dif).toHaveLength(5)
      expect(macd.dea).toHaveLength(5)
      expect(macd.macd).toHaveLength(5)
    })

    it('应该正确计算EMA', () => {
      const ema = calculateEMA(mockData, 3)
      expect(ema).toHaveLength(5)
      expect(ema[0]).toBeNaN()
      expect(ema[1]).toBeNaN()
      expect(ema[2]).toBeCloseTo(105)
    })
  })

  describe('数据过滤', () => {
    const mockData: StockDailyData[] = [
      { id: 1, stock_id: 1, trade_date: '2023-01-01', open_price: 100, high_price: 105, low_price: 95, close_price: 102, volume: 1000, created_at: '', updated_at: '' },
      { id: 2, stock_id: 1, trade_date: '2023-01-02', open_price: 0, high_price: 0, low_price: 0, close_price: 0, volume: 0, created_at: '', updated_at: '' }, // 无效数据
      { id: 3, stock_id: 1, trade_date: '2023-01-03', open_price: 105, high_price: 110, low_price: 103, close_price: 108, volume: 1500, created_at: '', updated_at: '' },
    ]

    it('应该过滤无效数据', () => {
      const filtered = filterValidData(mockData)
      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe(1)
      expect(filtered[1].id).toBe(3)
    })

    it('应该按日期范围过滤数据', () => {
      const filtered = filterDataByDateRange(mockData, '2023-01-02', '2023-01-03')
      expect(filtered).toHaveLength(2)
      expect(filtered[0].trade_date).toBe('2023-01-02')
      expect(filtered[1].trade_date).toBe('2023-01-03')
    })
  })

  describe('数据统计', () => {
    const mockData: StockDailyData[] = [
      { id: 1, stock_id: 1, trade_date: '2023-01-01', open_price: 100, high_price: 105, low_price: 95, close_price: 100, volume: 1000, created_at: '', updated_at: '' },
      { id: 2, stock_id: 1, trade_date: '2023-01-02', open_price: 102, high_price: 108, low_price: 100, close_price: 105, volume: 1200, created_at: '', updated_at: '' },
      { id: 3, stock_id: 1, trade_date: '2023-01-03', open_price: 105, high_price: 110, low_price: 103, close_price: 108, volume: 1500, created_at: '', updated_at: '' },
    ]

    it('应该获取最新价格数据', () => {
      const latest = getLatestPriceData(mockData)
      expect(latest?.trade_date).toBe('2023-01-03')
      expect(latest?.close_price).toBe(108)
    })

    it('应该计算价格统计数据', () => {
      const stats = calculatePriceStats(mockData)
      expect(stats.min).toBe(100)
      expect(stats.max).toBe(108)
      expect(stats.avg).toBeCloseTo(104.33)
      expect(stats.volatility).toBeGreaterThan(0)
    })

    it('应该处理空数据', () => {
      const stats = calculatePriceStats([])
      expect(stats.min).toBe(0)
      expect(stats.max).toBe(0)
      expect(stats.avg).toBe(0)
      expect(stats.volatility).toBe(0)
    })
  })

  describe('图表数据生成', () => {
    const mockData: StockDailyData[] = [
      { id: 1, stock_id: 1, trade_date: '2023-01-01', open_price: 100, high_price: 105, low_price: 95, close_price: 102, volume: 1000, created_at: '', updated_at: '' },
    ]

    it('应该正确生成图表数据', () => {
      const chartData = generateChartData(mockData)
      expect(chartData).toHaveLength(1)
      expect(chartData[0]).toEqual({
        date: '2023-01-01',
        open: 100,
        high: 105,
        low: 95,
        close: 102,
        volume: 1000
      })
    })
  })

  describe('股票代码验证', () => {
    it('应该验证有效的股票代码', () => {
      expect(validateSymbol('AAPL')).toBe(true)
      expect(validateSymbol('GOOGL')).toBe(true)
      expect(validateSymbol('MSFT')).toBe(true)
    })

    it('应该拒绝无效的股票代码', () => {
      expect(validateSymbol('')).toBe(false)
      expect(validateSymbol('123')).toBe(false)
      expect(validateSymbol('TOOLONGCODE')).toBe(false)
      expect(validateSymbol('abc')).toBe(false)
    })
  })

  describe('搜索建议生成', () => {
    const mockStocks = [
      { id: 1, symbol: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ', is_active: true, created_at: '', updated_at: '' },
      { id: 2, symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'NASDAQ', is_active: true, created_at: '', updated_at: '' },
      { id: 3, symbol: 'MSFT', name: 'Microsoft Corporation', market: 'NASDAQ', is_active: true, created_at: '', updated_at: '' },
    ]

    it('应该根据股票代码生成搜索建议', () => {
      const suggestions = generateSearchSuggestions(mockStocks, 'AAPL', 5)
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].value).toBe('AAPL')
      expect(suggestions[0].label).toBe('AAPL - Apple Inc.')
    })

    it('应该根据股票名称生成搜索建议', () => {
      const suggestions = generateSearchSuggestions(mockStocks, 'Apple', 5)
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].value).toBe('AAPL')
    })

    it('应该限制返回结果数量', () => {
      const suggestions = generateSearchSuggestions(mockStocks, 'A', 2)
      expect(suggestions).toHaveLength(2)
    })

    it('应该处理空查询', () => {
      const suggestions = generateSearchSuggestions(mockStocks, '', 5)
      expect(suggestions).toHaveLength(0)
    })
  })
})