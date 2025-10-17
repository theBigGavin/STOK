// API 基础类型定义
export interface ApiResponse<T = any> {
  data: T
  message: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  skip: number
  limit: number
  has_more?: boolean
}

// 股票数据相关类型
export interface Stock {
  id: number
  symbol: string
  name: string
  market: string
  industry?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StockDailyData {
  id: number
  stock_id: number
  trade_date: string
  open_price: number
  high_price: number
  low_price: number
  close_price: number
  volume: number
  turnover?: number
  created_at: string
  updated_at: string
}

export interface StockDataResponse {
  symbol: string
  data: StockDailyData[]
  metadata: {
    start_date: string
    end_date: string
    record_count: number
    total_count: number
    skip: number
    limit: number
    has_more: boolean
  }
}

export interface StockRefreshResponse {
  symbol: string
  updated_records: number
  status: 'completed' | 'no_new_data'
}

// 模型管理相关类型
export interface BacktestModel {
  id: number
  name: string
  description?: string
  model_type: string
  parameters?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
  performance_metrics?: ModelPerformanceMetrics
  performance_history?: ModelPerformance[]
}

export interface ModelPerformance {
  id: number
  model_id: number
  backtest_date: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  total_return: number
  sharpe_ratio: number
  max_drawdown: number
  created_at: string
}

export interface ModelPerformanceMetrics {
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  total_return: number
  sharpe_ratio: number
  max_drawdown: number
  win_rate?: number
  profit_factor?: number
  total_trades?: number
  winning_trades?: number
  losing_trades?: number
  avg_profit_per_trade?: number
  avg_loss_per_trade?: number
}

export interface BacktestModelCreate {
  name: string
  description?: string
  model_type: string
  parameters?: Record<string, any>
}

export interface BacktestModelUpdate {
  name?: string
  description?: string
  model_type?: string
  parameters?: Record<string, any>
  is_active?: boolean
}

// 模型统计类型
export interface ModelStats {
  total: number
  active: number
  by_type: Record<string, number>
  avg_accuracy: number
  avg_return: number
  avg_sharpe: number
}

// 模型排名类型
export interface ModelRanking {
  model: BacktestModel
  performance: number
  rank: number
  metric: string
}

// 模型比较类型
export interface ModelComparison {
  model_id: number
  model_name: string
  metrics: ModelPerformanceMetrics
  rank: number
}

// 模型参数验证类型
export interface ModelParameterValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 模型训练配置类型
export interface ModelTrainingConfig {
  validation_split: number
  epochs?: number
  batch_size?: number
  learning_rate?: number
  early_stopping?: boolean
  save_best_only?: boolean
}

// 模型导出配置类型
export interface ModelExportConfig {
  format: 'json' | 'csv' | 'excel'
  include_parameters: boolean
  include_performance: boolean
  include_history: boolean
  start_date?: string
  end_date?: string
}

// 决策引擎相关类型
export interface DecisionRequest {
  symbol: string
  trade_date: string
  current_position?: number
}

export interface BatchDecisionRequest {
  symbols: string[]
  trade_date: string
}

export interface ModelDecision {
  model_id: number
  model_name: string
  decision: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  signal_strength: number
  reasoning?: string
}

export interface FinalDecision {
  decision: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  vote_summary: {
    BUY: number
    SELL: number
    HOLD: number
  }
  model_details: ModelDecision[]
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  reasoning?: string
}

export interface RiskAssessment {
  is_approved: boolean
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  warnings: string[]
  adjusted_decision: 'BUY' | 'SELL' | 'HOLD'
  position_suggestion: number
}

export interface DecisionResponse {
  symbol: string
  trade_date: string
  final_decision: FinalDecision
  risk_assessment: RiskAssessment
  timestamp: string
}

export interface BatchDecisionResponse {
  batch_results: DecisionResponse[]
  total_count: number
  success_count: number
  timestamp: string
}

export interface DecisionHistoryItem {
  trade_date: string
  final_decision: string
  confidence_score: number
  vote_summary: {
    BUY: number
    SELL: number
    HOLD: number
  }
}

export interface DecisionHistoryResponse {
  symbol: string
  history: DecisionHistoryItem[]
  metadata: {
    start_date: string
    end_date: string
    record_count: number
  }
}

// 回测分析相关类型
export interface BacktestRequest {
  symbol: string
  start_date: string
  end_date: string
  initial_capital: number
  model_ids?: number[]
}

export interface PortfolioBacktestRequest {
  symbols: string[]
  start_date: string
  end_date: string
  initial_capital: number
  rebalance_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
}

export interface TradeRecord {
  type: 'BUY' | 'SELL'
  date: string
  price: number
  shares: number
  value: number
  profit?: number
  reason?: string
  symbol?: string
}

export interface SignalRecord {
  date: string
  decision: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  signal_strength: number
  reasoning?: string
}

export interface EquityCurvePoint {
  date: string
  value: number
}

export interface BacktestResult {
  total_return: number
  annual_return: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  win_rate: number
  profit_factor: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  avg_profit_per_trade: number
  avg_loss_per_trade: number
  trades: TradeRecord[]
  equity_curve: EquityCurvePoint[]
  signals: SignalRecord[]
}

export interface ModelBacktestResponse {
  symbol: string
  backtest_result: BacktestResult
  parameters: {
    symbol: string
    start_date: string
    end_date: string
    initial_capital: number
    model_ids?: number[]
  }
}

export interface PortfolioBacktestResponse {
  portfolio_result: {
    total_return: number
    annual_return: number
    volatility: number
    sharpe_ratio: number
    max_drawdown: number
    win_rate: number
    profit_factor: number
    portfolio_weights: Record<string, number>
    individual_returns: Record<string, number>
    correlation_matrix: Record<string, Record<string, number>>
    rebalance_dates: string[]
    equity_curve: EquityCurvePoint[]
  }
  parameters: {
    symbols: string[]
    start_date: string
    end_date: string
    initial_capital: number
    rebalance_frequency: string
  }
}

export interface BacktestComparisonItem {
  symbol: string
  model_id: number
  results?: {
    total_return: number
    annual_return: number
    volatility: number
    sharpe_ratio: number
    max_drawdown: number
    win_rate: number
  }
  error?: string
}

export interface BacktestComparisonResponse {
  comparison: BacktestComparisonItem[]
  summary: {
    best_performer: string | null
    worst_performer: string | null
    avg_return: number
    avg_sharpe: number
  }
}

export interface BacktestResultDetail {
  id: number
  model_id: number
  model_name: string
  backtest_date: string
  results: {
    total_return: number
    annual_return: number
    volatility: number
    sharpe_ratio: number
    max_drawdown: number
    win_rate: number
    profit_factor: number
    total_trades: number
    winning_trades: number
    losing_trades: number
  }
  trades: TradeRecord[]
  created_at: string
}

// API 请求参数类型
export interface StockListParams {
  skip?: number
  limit?: number
  active_only?: boolean
  market?: string
}

export interface StockDataParams {
  start_date: string
  end_date: string
  include_features?: boolean
  skip?: number
  limit?: number
}

export interface ModelListParams {
  skip?: number
  limit?: number
  active_only?: boolean
  model_type?: string
}

export interface DecisionListParams {
  symbol?: string
  start_date?: string
  end_date?: string
  decision_type?: string
  skip?: number
  limit?: number
}

export interface BacktestResultsParams {
  model_id?: number
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}