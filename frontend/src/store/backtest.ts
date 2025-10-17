import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as backtestApi from '@/api/backtest'
import type {
  BacktestRequest,
  PortfolioBacktestRequest,
  BacktestComparisonResponse,
  BacktestResultDetail,
  BacktestResult,
  ModelBacktestResponse,
  PortfolioBacktestResponse,
  BacktestResultsParams,
  TradeRecord,
  SignalRecord,
  EquityCurvePoint
} from '@/types/api'

// 回测状态管理
export const useBacktestStore = defineStore('backtest', () => {
  // 状态
  const backtestConfig = ref({
    startDate: '',
    endDate: '',
    initialCapital: 100000,
    models: [] as string[],
    stocks: [] as string[],
    rebalanceFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    commissionRate: 0.001,
    slippage: 0.001
  })

  const backtestResults = ref<BacktestResultDetail[]>([])
  const currentBacktest = ref<BacktestResultDetail | null>(null)
  const comparisonResults = ref<BacktestComparisonResponse | null>(null)
  const portfolioResults = ref<PortfolioBacktestResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const running = ref(false)
  const progress = ref(0)
  const executionLogs = ref<string[]>([])

  // 分页信息
  const pagination = ref({
    current: 1,
    size: 10,
    total: 0,
    skip: 0,
    limit: 10
  })

  // 筛选条件
  const filters = ref({
    modelId: '',
    startDate: '',
    endDate: '',
    status: '',
    minReturn: 0,
    maxDrawdown: 100
  })

  // 排序配置
  const sortConfig = ref({
    field: 'created_at',
    order: 'desc' as 'asc' | 'desc'
  })

  // 计算属性
  const filteredResults = computed(() => {
    let filtered = [...backtestResults.value]

    // 应用筛选条件
    if (filters.value.modelId) {
      filtered = filtered.filter(result => 
        result.model_id.toString() === filters.value.modelId
      )
    }

    if (filters.value.startDate) {
      filtered = filtered.filter(result => 
        result.backtest_date >= filters.value.startDate
      )
    }

    if (filters.value.endDate) {
      filtered = filtered.filter(result => 
        result.backtest_date <= filters.value.endDate
      )
    }

    if (filters.value.minReturn > 0) {
      filtered = filtered.filter(result => 
        result.results.total_return >= filters.value.minReturn
      )
    }

    if (filters.value.maxDrawdown < 100) {
      filtered = filtered.filter(result => 
        result.results.max_drawdown <= filters.value.maxDrawdown
      )
    }

    // 应用排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortConfig.value.field) {
        case 'model_name':
          aValue = a.model_name
          bValue = b.model_name
          break
        case 'total_return':
          aValue = a.results.total_return
          bValue = b.results.total_return
          break
        case 'sharpe_ratio':
          aValue = a.results.sharpe_ratio
          bValue = b.results.sharpe_ratio
          break
        case 'max_drawdown':
          aValue = a.results.max_drawdown
          bValue = b.results.max_drawdown
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
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
    const total = backtestResults.value.length
    const avgReturn = backtestResults.value.reduce((sum: number, result: BacktestResultDetail) =>
      sum + result.results.total_return, 0) / total || 0
    const avgSharpe = backtestResults.value.reduce((sum: number, result: BacktestResultDetail) =>
      sum + result.results.sharpe_ratio, 0) / total || 0
    const avgDrawdown = backtestResults.value.reduce((sum: number, result: BacktestResultDetail) =>
      sum + result.results.max_drawdown, 0) / total || 0
    const bestReturn = Math.max(...backtestResults.value.map((r: BacktestResultDetail) => r.results.total_return))
    const worstReturn = Math.min(...backtestResults.value.map((r: BacktestResultDetail) => r.results.total_return))

    return {
      total,
      avgReturn,
      avgSharpe,
      avgDrawdown,
      bestReturn,
      worstReturn,
      successRate: (backtestResults.value.filter((r: BacktestResultDetail) => r.results.total_return > 0).length / total) * 100 || 0
    }
  })

  // 性能排名
  const performanceRankings = computed(() => {
    return [...backtestResults.value]
      .sort((a, b) => b.results.total_return - a.results.total_return)
      .map((result, index) => ({
        ...result,
        rank: index + 1
      }))
  })

  // 操作
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const setRunning = (value: boolean) => {
    running.value = value
  }

  const setProgress = (value: number) => {
    progress.value = value
  }

  const addLog = (message: string) => {
    executionLogs.value.push(`${new Date().toLocaleTimeString()}: ${message}`)
    // 保持日志数量在合理范围内
    if (executionLogs.value.length > 100) {
      executionLogs.value = executionLogs.value.slice(-50)
    }
  }

  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const setSortConfig = (field: string, order: 'asc' | 'desc') => {
    sortConfig.value = { field, order }
  }

  const setPagination = (page: number, size: number) => {
    pagination.value.current = page
    pagination.value.size = size
    pagination.value.skip = (page - 1) * size
    pagination.value.limit = size
  }

  // 运行模型回测
  const runModelBacktest = async (request: BacktestRequest) => {
    try {
      setRunning(true)
      setProgress(0)
      setError(null)
      executionLogs.value = []
      
      addLog('开始模型回测...')
      setProgress(10)

      const response = await backtestApi.runModelBacktest(request)
      
      addLog('回测完成，处理结果...')
      setProgress(90)

      // 添加到结果列表
      const resultDetail: BacktestResultDetail = {
        id: backtestResults.value.length + 1,
        model_id: request.model_ids?.[0] || 1,
        model_name: '模型回测',
        backtest_date: new Date().toISOString().split('T')[0],
        results: response.backtest_result,
        trades: response.backtest_result.trades || [],
        created_at: new Date().toISOString()
      }

      backtestResults.value.unshift(resultDetail)
      currentBacktest.value = resultDetail
      
      addLog('回测结果已保存')
      setProgress(100)

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '运行模型回测失败'
      setError(errorMessage)
      addLog(`错误: ${errorMessage}`)
      throw err
    } finally {
      setRunning(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  // 执行组合回测
  const runPortfolioBacktest = async (request: PortfolioBacktestRequest) => {
    try {
      setRunning(true)
      setProgress(0)
      setError(null)
      executionLogs.value = []
      
      addLog('开始组合回测...')
      setProgress(10)

      const response = await backtestApi.runPortfolioBacktest(request)
      
      addLog('组合回测完成，处理结果...')
      setProgress(90)

      portfolioResults.value = response
      
      addLog('组合回测结果已保存')
      setProgress(100)

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '执行组合回测失败'
      setError(errorMessage)
      addLog(`错误: ${errorMessage}`)
      throw err
    } finally {
      setRunning(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  // 比较回测结果
  const compareBacktestResults = async (requests: BacktestRequest[]) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await backtestApi.compareBacktestResults(requests)
      comparisonResults.value = response
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '比较回测结果失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取回测结果详情
  const fetchBacktestResult = async (resultId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await backtestApi.getBacktestResult(resultId)
      currentBacktest.value = response
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取回测结果详情失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取回测结果列表
  const fetchBacktestResults = async (params?: BacktestResultsParams) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await backtestApi.getBacktestResults(params)
      backtestResults.value = response.data
      pagination.value.total = response.total
      pagination.value.skip = response.skip
      pagination.value.limit = response.limit
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取回测结果列表失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取回测性能指标
  const fetchBacktestMetrics = async (resultId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const metrics = await backtestApi.getBacktestMetrics(resultId)
      return metrics
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取回测性能指标失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取回测交易记录
  const fetchBacktestTrades = async (resultId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const trades = await backtestApi.getBacktestTrades(resultId)
      return trades
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取回测交易记录失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取回测权益曲线
  const fetchBacktestEquityCurve = async (resultId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const equityCurve = await backtestApi.getBacktestEquityCurve(resultId)
      return equityCurve
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取回测权益曲线失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取回测信号记录
  const fetchBacktestSignals = async (resultId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const signals = await backtestApi.getBacktestSignals(resultId)
      return signals
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取回测信号记录失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 计算回测统计信息
  const fetchBacktestStatistics = async (resultIds: number[]) => {
    try {
      setLoading(true)
      setError(null)
      
      const statistics = await backtestApi.getBacktestStatistics(resultIds)
      return statistics
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '计算回测统计信息失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 导出回测结果
  const exportBacktestResult = async (resultId: number, format: 'json' | 'csv' = 'json') => {
    try {
      setLoading(true)
      setError(null)
      
      const exportData = await backtestApi.exportBacktestResult(resultId, format)
      
      // 创建下载链接
      const blob = new Blob([exportData], { type: format === 'csv' ? 'text/csv' : 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backtest_result_${resultId}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return exportData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导出回测结果失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取回测性能趋势
  const fetchBacktestPerformanceTrend = async (modelId: number, startDate: string, endDate: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const trend = await backtestApi.getBacktestPerformanceTrend(modelId, startDate, endDate)
      return trend
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取回测性能趋势失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 清除错误
  const clearError = () => {
    setError(null)
  }

  // 清除当前回测
  const clearCurrentBacktest = () => {
    currentBacktest.value = null
  }

  // 清除比较结果
  const clearComparisonResults = () => {
    comparisonResults.value = null
  }

  // 清除组合结果
  const clearPortfolioResults = () => {
    portfolioResults.value = null
  }

  // 清除执行日志
  const clearExecutionLogs = () => {
    executionLogs.value = []
  }

  // 重置配置
  const resetConfig = () => {
    backtestConfig.value = {
      startDate: '',
      endDate: '',
      initialCapital: 100000,
      models: [],
      stocks: [],
      rebalanceFrequency: 'monthly',
      commissionRate: 0.001,
      slippage: 0.001
    }
  }

  return {
    // 状态
    backtestConfig,
    backtestResults,
    currentBacktest,
    comparisonResults,
    portfolioResults,
    loading,
    error,
    running,
    progress,
    executionLogs,
    pagination,
    filters,
    sortConfig,

    // 计算属性
    filteredResults,
    stats,
    performanceRankings,

    // 操作
    setLoading,
    setError,
    setRunning,
    setProgress,
    addLog,
    setFilters,
    setSortConfig,
    setPagination,
    runModelBacktest,
    runPortfolioBacktest,
    compareBacktestResults,
    fetchBacktestResult,
    fetchBacktestResults,
    fetchBacktestMetrics,
    fetchBacktestTrades,
    fetchBacktestEquityCurve,
    fetchBacktestSignals,
    fetchBacktestStatistics,
    exportBacktestResult,
    fetchBacktestPerformanceTrend,
    clearError,
    clearCurrentBacktest,
    clearComparisonResults,
    clearPortfolioResults,
    clearExecutionLogs,
    resetConfig
  }
})