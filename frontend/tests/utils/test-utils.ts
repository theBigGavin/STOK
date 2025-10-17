import type { ComponentPublicInstance } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import type { Stock, StockDailyData, BacktestModel, DecisionResponse } from '@/types/api'

/**
 * 测试工具函数
 */

// 创建模拟股票数据
export const createMockStock = (overrides?: Partial<Stock>): Stock => ({
  id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  market: 'NASDAQ',
  industry: 'Technology',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides
})

// 创建模拟股票日线数据
export const createMockStockDailyData = (overrides?: Partial<StockDailyData>): StockDailyData => ({
  id: 1,
  stock_id: 1,
  trade_date: '2023-01-01',
  open_price: 150.00,
  high_price: 155.00,
  low_price: 149.50,
  close_price: 152.50,
  volume: 1000000,
  turnover: 152500000,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides
})

// 创建模拟股票数据数组
export const createMockStockDataArray = (count: number = 10): StockDailyData[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockStockDailyData({
      id: index + 1,
      trade_date: `2023-01-${String(index + 1).padStart(2, '0')}`,
      close_price: 150 + Math.random() * 10,
      volume: 1000000 + Math.floor(Math.random() * 1000000)
    })
  )
}

// 创建模拟回测模型
export const createMockBacktestModel = (overrides?: Partial<BacktestModel>): BacktestModel => ({
  id: 1,
  name: 'Technical Model',
  description: '基于技术指标的模型',
  model_type: 'technical',
  parameters: { period: 14 },
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  performance_metrics: {
    accuracy: 0.75,
    precision: 0.72,
    recall: 0.78,
    f1_score: 0.75,
    total_return: 0.15,
    sharpe_ratio: 1.2,
    max_drawdown: -0.08
  },
  ...overrides
})

// 创建模拟决策响应
export const createMockDecisionResponse = (overrides?: Partial<DecisionResponse>): DecisionResponse => ({
  symbol: 'AAPL',
  trade_date: '2023-01-01',
  final_decision: {
    decision: 'BUY',
    confidence: 0.85,
    vote_summary: {
      BUY: 3,
      SELL: 1,
      HOLD: 1
    },
    model_details: [
      {
        model_id: 1,
        model_name: 'Model 1',
        decision: 'BUY',
        confidence: 0.9,
        signal_strength: 0.8
      }
    ],
    risk_level: 'MEDIUM',
    reasoning: '技术指标显示买入信号'
  },
  risk_assessment: {
    is_approved: true,
    risk_level: 'MEDIUM',
    warnings: [],
    adjusted_decision: 'BUY',
    position_suggestion: 1000
  },
  timestamp: '2023-01-01T10:00:00Z',
  ...overrides
})

// 模拟 API 响应
export const createMockApiResponse = <T>(data: T, message: string = 'success', status: 'success' | 'error' = 'success') => ({
  data,
  message,
  status
})

// 模拟分页响应
export const createMockPaginatedResponse = <T>(data: T[], total: number = 100, skip: number = 0, limit: number = 20) => ({
  data,
  total,
  skip,
  limit,
  has_more: skip + limit < total
})

// 等待异步操作完成
export const waitForAsync = (ms: number = 0): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 模拟用户交互
export const simulateUserInteraction = async (wrapper: VueWrapper<ComponentPublicInstance>, action: () => void) => {
  action()
  await wrapper.vm.$nextTick()
  await waitForAsync(10)
}

// 模拟 API 错误
export const createMockApiError = (message: string = 'API Error', status: number = 500) => {
  const error = new Error(message)
  ;(error as any).response = {
    status,
    data: { message }
  }
  return error
}

// 验证组件 props
export const validateComponentProps = (wrapper: VueWrapper<ComponentPublicInstance>, expectedProps: Record<string, any>) => {
  Object.entries(expectedProps).forEach(([key, value]) => {
    expect(wrapper.props(key)).toEqual(value)
  })
}

// 验证组件 emits
export const validateComponentEmits = (wrapper: VueWrapper<ComponentPublicInstance>, eventName: string, expectedPayload?: any) => {
  const emittedEvents = wrapper.emitted(eventName)
  expect(emittedEvents).toBeDefined()
  expect(emittedEvents?.length).toBeGreaterThan(0)
  
  if (expectedPayload !== undefined) {
    expect(emittedEvents?.[0]).toEqual([expectedPayload])
  }
}

// 测试数据工厂
export const TestDataFactory = {
  stocks: {
    create: createMockStock,
    createArray: (count: number) => Array.from({ length: count }, (_, i) => createMockStock({ id: i + 1, symbol: `STOCK${i + 1}` }))
  },
  
  stockData: {
    create: createMockStockDailyData,
    createArray: createMockStockDataArray
  },
  
  models: {
    create: createMockBacktestModel,
    createArray: (count: number) => Array.from({ length: count }, (_, i) => 
      createMockBacktestModel({ id: i + 1, name: `Model ${i + 1}` })
    )
  },
  
  decisions: {
    create: createMockDecisionResponse,
    createArray: (count: number) => Array.from({ length: count }, (_, i) => 
      createMockDecisionResponse({ symbol: `STOCK${i + 1}` })
    )
  }
}

export default {
  createMockStock,
  createMockStockDailyData,
  createMockStockDataArray,
  createMockBacktestModel,
  createMockDecisionResponse,
  createMockApiResponse,
  createMockPaginatedResponse,
  waitForAsync,
  simulateUserInteraction,
  createMockApiError,
  validateComponentProps,
  validateComponentEmits,
  TestDataFactory
}