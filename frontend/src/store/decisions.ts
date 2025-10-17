import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as decisionApi from '@/api/decisions'
import type {
  DecisionResponse,
  BatchDecisionResponse,
  DecisionHistoryResponse,
  DecisionListParams,
  FinalDecision,
  RiskAssessment
} from '@/types/api'

// 决策状态管理
export const useDecisionStore = defineStore('decisions', () => {
  // 状态
  const decisionList = ref<DecisionResponse[]>([])
  const decisionDetail = ref<DecisionResponse | null>(null)
  const decisionHistory = ref<DecisionHistoryResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const generating = ref(false)
  const batchProgress = ref(0)

  // 分页信息
  const pagination = ref({
    current: 1,
    size: 10,
    total: 0
  })

  // 筛选条件
  const filters = ref({
    symbol: '',
    decisionType: '',
    startDate: '',
    endDate: '',
    minConfidence: 0,
    maxConfidence: 100
  })

  // 排序配置
  const sortConfig = ref({
    field: 'timestamp',
    order: 'desc' as 'asc' | 'desc'
  })

  // 计算属性
  const filteredDecisions = computed(() => {
    let filtered = [...decisionList.value]

    // 应用筛选条件
    if (filters.value.symbol) {
      filtered = filtered.filter(decision => 
        decision.symbol.toLowerCase().includes(filters.value.symbol.toLowerCase())
      )
    }

    if (filters.value.decisionType) {
      filtered = filtered.filter(decision => 
        decision.final_decision.decision === filters.value.decisionType
      )
    }

    if (filters.value.startDate) {
      filtered = filtered.filter(decision => 
        decision.trade_date >= filters.value.startDate
      )
    }

    if (filters.value.endDate) {
      filtered = filtered.filter(decision => 
        decision.trade_date <= filters.value.endDate
      )
    }

    if (filters.value.minConfidence > 0) {
      filtered = filtered.filter(decision => 
        decision.final_decision.confidence >= filters.value.minConfidence
      )
    }

    if (filters.value.maxConfidence < 100) {
      filtered = filtered.filter(decision => 
        decision.final_decision.confidence <= filters.value.maxConfidence
      )
    }

    // 应用排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortConfig.value.field) {
        case 'symbol':
          aValue = a.symbol
          bValue = b.symbol
          break
        case 'confidence':
          aValue = a.final_decision.confidence
          bValue = b.final_decision.confidence
          break
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime()
          bValue = new Date(b.timestamp).getTime()
          break
        default:
          aValue = a.symbol
          bValue = b.symbol
      }

      if (sortConfig.value.order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  })

  // 统计信息
  const stats = computed(() => {
    const total = decisionList.value.length
    const buyCount = decisionList.value.filter(d => d.final_decision.decision === 'BUY').length
    const sellCount = decisionList.value.filter(d => d.final_decision.decision === 'SELL').length
    const holdCount = decisionList.value.filter(d => d.final_decision.decision === 'HOLD').length
    const avgConfidence = decisionList.value.reduce((sum, d) => sum + d.final_decision.confidence, 0) / total || 0

    return {
      total,
      buyCount,
      sellCount,
      holdCount,
      avgConfidence,
      buyPercentage: total > 0 ? (buyCount / total * 100) : 0,
      sellPercentage: total > 0 ? (sellCount / total * 100) : 0,
      holdPercentage: total > 0 ? (holdCount / total * 100) : 0
    }
  })

  // 热门决策（高置信度）
  const topDecisions = computed(() => {
    return [...decisionList.value]
      .sort((a, b) => b.final_decision.confidence - a.final_decision.confidence)
      .slice(0, 5)
  })

  // 操作
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const setSortConfig = (field: string, order: 'asc' | 'desc') => {
    sortConfig.value = { field, order }
  }

  // 获取决策列表
  const fetchDecisions = async (params?: DecisionListParams) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await decisionApi.getDecisions(params)
      decisionList.value = response.data.map(item => ({
        symbol: item.symbol,
        trade_date: item.trade_date,
        final_decision: {
          decision: item.final_decision as 'BUY' | 'SELL' | 'HOLD',
          confidence: item.confidence_score,
          vote_summary: item.vote_summary,
          model_details: [],
          risk_level: 'MEDIUM',
          reasoning: '基于多模型投票结果'
        },
        risk_assessment: {
          is_approved: true,
          risk_level: 'MEDIUM',
          warnings: [],
          adjusted_decision: item.final_decision as 'BUY' | 'SELL' | 'HOLD',
          position_suggestion: 0.5
        },
        timestamp: new Date().toISOString()
      }))
      
      pagination.value.total = response.total
    } catch (err) {
      setError('获取决策列表失败')
      console.error('获取决策列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 获取决策详情
  const fetchDecisionDetail = async (decisionId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await decisionApi.getDecisionDetail(decisionId)
      decisionDetail.value = response
    } catch (err) {
      setError('获取决策详情失败')
      console.error('获取决策详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 获取决策历史
  const fetchDecisionHistory = async (symbol: string, startDate: string, endDate: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await decisionApi.getDecisionHistory(symbol, startDate, endDate)
      decisionHistory.value = response
    } catch (err) {
      setError('获取决策历史失败')
      console.error('获取决策历史失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 生成决策
  const generateDecision = async (symbol: string, tradeDate: string) => {
    try {
      generating.value = true
      setError(null)
      
      const response = await decisionApi.generateDecision({
        symbol,
        trade_date: tradeDate
      })
      
      // 添加到列表
      decisionList.value.unshift(response)
      return response
    } catch (err) {
      setError('生成决策失败')
      console.error('生成决策失败:', err)
      throw err
    } finally {
      generating.value = false
    }
  }

  // 批量生成决策
  const generateBatchDecisions = async (symbols: string[], tradeDate: string) => {
    try {
      generating.value = true
      batchProgress.value = 0
      setError(null)
      
      const response = await decisionApi.generateBatchDecisions({
        symbols,
        trade_date: tradeDate
      })
      
      // 更新进度
      batchProgress.value = 100
      
      // 添加到列表
      decisionList.value.unshift(...response.batch_results)
      return response
    } catch (err) {
      setError('批量生成决策失败')
      console.error('批量生成决策失败:', err)
      throw err
    } finally {
      generating.value = false
      batchProgress.value = 0
    }
  }

  // 获取决策统计
  const fetchDecisionStats = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await decisionApi.getDecisionStats(startDate, endDate)
      return response
    } catch (err) {
      setError('获取决策统计失败')
      console.error('获取决策统计失败:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取热门决策
  const fetchTopDecisions = async (limit?: number, decisionType?: 'BUY' | 'SELL') => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await decisionApi.getTopDecisions(limit, decisionType)
      return response
    } catch (err) {
      setError('获取热门决策失败')
      console.error('获取热门决策失败:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 清除错误
  const clearError = () => {
    setError(null)
  }

  // 清除决策详情
  const clearDecisionDetail = () => {
    decisionDetail.value = null
  }

  // 清除决策历史
  const clearDecisionHistory = () => {
    decisionHistory.value = null
  }

  return {
    // 状态
    decisionList,
    decisionDetail,
    decisionHistory,
    loading,
    error,
    generating,
    batchProgress,
    pagination,
    filters,
    sortConfig,

    // 计算属性
    filteredDecisions,
    stats,
    topDecisions,

    // 操作
    setLoading,
    setError,
    setFilters,
    setSortConfig,
    fetchDecisions,
    fetchDecisionDetail,
    fetchDecisionHistory,
    generateDecision,
    generateBatchDecisions,
    fetchDecisionStats,
    fetchTopDecisions,
    clearError,
    clearDecisionDetail,
    clearDecisionHistory
  }
})