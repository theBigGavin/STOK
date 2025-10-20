/**
 * 模型相关类型定义
 */

export const ModelType = {
  TECHNICAL: 'technical',
  MACHINE_LEARNING: 'machine_learning',
  FUNDAMENTAL: 'fundamental'
} as const;

export type ModelType = typeof ModelType[keyof typeof ModelType];

export interface ModelInfo {
  modelId: string; // 改为string以匹配后端的UUID
  name: string;
  description?: string;
  modelType: ModelType; // 使用枚举类型
  parameters: Record<string, unknown>;
  weight: number;
  isActive: boolean;
  performanceScore?: number;
  createdAt?: string;
  updatedAt?: string;
  performanceMetrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    totalReturn?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    winRate?: number;
  };
}

// 后端API返回的原始模型数据结构
export interface ApiModelInfo {
  id: string;
  name: string;
  model_type: string;
  description?: string;
  weight: number | string;
  is_active: boolean;
  performance_score?: number | string;
  last_trained_at?: string;
  created_at?: string;
  updated_at?: string;
  performance_metrics?: {
    total_return?: number | string;
    annual_return?: number | string;
    sharpe_ratio?: number | string;
    max_drawdown?: number | string;
    win_rate?: number | string;
    profit_factor?: number | string;
  };
}

export interface PerformanceHistory {
  date: string;
  modelId: string; // 修复类型不一致问题
  modelName: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    totalReturn?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
  };
}

// 后端API返回的模型性能数据结构
export interface ApiModelPerformance {
  modelName: string;
  accuracy: number;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
  lastUpdated: string;
}

// 模型状态枚举
export const ModelStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TRAINING: 'training',
  ERROR: 'error'
} as const;

export type ModelStatus = typeof ModelStatus[keyof typeof ModelStatus];
