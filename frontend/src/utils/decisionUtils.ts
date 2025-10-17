import type { 
  DecisionResponse, 
  FinalDecision, 
  RiskAssessment,
  ModelDecision 
} from '@/types/api'

/**
 * 决策数据处理工具函数
 */

// 获取决策类型颜色
export const getDecisionColor = (decision: string): string => {
  const colors: Record<string, string> = {
    BUY: '#67c23a',
    SELL: '#f56c6c',
    HOLD: '#e6a23c'
  }
  return colors[decision] || '#909399'
}

// 获取决策类型文本
export const getDecisionText = (decision: string): string => {
  const texts: Record<string, string> = {
    BUY: '买入',
    SELL: '卖出',
    HOLD: '持有'
  }
  return texts[decision] || decision
}

// 获取风险等级颜色
export const getRiskLevelColor = (riskLevel: string): string => {
  const colors: Record<string, string> = {
    LOW: '#67c23a',
    MEDIUM: '#e6a23c',
    HIGH: '#f56c6c'
  }
  return colors[riskLevel] || '#909399'
}

// 获取风险等级文本
export const getRiskLevelText = (riskLevel: string): string => {
  const texts: Record<string, string> = {
    LOW: '低风险',
    MEDIUM: '中风险',
    HIGH: '高风险'
  }
  return texts[riskLevel] || riskLevel
}

// 获取置信度状态
export const getConfidenceStatus = (confidence: number): 'success' | 'warning' | 'exception' => {
  if (confidence >= 80) return 'success'
  if (confidence >= 60) return 'warning'
  return 'exception'
}

// 获取信号强度状态
export const getSignalStrengthStatus = (strength: number): 'success' | 'warning' | 'exception' => {
  if (strength >= 70) return 'success'
  if (strength >= 40) return 'warning'
  return 'exception'
}

// 格式化决策时间
export const formatDecisionTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 计算决策质量评分
export const calculateDecisionQuality = (decision: DecisionResponse): number => {
  const { final_decision, risk_assessment } = decision
  
  let quality = final_decision.confidence * 0.6 // 置信度权重 60%
  
  // 风险等级权重 20%
  const riskWeights: Record<string, number> = {
    LOW: 1.0,
    MEDIUM: 0.7,
    HIGH: 0.4
  }
  quality += (riskWeights[risk_assessment.risk_level] || 0.5) * 20
  
  // 投票一致性权重 20%
  const voteSummary = final_decision.vote_summary
  const totalVotes = voteSummary.BUY + voteSummary.SELL + voteSummary.HOLD
  if (totalVotes > 0) {
    const maxVotes = Math.max(voteSummary.BUY, voteSummary.SELL, voteSummary.HOLD)
    const consistency = maxVotes / totalVotes
    quality += consistency * 20
  }
  
  return Math.round(quality)
}

// 评估决策执行建议
export const getExecutionAdvice = (decision: DecisionResponse): {
  advice: string
  color: string
  icon: string
} => {
  const { final_decision, risk_assessment } = decision
  
  if (risk_assessment.risk_level === 'HIGH') {
    return {
      advice: '高风险，建议谨慎执行',
      color: '#f56c6c',
      icon: 'Warning'
    }
  }
  
  if (final_decision.confidence >= 80) {
    return {
      advice: '高置信度，建议执行',
      color: '#67c23a',
      icon: 'SuccessFilled'
    }
  }
  
  if (final_decision.confidence >= 60) {
    return {
      advice: '中等置信度，建议观察',
      color: '#e6a23c',
      icon: 'InfoFilled'
    }
  }
  
  return {
    advice: '低置信度，不建议执行',
    color: '#909399',
    icon: 'CloseBold'
  }
}

// 生成投票分布数据
export const generateVoteDistribution = (voteSummary: { BUY: number; SELL: number; HOLD: number }) => {
  const total = voteSummary.BUY + voteSummary.SELL + voteSummary.HOLD
  return [
    {
      name: '买入',
      value: voteSummary.BUY,
      percentage: total > 0 ? (voteSummary.BUY / total * 100) : 0,
      color: '#67c23a'
    },
    {
      name: '卖出',
      value: voteSummary.SELL,
      percentage: total > 0 ? (voteSummary.SELL / total * 100) : 0,
      color: '#f56c6c'
    },
    {
      name: '持有',
      value: voteSummary.HOLD,
      percentage: total > 0 ? (voteSummary.HOLD / total * 100) : 0,
      color: '#e6a23c'
    }
  ]
}

// 过滤决策列表
export const filterDecisions = (
  decisions: DecisionResponse[],
  filters: {
    symbol?: string
    decisionType?: string
    startDate?: string
    endDate?: string
    minConfidence?: number
    maxConfidence?: number
  }
): DecisionResponse[] => {
  return decisions.filter(decision => {
    // 股票代码筛选
    if (filters.symbol && !decision.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) {
      return false
    }
    
    // 决策类型筛选
    if (filters.decisionType && decision.final_decision.decision !== filters.decisionType) {
      return false
    }
    
    // 日期范围筛选
    if (filters.startDate && decision.trade_date < filters.startDate) {
      return false
    }
    
    if (filters.endDate && decision.trade_date > filters.endDate) {
      return false
    }
    
    // 置信度筛选
    if (filters.minConfidence && decision.final_decision.confidence < filters.minConfidence) {
      return false
    }
    
    if (filters.maxConfidence && decision.final_decision.confidence > filters.maxConfidence) {
      return false
    }
    
    return true
  })
}

// 排序决策列表
export const sortDecisions = (
  decisions: DecisionResponse[],
  field: string,
  order: 'asc' | 'desc'
): DecisionResponse[] => {
  return [...decisions].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (field) {
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
      case 'quality':
        aValue = calculateDecisionQuality(a)
        bValue = calculateDecisionQuality(b)
        break
      default:
        aValue = a.symbol
        bValue = b.symbol
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

// 计算决策统计
export const calculateDecisionStats = (decisions: DecisionResponse[]) => {
  const total = decisions.length
  const buyCount = decisions.filter(d => d.final_decision.decision === 'BUY').length
  const sellCount = decisions.filter(d => d.final_decision.decision === 'SELL').length
  const holdCount = decisions.filter(d => d.final_decision.decision === 'HOLD').length
  const avgConfidence = decisions.reduce((sum, d) => sum + d.final_decision.confidence, 0) / total || 0
  
  const riskDistribution = {
    LOW: decisions.filter(d => d.risk_assessment.risk_level === 'LOW').length,
    MEDIUM: decisions.filter(d => d.risk_assessment.risk_level === 'MEDIUM').length,
    HIGH: decisions.filter(d => d.risk_assessment.risk_level === 'HIGH').length
  }
  
  return {
    total,
    buyCount,
    sellCount,
    holdCount,
    avgConfidence,
    buyPercentage: total > 0 ? (buyCount / total * 100) : 0,
    sellPercentage: total > 0 ? (sellCount / total * 100) : 0,
    holdPercentage: total > 0 ? (holdCount / total * 100) : 0,
    riskDistribution
  }
}

// 验证决策请求参数
export const validateDecisionRequest = (symbol: string, tradeDate: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  if (!symbol || symbol.trim() === '') {
    errors.push('股票代码不能为空')
  }
  
  if (!tradeDate || tradeDate.trim() === '') {
    errors.push('交易日期不能为空')
  }
  
  // 验证股票代码格式（基本格式验证）
  const symbolRegex = /^[A-Z]{1,5}$/
  if (symbol && !symbolRegex.test(symbol.toUpperCase())) {
    errors.push('股票代码格式不正确')
  }
  
  // 验证日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (tradeDate && !dateRegex.test(tradeDate)) {
    errors.push('日期格式不正确，应为 YYYY-MM-DD')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// 导出决策数据
export const exportDecisions = (decisions: DecisionResponse[], format: 'csv' | 'json' = 'csv') => {
  if (format === 'json') {
    const dataStr = JSON.stringify(decisions, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    return URL.createObjectURL(dataBlob)
  } else {
    // CSV 格式
    const headers = ['股票代码', '决策类型', '置信度', '风险等级', '决策时间', '投票分布']
    const csvData = decisions.map(decision => [
      decision.symbol,
      getDecisionText(decision.final_decision.decision),
      `${decision.final_decision.confidence}%`,
      getRiskLevelText(decision.risk_assessment.risk_level),
      formatDecisionTime(decision.timestamp),
      `买入:${decision.final_decision.vote_summary.BUY} 卖出:${decision.final_decision.vote_summary.SELL} 持有:${decision.final_decision.vote_summary.HOLD}`
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    return URL.createObjectURL(dataBlob)
  }
}

export default {
  getDecisionColor,
  getDecisionText,
  getRiskLevelColor,
  getRiskLevelText,
  getConfidenceStatus,
  getSignalStrengthStatus,
  formatDecisionTime,
  calculateDecisionQuality,
  getExecutionAdvice,
  generateVoteDistribution,
  filterDecisions,
  sortDecisions,
  calculateDecisionStats,
  validateDecisionRequest,
  exportDecisions
}