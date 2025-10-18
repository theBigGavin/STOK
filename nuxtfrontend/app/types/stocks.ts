/**
 * 股票相关类型定义 - 根据数据模型文档更新
 */

export interface StockInfo {
  id: string;
  symbol: string;
  name: string;
  industry?: string;
  market: 'A股' | '港股' | '美股';
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  volume?: number;
  marketCap?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockPrice {
  id: string;
  stockId: string;
  date: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice?: number;
  volume?: number;
  adjustedClose?: number;
  createdAt: string;
}

export interface StockFilter {
  market?: string;
  industry?: string;
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
  sortBy?: 'symbol' | 'name' | 'currentPrice' | 'priceChangePercent' | 'volume';
  sortOrder?: 'asc' | 'desc';
}
