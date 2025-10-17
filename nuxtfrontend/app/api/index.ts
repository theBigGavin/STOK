/**
 * API服务索引文件
 * 统一导出所有API服务，方便使用
 */

// 导入基础API服务
import { useApi } from '../composables/api'
import { useErrorHandler } from '../composables/errorHandler'
import { useCache, useCachedApi } from '../composables/cache'

// 导入股票相关API服务
import { stockApi, useCachedStockApi } from './stocks'
import type { 
  StockInfo, 
  StockDailyData 
} from '../types/stocks'
import type { StockQueryParams } from '../types/query'

// 导入决策相关API服务
import { decisionApi, useCachedDecisionApi } from './decisions'
import type { 
  DecisionResult,
  ModelDecision,
  FinalDecision
} from '../types/decisions'
import type { DecisionQueryParams } from '../types/query'

// 导入模型相关API服务
import { modelApi, useCachedModelApi } from './models'
import type { ModelInfo } from '../types/models'

// 导入回测相关API服务
import { backtestApi, useCachedBacktestApi } from './backtest'
import type { 
  BacktestResult,
  Trade,
  EquityPoint,
  Signal
} from '../types/backtest'
import type { BacktestQueryParams } from '../types/query'

// 导入健康检查API服务
import { healthApi, useCachedHealthApi } from './health'
import type { 
  HealthCheckResponse,
  PerformanceMetrics,
  SystemInfo,
  LogEntry,
  LogLevel
} from './health'

// 导入通用类型
import type { 
  APIResponse, 
  PaginatedResponse 
} from '../types/api'

// 导出基础API服务
export { useApi, useErrorHandler, useCache, useCachedApi }

// 导出股票相关API服务
export { stockApi, useCachedStockApi }
export type { StockInfo, StockDailyData, StockQueryParams }

// 导出决策相关API服务
export { decisionApi, useCachedDecisionApi }
export type { DecisionResult, ModelDecision, FinalDecision, DecisionQueryParams }

// 导出模型相关API服务
export { modelApi, useCachedModelApi }
export type { ModelInfo }

// 导出回测相关API服务
export { backtestApi, useCachedBacktestApi }
export type { BacktestResult, Trade, EquityPoint, Signal, BacktestQueryParams }

// 导出健康检查API服务
export { healthApi, useCachedHealthApi }
export type { HealthCheckResponse, PerformanceMetrics, SystemInfo, LogEntry, LogLevel }

// 导出通用类型
export type { APIResponse, PaginatedResponse }

/**
 * 统一API服务对象
 * 提供所有API服务的统一访问入口
 */
export const api = {
  // 基础服务
  base: {
    useApi,
    useErrorHandler,
    useCache,
    useCachedApi
  },
  
  // 业务服务
  stocks: stockApi,
  decisions: decisionApi,
  models: modelApi,
  backtest: backtestApi,
  health: healthApi,
  
  // 缓存服务
  cached: {
    stocks: useCachedStockApi,
    decisions: useCachedDecisionApi,
    models: useCachedModelApi,
    backtest: useCachedBacktestApi,
    health: useCachedHealthApi
  }
}

/**
 * 默认导出统一API服务
 */
export default api

/**
 * 使用示例：
 * 
 * // 导入特定API服务
 * import { stockApi } from '~/api'
 * 
 * // 使用统一API对象
 * import api from '~/api'
 * 
 * // 获取股票列表
 * const stocks = await api.stocks.getStocks()
 * 
 * // 使用缓存API
 * const cachedStocks = await api.cached.stocks().getStocks()
 * 
 * // 处理错误
 * const { handleApiError } = api.base.useErrorHandler()
 */