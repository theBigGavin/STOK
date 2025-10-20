/**
 * 回测相关类型定义
 */

export const TradeType = {
  BUY: 'BUY',
  SELL: 'SELL'
} as const;

export type TradeType = typeof TradeType[keyof typeof TradeType];

export const SignalType = {
  BUY: 'BUY',
  SELL: 'SELL',
  HOLD: 'HOLD'
} as const;

export type SignalType = typeof SignalType[keyof typeof SignalType];

export const StrategyType = {
  TECHNICAL: 'technical',
  FUNDAMENTAL: 'fundamental',
  MACHINE_LEARNING: 'machine_learning',
  HYBRID: 'hybrid'
} as const;

export type StrategyType = typeof StrategyType[keyof typeof StrategyType];

export interface BacktestResult {
  totalReturn: number;
  annualReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
  trades: Trade[];
  equityCurve: EquityPoint[];
  signals: Signal[];
}

export interface Trade {
  type: TradeType;
  date: string;
  price: number;
  shares: number;
  value: number;
  profit?: number;
  reason: string;
  symbol: string;
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface Signal {
  date: string;
  signal: SignalType;
  price: number;
  model: string;
  confidence: number;
}

// 回测请求类型
export interface BacktestRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  modelIds?: string[]; // 修复类型不一致问题
  strategy?: StrategyType;
  parameters?: Record<string, unknown>;
}

export interface EquityCurve {
  name: string;
  data: EquityPoint[];
  color: string;
}

// 回测配置
export interface BacktestConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  selectedModels: string[];
  strategy: StrategyType;
  parameters: Record<string, unknown>;
}

// 回测性能指标
export interface PerformanceMetrics {
  totalReturn: number;
  annualReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
}
