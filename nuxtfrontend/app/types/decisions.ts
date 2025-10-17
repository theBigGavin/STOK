/**
 * 决策相关类型定义
 */

export interface ModelDecision {
  modelId: number;
  modelName: string;
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  signalStrength: number;
  reasoning?: string;
}

export interface FinalDecision {
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  voteSummary: {
    BUY: number;
    SELL: number;
    HOLD: number;
  };
  modelDetails: ModelDecision[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
}

export interface DecisionResult {
  symbol: string;
  tradeDate: string;
  finalDecision: FinalDecision;
  riskAssessment: {
    isApproved: boolean;
    riskLevel: string;
    warnings: string[];
    adjustedDecision: string;
    positionSuggestion: number;
  };
  timestamp: string;
}