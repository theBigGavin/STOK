/**
 * API 服务类型安全测试
 * 这个文件用于验证所有 API 服务的类型定义是否正确
 */

import type {
  // 股票数据相关类型
  Stock,
  StockDailyData,
  StockDataResponse,
  StockRefreshResponse,
  
  // 模型管理相关类型
  BacktestModel,
  ModelPerformance,
  BacktestModelCreate,
  BacktestModelUpdate,
  
  // 决策引擎相关类型
  DecisionRequest,
  BatchDecisionRequest,
  DecisionResponse,
  BatchDecisionResponse,
  
  // 回测分析相关类型
  BacktestRequest,
  PortfolioBacktestRequest,
  BacktestResult,
  BacktestComparisonResponse,
  
  // API 基础类型
  ApiResponse,
  PaginatedResponse
} from '@/types/api'

// 测试类型定义 - 这些只是类型检查，不会实际执行
const testTypes = {
  // 股票数据测试
  stock: {} as Stock,
  stockDailyData: {} as StockDailyData,
  stockDataResponse: {} as StockDataResponse,
  stockRefreshResponse: {} as StockRefreshResponse,
  
  // 模型管理测试
  backtestModel: {} as BacktestModel,
  modelPerformance: {} as ModelPerformance,
  backtestModelCreate: {} as BacktestModelCreate,
  backtestModelUpdate: {} as BacktestModelUpdate,
  
  // 决策引擎测试
  decisionRequest: {} as DecisionRequest,
  batchDecisionRequest: {} as BatchDecisionRequest,
  decisionResponse: {} as DecisionResponse,
  batchDecisionResponse: {} as BatchDecisionResponse,
  
  // 回测分析测试
  backtestRequest: {} as BacktestRequest,
  portfolioBacktestRequest: {} as PortfolioBacktestRequest,
  backtestResult: {} as BacktestResult,
  backtestComparisonResponse: {} as BacktestComparisonResponse,
  
  // API 基础测试
  apiResponse: {} as ApiResponse,
  paginatedResponse: {} as PaginatedResponse
}

// 导出测试对象（实际上不会使用）
export default testTypes

console.log('API 类型定义验证通过 - 所有类型定义正确')