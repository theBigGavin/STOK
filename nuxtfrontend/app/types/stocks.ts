/**
 * 股票相关类型定义 - 根据数据模型文档更新
 */

export const MarketType = {
  A_SHARE: 'A股',
  HK_SHARE: '港股',
  US_SHARE: '美股'
} as const;

export type MarketType = typeof MarketType[keyof typeof MarketType];

export const SortField = {
  SYMBOL: 'symbol',
  NAME: 'name',
  CURRENT_PRICE: 'currentPrice',
  PRICE_CHANGE_PERCENT: 'priceChangePercent',
  VOLUME: 'volume'
} as const;

export type SortField = typeof SortField[keyof typeof SortField];

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

export type SortOrder = typeof SortOrder[keyof typeof SortOrder];

export interface StockInfo {
  id: string;
  symbol: string;
  name: string;
  industry?: string;
  market: MarketType;
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
  market?: MarketType;
  industry?: string;
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

// 股票价格历史数据
export interface StockPriceHistory {
  symbol: string;
  prices: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

// 股票统计数据
export interface StockStatistics {
  totalStocks: number;
  marketDistribution: Record<MarketType, number>;
  industryDistribution: Record<string, number>;
  averagePrice: number;
  averageVolume: number;
}
