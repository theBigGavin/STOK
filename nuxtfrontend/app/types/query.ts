/**
 * 查询参数类型定义
 */

export interface StockQueryParams {
  skip?: number;
  limit?: number;
  activeOnly?: boolean;
  market?: string;
}

export interface DecisionQueryParams {
  symbol?: string;
  startDate?: string;
  endDate?: string;
  decisionType?: 'BUY' | 'SELL' | 'HOLD';
  skip?: number;
  limit?: number;
}

export interface BacktestQueryParams {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  modelIds?: number[];
}
