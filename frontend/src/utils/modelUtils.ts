import type { 
  BacktestModel, 
  ModelPerformance, 
  BacktestResult,
  ModelPerformanceMetrics 
} from '@/types/api'

/**
 * 模型工具函数
 */

/**
 * 格式化模型类型显示
 */
export const formatModelType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'technical': '技术指标',
    'machine_learning': '机器学习',
    'deep_learning': '深度学习',
    'fundamental': '基本面',
    'hybrid': '混合模型'
  }
  return typeMap[type] || type
}

/**
 * 获取模型类型标签样式
 */
export const getModelTypeTag = (type: string): string => {
  const typeMap: Record<string, string> = {
    'technical': '',
    'machine_learning': 'success',
    'deep_learning': 'warning',
    'fundamental': 'info',
    'hybrid': 'danger'
  }
  return typeMap[type] || ''
}

/**
 * 获取状态标签样式
 */
export const getStatusType = (isActive: boolean): string => {
  return isActive ? 'success' : 'info'
}

/**
 * 获取状态文本
 */
export const getStatusText = (isActive: boolean): string => {
  return isActive ? '活跃' : '停用'
}

/**
 * 格式化日期
 */
export const formatDate = (dateString: string, format: 'date' | 'datetime' = 'date'): string => {
  const date = new Date(dateString)
  
  if (format === 'date') {
    return date.toLocaleDateString('zh-CN')
  } else {
    return date.toLocaleString('zh-CN')
  }
}

/**
 * 计算模型平均性能指标
 */
export const calculateAverageMetrics = (models: BacktestModel[]): ModelPerformanceMetrics | null => {
  if (models.length === 0) return null

  const modelsWithMetrics = models.filter(model => model.performance_metrics)
  if (modelsWithMetrics.length === 0) return null

  const total = modelsWithMetrics.reduce((acc, model) => {
    const metrics = model.performance_metrics!
    return {
      accuracy: acc.accuracy + metrics.accuracy,
      precision: acc.precision + metrics.precision,
      recall: acc.recall + metrics.recall,
      f1_score: acc.f1_score + metrics.f1_score,
      total_return: acc.total_return + metrics.total_return,
      sharpe_ratio: acc.sharpe_ratio + metrics.sharpe_ratio,
      max_drawdown: acc.max_drawdown + metrics.max_drawdown
    }
  }, {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1_score: 0,
    total_return: 0,
    sharpe_ratio: 0,
    max_drawdown: 0
  })

  const count = modelsWithMetrics.length
  return {
    accuracy: total.accuracy / count,
    precision: total.precision / count,
    recall: total.recall / count,
    f1_score: total.f1_score / count,
    total_return: total.total_return / count,
    sharpe_ratio: total.sharpe_ratio / count,
    max_drawdown: total.max_drawdown / count
  }
}

/**
 * 根据性能指标排序模型
 */
export const sortModelsByMetric = (
  models: BacktestModel[], 
  metric: keyof ModelPerformanceMetrics, 
  order: 'asc' | 'desc' = 'desc'
): BacktestModel[] => {
  return [...models].sort((a, b) => {
    const aValue = a.performance_metrics?.[metric] || 0
    const bValue = b.performance_metrics?.[metric] || 0
    
    if (order === 'desc') {
      return bValue - aValue
    } else {
      return aValue - bValue
    }
  })
}

/**
 * 过滤活跃模型
 */
export const filterActiveModels = (models: BacktestModel[]): BacktestModel[] => {
  return models.filter(model => model.is_active)
}

/**
 * 根据类型过滤模型
 */
export const filterModelsByType = (models: BacktestModel[], type: string): BacktestModel[] => {
  if (!type) return models
  return models.filter(model => model.model_type === type)
}

/**
 * 搜索模型
 */
export const searchModels = (models: BacktestModel[], query: string): BacktestModel[] => {
  if (!query) return models
  
  const lowerQuery = query.toLowerCase()
  return models.filter(model => 
    model.name.toLowerCase().includes(lowerQuery) ||
    model.model_type.toLowerCase().includes(lowerQuery) ||
    model.description?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * 获取收益样式类名
 */
export const getReturnClass = (returnValue: number): string => {
  return returnValue > 0 ? 'positive-return' : 'negative-return'
}

/**
 * 获取回撤样式类名
 */
export const getDrawdownClass = (drawdown: number): string => {
  return drawdown < -0.1 ? 'high-drawdown' : 'normal-drawdown'
}

/**
 * 格式化参数键名
 */
export const formatParameterKey = (key: string): string => {
  return key.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * 格式化参数值
 */
export const formatParameterValue = (value: any): string => {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

/**
 * 验证模型参数
 */
export const validateModelParameters = (parameters: Record<string, any>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // 这里可以添加具体的参数验证逻辑
  // 例如检查必需参数、参数范围等

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 计算模型排名
 */
export const calculateModelRankings = (
  models: BacktestModel[], 
  metric: keyof ModelPerformanceMetrics = 'total_return'
): Array<{ model: BacktestModel; rank: number; value: number }> => {
  const modelsWithMetrics = models.filter(model => model.performance_metrics?.[metric] !== undefined)
  
  const sorted = modelsWithMetrics.sort((a, b) => {
    const aValue = a.performance_metrics![metric] as number
    const bValue = b.performance_metrics![metric] as number
    return bValue - aValue
  })

  return sorted.map((model, index) => ({
    model,
    rank: index + 1,
    value: model.performance_metrics![metric] as number
  }))
}

/**
 * 生成模型性能报告
 */
export const generatePerformanceReport = (model: BacktestModel, performanceHistory: ModelPerformance[]): any => {
  const latestPerformance = performanceHistory[performanceHistory.length - 1]
  const metrics = model.performance_metrics

  if (!metrics || !latestPerformance) {
    return {
      hasData: false,
      message: '暂无性能数据'
    }
  }

  return {
    hasData: true,
    summary: {
      modelName: model.name,
      modelType: formatModelType(model.model_type),
      lastUpdate: formatDate(model.updated_at, 'datetime'),
      totalReturn: metrics.total_return,
      accuracy: metrics.accuracy,
      sharpeRatio: metrics.sharpe_ratio,
      maxDrawdown: metrics.max_drawdown
    },
    trends: {
      accuracyTrend: calculateTrend(performanceHistory, 'accuracy'),
      returnTrend: calculateTrend(performanceHistory, 'total_return'),
      sharpeTrend: calculateTrend(performanceHistory, 'sharpe_ratio')
    },
    recommendations: generateRecommendations(metrics)
  }
}

/**
 * 计算性能趋势
 */
const calculateTrend = (history: ModelPerformance[], metric: keyof ModelPerformance): number => {
  if (history.length < 2) return 0

  const recent = history.slice(-2)
  const current = recent[1][metric]
  const previous = recent[0][metric]

  return ((Number(current) - Number(previous)) / Number(previous)) * 100
}

/**
 * 生成性能建议
 */
const generateRecommendations = (metrics: ModelPerformanceMetrics): string[] => {
  const recommendations: string[] = []

  if (metrics.accuracy < 0.6) {
    recommendations.push('模型准确率较低，建议重新训练或调整参数')
  }

  if (metrics.total_return < 0) {
    recommendations.push('模型总收益为负，建议检查策略有效性')
  }

  if (metrics.sharpe_ratio < 1) {
    recommendations.push('夏普比率较低，风险调整后收益不理想')
  }

  if (metrics.max_drawdown < -0.2) {
    recommendations.push('最大回撤较大，建议加强风险控制')
  }

  if (recommendations.length === 0) {
    recommendations.push('模型性能良好，继续保持')
  }

  return recommendations
}

/**
 * 导出模型数据为CSV
 */
export const exportModelsToCSV = (models: BacktestModel[]): string => {
  const headers = ['名称', '类型', '状态', '准确率', '总收益', '夏普比率', '最大回撤', '最后更新']
  
  const rows = models.map(model => [
    model.name,
    formatModelType(model.model_type),
    getStatusText(model.is_active),
    model.performance_metrics ? `${(model.performance_metrics.accuracy * 100).toFixed(2)}%` : 'N/A',
    model.performance_metrics ? `${(model.performance_metrics.total_return * 100).toFixed(2)}%` : 'N/A',
    model.performance_metrics ? model.performance_metrics.sharpe_ratio.toFixed(2) : 'N/A',
    model.performance_metrics ? `${(model.performance_metrics.max_drawdown * 100).toFixed(2)}%` : 'N/A',
    formatDate(model.updated_at, 'datetime')
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}

/**
 * 模拟模型性能数据（用于开发测试）
 */
export const generateMockPerformanceData = (days: number = 30): ModelPerformance[] => {
  const data: ModelPerformance[] = []
  const baseDate = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)
    
    data.push({
      id: i,
      model_id: 1,
      backtest_date: date.toISOString().split('T')[0],
      accuracy: 0.7 + Math.random() * 0.2,
      precision: 0.65 + Math.random() * 0.25,
      recall: 0.68 + Math.random() * 0.22,
      f1_score: 0.69 + Math.random() * 0.21,
      total_return: (Math.random() - 0.5) * 0.1,
      sharpe_ratio: Math.random() * 2,
      max_drawdown: -Math.random() * 0.15,
      created_at: date.toISOString()
    })
  }
  
  return data
}

export default {
  formatModelType,
  getModelTypeTag,
  getStatusType,
  getStatusText,
  formatDate,
  calculateAverageMetrics,
  sortModelsByMetric,
  filterActiveModels,
  filterModelsByType,
  searchModels,
  getReturnClass,
  getDrawdownClass,
  formatParameterKey,
  formatParameterValue,
  validateModelParameters,
  calculateModelRankings,
  generatePerformanceReport,
  exportModelsToCSV,
  generateMockPerformanceData
}