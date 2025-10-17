/**
 * 模型相关类型定义
 */

export interface ModelInfo {
  modelId: number;
  name: string;
  description?: string;
  modelType: "technical" | "ml" | "dl";
  parameters: Record<string, any>;
  weight: number;
  isActive: boolean;
  performanceMetrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    totalReturn?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
  };
}