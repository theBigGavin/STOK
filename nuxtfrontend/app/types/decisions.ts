/**
 * 决策相关类型定义 - 根据数据模型文档更新
 */

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  market: string;
  industry?: string;
  current_price?: number;
  price_change_percent?: number;
  volume?: number;
  market_cap?: number;
  pe_ratio?: number;
  pb_ratio?: number;
  dividend_yield?: number;
}

export interface Decision {
  id: string;
  decision_type: 'buy' | 'sell' | 'hold';
  confidence: number;
  target_price?: number;
  stop_loss_price?: number;
  time_horizon?: number;
  reasoning?: string;
  generated_at?: string;
  expires_at?: string;
  created_at?: string;
}

export interface VoteResult {
  id: string;
  model_id: string;
  vote_type: 'buy' | 'sell' | 'hold';
  confidence: number;
  signal_strength: number;
  reasoning?: string;
  created_at?: string;
}

export interface VoteSummary {
  total_votes: number;
  buy_votes: number;
  sell_votes: number;
  hold_votes: number;
  avg_confidence: number;
  avg_signal_strength?: number;
}

export interface VoteDetail {
  vote_id: string;
  model_id: string;
  vote_type: 'buy' | 'sell' | 'hold';
  confidence: number;
  signal_strength: number;
  reasoning?: string;
  created_at?: string;
}

export interface ModelDetail {
  model: {
    id: string;
    name: string;
    model_type: string;
    description?: string;
    weight: number;
    performance_score?: number;
  };
  vote: {
    vote_type: 'buy' | 'sell' | 'hold';
    confidence: number;
    signal_strength: number;
    reasoning?: string;
  };
}

export interface Recommendation {
  stock: Stock;
  decision: Decision;
  vote_results: VoteResult[];
  total_votes: number;
  buy_votes: number;
  sell_votes: number;
  hold_votes: number;
  avg_confidence: number;
  vote_summary: VoteSummary;
  vote_details: VoteDetail[];
}

export interface RecommendationDetail {
  decision: Decision;
  stock: Stock;
  vote_results: VoteResult[];
  vote_summary: VoteSummary;
  model_details: ModelDetail[];
}

export interface RecommendationResponse {
  data: Recommendation[];
  total: number;
  skip: number;
  limit: number;
}

export interface DecisionDetailResponse {
  data: RecommendationDetail;
}

export interface DecisionStatistics {
  stock_statistics: {
    total_stocks: number;
    market_distribution: Record<string, number>;
    decision_distribution: Record<string, number>;
    latest_decision_time?: string;
    stocks_with_decisions: number;
    stocks_with_prices: number;
  };
  decision_statistics: {
    total_decisions: number;
    buy_decisions: number;
    sell_decisions: number;
    hold_decisions: number;
    avg_confidence: number;
  };
  model_statistics: {
    total_models: number;
    active_models: number;
    model_types: {
      technical: number;
      fundamental: number;
      machine_learning: number;
    };
  };
}

export interface SearchResult {
  stock: Stock;
  decision: Decision;
}

export interface SearchResponse {
  data: SearchResult[];
  total: number;
  skip: number;
  limit: number;
}

export interface RefreshResponse {
  generated_count: number;
  timestamp: string;
}

// API 请求参数
export interface RecommendationRequest {
  limit?: number;
  skip?: number;
}

export interface StockDecisionsRequest {
  stock_id: string;
  limit?: number;
  skip?: number;
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

// 决策筛选选项
export interface DecisionFilter {
  decision_type?: 'buy' | 'sell' | 'hold';
  min_confidence?: number;
  market?: string;
  industry?: string;
}

// 排序选项
export interface SortOption {
  field: 'confidence' | 'votes' | 'symbol' | 'price' | 'date';
  direction: 'asc' | 'desc';
}
