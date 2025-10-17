/**
 * 回测相关类型定义
 */

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
  type: "BUY" | "SELL";
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
  signal: "BUY" | "SELL" | "HOLD";
  price: number;
  model: string;
  confidence: number;
}