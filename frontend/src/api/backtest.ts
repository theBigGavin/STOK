import { http } from './index'
import type {
  BacktestRequest,
  PortfolioBacktestRequest,
  BacktestComparisonResponse,
  BacktestResultDetail,
  ApiResponse,
  PaginatedResponse,
  BacktestResultsParams,
  BacktestResult,
  ModelBacktestResponse,
  PortfolioBacktestResponse
} from '@/types/api'

/**
 * 回测分析 API 服务
 */

// 运行模型回测
export const runModelBacktest = async (backtestRequest: BacktestRequest): Promise<ModelBacktestResponse> => {
  try {
    const response = await http.post<ModelBacktestResponse>('/api/v1/backtest/model', backtestRequest)
    return response
  } catch (error) {
    console.error('运行模型回测失败:', error)
    throw error
  }
}

// 执行组合回测
export const runPortfolioBacktest = async (
  portfolioRequest: PortfolioBacktestRequest
): Promise<PortfolioBacktestResponse> => {
  try {
    const response = await http.post<PortfolioBacktestResponse>('/api/v1/backtest/portfolio', portfolioRequest)
    return response
  } catch (error) {
    console.error('执行组合回测失败:', error)
    throw error
  }
}

// 比较多个回测结果
export const compareBacktestResults = async (
  backtestRequests: BacktestRequest[]
): Promise<BacktestComparisonResponse> => {
  try {
    const response = await http.post<BacktestComparisonResponse>('/api/v1/backtest/compare', backtestRequests)
    return response
  } catch (error) {
    console.error('比较回测结果失败:', error)
    throw error
  }
}

// 获取回测结果详情
export const getBacktestResult = async (resultId: number): Promise<BacktestResultDetail> => {
  try {
    const response = await http.get<BacktestResultDetail>(`/api/v1/backtest/results/${resultId}`)
    return response
  } catch (error) {
    console.error(`获取回测结果 ${resultId} 详情失败:`, error)
    throw error
  }
}

// 获取回测结果列表
export const getBacktestResults = async (params?: BacktestResultsParams): Promise<PaginatedResponse<BacktestResultDetail>> => {
  try {
    const response = await http.get<PaginatedResponse<BacktestResultDetail>>('/api/v1/backtest/results', {
      params: {
        model_id: params?.model_id,
        start_date: params?.start_date,
        end_date: params?.end_date,
        skip: params?.skip || 0,
        limit: params?.limit || 100
      }
    })
    return response
  } catch (error) {
    console.error('获取回测结果列表失败:', error)
    throw error
  }
}

// 批量运行模型回测
export const runBatchModelBacktest = async (
  backtestRequests: BacktestRequest[]
): Promise<Record<string, BacktestResult>> => {
  try {
    const promises = backtestRequests.map(request =>
      runModelBacktest(request).catch(error => {
        console.error(`股票 ${request.symbol} 回测失败:`, error)
        return null
      })
    )

    const results = await Promise.all(promises)
    const data: Record<string, BacktestResult> = {}

    results.forEach((result, index) => {
      if (result && result.backtest_result) {
        data[backtestRequests[index].symbol] = result.backtest_result
      }
    })

    return data
  } catch (error) {
    console.error('批量运行模型回测失败:', error)
    throw error
  }
}

// 获取回测性能指标
export const getBacktestMetrics = async (resultId: number): Promise<{
  metrics: {
    total_return: number
    annual_return: number
    volatility: number
    sharpe_ratio: number
    max_drawdown: number
    win_rate: number
    profit_factor: number
  }
  benchmark?: {
    total_return: number
    annual_return: number
    sharpe_ratio: number
  }
}> => {
  try {
    const result = await getBacktestResult(resultId)
    
    return {
      metrics: result.results,
      benchmark: {
        total_return: 0.1, // 基准收益率，需要从实际数据获取
        annual_return: 0.08,
        sharpe_ratio: 1.0
      }
    }
  } catch (error) {
    console.error(`获取回测结果 ${resultId} 性能指标失败:`, error)
    throw error
  }
}

// 获取回测交易记录
export const getBacktestTrades = async (resultId: number): Promise<Array<{
  type: 'BUY' | 'SELL'
  date: string
  price: number
  shares: number
  value: number
  profit?: number
  reason?: string
  symbol?: string
}>> => {
  try {
    const result = await getBacktestResult(resultId)
    return result.trades.map(trade => ({
      type: trade.type,
      date: trade.date,
      price: trade.price,
      shares: trade.shares,
      value: trade.value,
      profit: trade.profit,
      reason: trade.reason,
      symbol: trade.symbol
    }))
  } catch (error) {
    console.error(`获取回测结果 ${resultId} 交易记录失败:`, error)
    throw error
  }
}

// 获取回测权益曲线
export const getBacktestEquityCurve = async (resultId: number): Promise<Array<{
  date: string
  value: number
}>> => {
  try {
    const result = await getBacktestResult(resultId)
    // 从回测结果中提取权益曲线数据
    // 这里需要根据实际数据结构调整
    return []
  } catch (error) {
    console.error(`获取回测结果 ${resultId} 权益曲线失败:`, error)
    throw error
  }
}

// 获取回测信号记录
export const getBacktestSignals = async (resultId: number): Promise<Array<{
  date: string
  decision: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  signal_strength: number
  reasoning?: string
}>> => {
  try {
    const result = await getBacktestResult(resultId)
    // 从回测结果中提取信号记录数据
    // 这里需要根据实际数据结构调整
    return []
  } catch (error) {
    console.error(`获取回测结果 ${resultId} 信号记录失败:`, error)
    throw error
  }
}

// 计算回测统计信息
export const getBacktestStatistics = async (resultIds: number[]): Promise<{
  total_results: number
  avg_return: number
  best_return: number
  worst_return: number
  avg_sharpe: number
  success_rate: number
  results: Array<{
    result_id: number
    symbol: string
    total_return: number
    sharpe_ratio: number
    max_drawdown: number
    win_rate: number
  }>
}> => {
  try {
    const promises = resultIds.map(id =>
      getBacktestResult(id).catch(error => {
        console.error(`获取回测结果 ${id} 失败:`, error)
        return null
      })
    )

    const results = await Promise.all(promises)
    const validResults = results.filter(result => result !== null) as BacktestResultDetail[]

    const statistics = {
      total_results: validResults.length,
      avg_return: 0,
      best_return: 0,
      worst_return: 0,
      avg_sharpe: 0,
      success_rate: 0,
      results: validResults.map(result => ({
        result_id: result.id,
        symbol: result.model_name,
        total_return: result.results.total_return,
        sharpe_ratio: result.results.sharpe_ratio,
        max_drawdown: result.results.max_drawdown,
        win_rate: result.results.win_rate
      }))
    }

    if (validResults.length > 0) {
      const returns = validResults.map(result => result.results.total_return)
      const sharpeRatios = validResults.map(result => result.results.sharpe_ratio)
      
      statistics.avg_return = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
      statistics.best_return = Math.max(...returns)
      statistics.worst_return = Math.min(...returns)
      statistics.avg_sharpe = sharpeRatios.reduce((sum, ratio) => sum + ratio, 0) / sharpeRatios.length
      statistics.success_rate = (returns.filter(ret => ret > 0).length / returns.length) * 100
    }

    return statistics
  } catch (error) {
    console.error('计算回测统计信息失败:', error)
    throw error
  }
}

// 导出回测结果
export const exportBacktestResult = async (resultId: number, format: 'json' | 'csv' = 'json'): Promise<string> => {
  try {
    const result = await getBacktestResult(resultId)
    
    if (format === 'csv') {
      // 生成 CSV 格式
      const headers = ['日期', '决策', '价格', '股数', '价值', '利润', '原因']
      const trades = result.trades.map(trade => [
        trade.date,
        trade.type,
        trade.price.toString(),
        trade.shares.toString(),
        trade.value.toString(),
        trade.profit?.toString() || '0',
        trade.reason || ''
      ])
      
      const csvContent = [headers, ...trades]
        .map(row => row.join(','))
        .join('\n')
      
      return csvContent
    } else {
      // JSON 格式
      return JSON.stringify(result, null, 2)
    }
  } catch (error) {
    console.error(`导出回测结果 ${resultId} 失败:`, error)
    throw error
  }
}

// 获取回测性能趋势
export const getBacktestPerformanceTrend = async (
  modelId: number,
  startDate: string,
  endDate: string
): Promise<Array<{
  date: string
  total_return: number
  sharpe_ratio: number
  max_drawdown: number
}>> => {
  try {
    const results = await getBacktestResults({
      model_id: modelId,
      start_date: startDate,
      end_date: endDate,
      limit: 100
    })
    
    return results.data.map(result => ({
      date: result.backtest_date,
      total_return: result.results.total_return,
      sharpe_ratio: result.results.sharpe_ratio,
      max_drawdown: result.results.max_drawdown
    }))
  } catch (error) {
    console.error(`获取模型 ${modelId} 回测性能趋势失败:`, error)
    throw error
  }
}

export default {
  runModelBacktest,
  runPortfolioBacktest,
  compareBacktestResults,
  getBacktestResult,
  getBacktestResults,
  runBatchModelBacktest,
  getBacktestMetrics,
  getBacktestTrades,
  getBacktestEquityCurve,
  getBacktestSignals,
  getBacktestStatistics,
  exportBacktestResult,
  getBacktestPerformanceTrend
}