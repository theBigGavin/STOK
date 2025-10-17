// 股票项类型定义
export interface StockItem {
  symbol: string
  name: string
  price: number
  change: number
  volume: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  timestamp: string
}

// 决策项类型定义
export interface DecisionItem {
  id: string
  symbol: string
  name: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  signalStrength: number
  models: string[]
  timestamp: string
  price: number
  targetPrice?: number
  stopLoss?: number
}

// 模型项类型定义
export interface ModelItem {
  id: string
  name: string
  type: string
  accuracy: number
  status: 'active' | 'inactive' | 'training'
  lastUpdated: string
  description?: string
  parameters?: Record<string, any>
}

// 回测结果类型定义
export interface BacktestResult {
  id: string
  name: string
  startDate: string
  endDate: string
  initialCapital: number
  finalCapital: number
  totalReturn: number
  annualReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  status: 'completed' | 'running' | 'failed'
  createdAt: string
}