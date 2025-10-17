/**
 * 股票相关类型定义
 */

export interface StockInfo {
  id: number;
  symbol: string;
  name: string;
  market: string;
  isActive: boolean;
  createdAt: string;
}

export interface StockDailyData {
  id: number;
  symbol: string;
  tradeDate: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  turnover?: number;
  createdAt: string;
}