import { http } from './index'
import type {
  DecisionRequest,
  BatchDecisionRequest,
  DecisionResponse,
  BatchDecisionResponse,
  DecisionHistoryResponse,
  DecisionListParams,
  ApiResponse,
  PaginatedResponse
} from '@/types/api'

/**
 * 决策引擎 API 服务
 */

// 生成交易决策
export const generateDecision = async (decisionRequest: DecisionRequest): Promise<DecisionResponse> => {
  try {
    const response = await http.post<DecisionResponse>('/api/v1/decisions/generate', decisionRequest)
    return response
  } catch (error) {
    console.error('生成交易决策失败:', error)
    throw error
  }
}

// 批量生成决策
export const generateBatchDecisions = async (
  batchRequest: BatchDecisionRequest
): Promise<BatchDecisionResponse> => {
  try {
    const response = await http.post<BatchDecisionResponse>('/api/v1/decisions/batch', batchRequest)
    return response
  } catch (error) {
    console.error('批量生成决策失败:', error)
    throw error
  }
}

// 获取决策历史
export const getDecisionHistory = async (
  symbol: string,
  startDate: string,
  endDate: string
): Promise<DecisionHistoryResponse> => {
  try {
    const response = await http.get<DecisionHistoryResponse>(`/api/v1/decisions/history/${symbol}`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    })
    return response
  } catch (error) {
    console.error(`获取股票 ${symbol} 决策历史失败:`, error)
    throw error
  }
}

// 获取决策详情
export const getDecisionDetail = async (decisionId: number): Promise<DecisionResponse> => {
  try {
    const response = await http.get<DecisionResponse>(`/api/v1/decisions/${decisionId}`)
    return response
  } catch (error) {
    console.error(`获取决策 ${decisionId} 详情失败:`, error)
    throw error
  }
}

// 获取决策列表
export const getDecisions = async (params?: DecisionListParams): Promise<PaginatedResponse<{
  id: number
  symbol: string
  trade_date: string
  final_decision: string
  confidence_score: number
  vote_summary: {
    BUY: number
    SELL: number
    HOLD: number
  }
}>> => {
  try {
    const response = await http.get<PaginatedResponse<{
      id: number
      symbol: string
      trade_date: string
      final_decision: string
      confidence_score: number
      vote_summary: {
        BUY: number
        SELL: number
        HOLD: number
      }
    }>>('/api/v1/decisions', {
      params: {
        symbol: params?.symbol,
        start_date: params?.start_date,
        end_date: params?.end_date,
        decision_type: params?.decision_type,
        skip: params?.skip || 0,
        limit: params?.limit || 100
      }
    })
    return response
  } catch (error) {
    console.error('获取决策列表失败:', error)
    throw error
  }
}

// 获取今日决策
export const getTodayDecisions = async (symbols?: string[]): Promise<DecisionResponse[]> => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    if (symbols && symbols.length > 0) {
      const batchRequest: BatchDecisionRequest = {
        symbols,
        trade_date: today
      }
      const batchResponse = await generateBatchDecisions(batchRequest)
      return batchResponse.batch_results
    } else {
      const decisions = await getDecisions({
        start_date: today,
        end_date: today,
        limit: 100
      })
      
      // 转换为 DecisionResponse 格式
      return decisions.data.map(decision => ({
        symbol: decision.symbol,
        trade_date: decision.trade_date,
        final_decision: {
          decision: decision.final_decision as 'BUY' | 'SELL' | 'HOLD',
          confidence: decision.confidence_score,
          vote_summary: decision.vote_summary,
          model_details: [],
          risk_level: 'MEDIUM',
          reasoning: '基于历史决策数据'
        },
        risk_assessment: {
          is_approved: true,
          risk_level: 'MEDIUM',
          warnings: [],
          adjusted_decision: decision.final_decision as 'BUY' | 'SELL' | 'HOLD',
          position_suggestion: 0.5
        },
        timestamp: new Date().toISOString()
      }))
    }
  } catch (error) {
    console.error('获取今日决策失败:', error)
    throw error
  }
}

// 获取热门决策（基于置信度排序）
export const getTopDecisions = async (
  limit: number = 10,
  decisionType?: 'BUY' | 'SELL'
): Promise<DecisionResponse[]> => {
  try {
    const decisions = await getDecisions({
      decision_type: decisionType,
      limit: 100
    })
    
    // 按置信度排序
    const sortedDecisions = decisions.data
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, limit)
    
    // 转换为 DecisionResponse 格式
    return sortedDecisions.map(decision => ({
      symbol: decision.symbol,
      trade_date: decision.trade_date,
      final_decision: {
        decision: decision.final_decision as 'BUY' | 'SELL' | 'HOLD',
        confidence: decision.confidence_score,
        vote_summary: decision.vote_summary,
        model_details: [],
        risk_level: 'MEDIUM',
        reasoning: '基于历史决策数据'
      },
      risk_assessment: {
        is_approved: true,
        risk_level: 'MEDIUM',
        warnings: [],
        adjusted_decision: decision.final_decision as 'BUY' | 'SELL' | 'HOLD',
        position_suggestion: 0.5
      },
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('获取热门决策失败:', error)
    throw error
  }
}

// 获取决策统计
export const getDecisionStats = async (startDate?: string, endDate?: string): Promise<{
  total_decisions: number
  buy_decisions: number
  sell_decisions: number
  hold_decisions: number
  avg_confidence: number
  by_symbol: Record<string, {
    count: number
    buy: number
    sell: number
    hold: number
  }>
}> => {
  try {
    const decisions = await getDecisions({
      start_date: startDate,
      end_date: endDate,
      limit: 1000
    })
    
    const stats = {
      total_decisions: decisions.total,
      buy_decisions: 0,
      sell_decisions: 0,
      hold_decisions: 0,
      avg_confidence: 0,
      by_symbol: {} as Record<string, {
        count: number
        buy: number
        sell: number
        hold: number
      }>
    }
    
    let totalConfidence = 0
    
    decisions.data.forEach(decision => {
      // 统计决策类型
      switch (decision.final_decision) {
        case 'BUY':
          stats.buy_decisions++
          break
        case 'SELL':
          stats.sell_decisions++
          break
        case 'HOLD':
          stats.hold_decisions++
          break
      }
      
      // 累计置信度
      totalConfidence += decision.confidence_score
      
      // 按股票统计
      if (!stats.by_symbol[decision.symbol]) {
        stats.by_symbol[decision.symbol] = {
          count: 0,
          buy: 0,
          sell: 0,
          hold: 0
        }
      }
      
      stats.by_symbol[decision.symbol].count++
      switch (decision.final_decision) {
        case 'BUY':
          stats.by_symbol[decision.symbol].buy++
          break
        case 'SELL':
          stats.by_symbol[decision.symbol].sell++
          break
        case 'HOLD':
          stats.by_symbol[decision.symbol].hold++
          break
      }
    })
    
    // 计算平均置信度
    stats.avg_confidence = decisions.total > 0 ? totalConfidence / decisions.total : 0
    
    return stats
  } catch (error) {
    console.error('获取决策统计失败:', error)
    throw error
  }
}

// 实时决策监控
export const monitorDecisions = async (
  symbols: string[],
  callback: (decision: DecisionResponse) => void,
  interval: number = 30000 // 30秒
): Promise<() => void> => {
  let isRunning = true
  
  const monitor = async () => {
    while (isRunning) {
      try {
        const today = new Date().toISOString().split('T')[0]
        const batchRequest: BatchDecisionRequest = {
          symbols,
          trade_date: today
        }
        
        const batchResponse = await generateBatchDecisions(batchRequest)
        
        batchResponse.batch_results.forEach(decision => {
          if (decision.final_decision) {
            callback(decision)
          }
        })
      } catch (error) {
        console.error('决策监控失败:', error)
      }
      
      // 等待指定间隔
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }
  
  // 启动监控
  monitor()
  
  // 返回停止函数
  return () => {
    isRunning = false
  }
}

export default {
  generateDecision,
  generateBatchDecisions,
  getDecisionHistory,
  getDecisionDetail,
  getDecisions,
  getTodayDecisions,
  getTopDecisions,
  getDecisionStats,
  monitorDecisions
}