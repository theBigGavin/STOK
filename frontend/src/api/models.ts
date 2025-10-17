import { http } from './index'
import type {
  BacktestModel,
  ModelPerformance,
  BacktestModelCreate,
  BacktestModelUpdate,
  BacktestRequest,
  ApiResponse,
  PaginatedResponse,
  ModelListParams,
  BacktestResult
} from '@/types/api'

/**
 * 模型管理 API 服务
 */

// 获取模型列表
export const getModels = async (params?: ModelListParams): Promise<PaginatedResponse<BacktestModel>> => {
  try {
    const response = await http.get<PaginatedResponse<BacktestModel>>('/api/v1/models', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 100,
        active_only: params?.active_only ?? true,
        model_type: params?.model_type
      }
    })
    return response
  } catch (error) {
    console.error('获取模型列表失败:', error)
    throw error
  }
}

// 获取模型详情
export const getModel = async (modelId: number): Promise<BacktestModel> => {
  try {
    const response = await http.get<BacktestModel>(`/api/v1/models/${modelId}`)
    return response
  } catch (error) {
    console.error(`获取模型 ${modelId} 详情失败:`, error)
    throw error
  }
}

// 创建模型
export const createModel = async (modelData: BacktestModelCreate): Promise<BacktestModel> => {
  try {
    const response = await http.post<BacktestModel>('/api/v1/models', modelData)
    return response
  } catch (error) {
    console.error('创建模型失败:', error)
    throw error
  }
}

// 更新模型信息
export const updateModel = async (
  modelId: number,
  updateData: BacktestModelUpdate
): Promise<BacktestModel> => {
  try {
    const response = await http.put<BacktestModel>(`/api/v1/models/${modelId}`, updateData)
    return response
  } catch (error) {
    console.error(`更新模型 ${modelId} 信息失败:`, error)
    throw error
  }
}

// 删除模型（软删除）
export const deleteModel = async (modelId: number): Promise<void> => {
  try {
    await http.delete(`/api/v1/models/${modelId}`)
  } catch (error) {
    console.error(`删除模型 ${modelId} 失败:`, error)
    throw error
  }
}

// 运行模型回测
export const runModelBacktest = async (
  modelId: number,
  backtestRequest: BacktestRequest
): Promise<{
  model_id: number
  symbol: string
  backtest_result: BacktestResult
}> => {
  try {
    const response = await http.post<{
      model_id: number
      symbol: string
      backtest_result: BacktestResult
    }>(`/api/v1/models/${modelId}/backtest`, backtestRequest)
    return response
  } catch (error) {
    console.error(`运行模型 ${modelId} 回测失败:`, error)
    throw error
  }
}

// 获取模型性能历史
export const getModelPerformance = async (
  modelId: number,
  startDate?: string,
  endDate?: string
): Promise<{
  model_id: number
  performance_history: ModelPerformance[]
}> => {
  try {
    const response = await http.get<{
      model_id: number
      performance_history: ModelPerformance[]
    }>(`/api/v1/models/${modelId}/performance`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    })
    return response
  } catch (error) {
    console.error(`获取模型 ${modelId} 性能历史失败:`, error)
    throw error
  }
}

// 创建模型性能记录
export const createModelPerformance = async (
  modelId: number,
  performanceData: Omit<ModelPerformance, 'id' | 'created_at'>
): Promise<ModelPerformance> => {
  try {
    const response = await http.post<ModelPerformance>(
      `/api/v1/models/${modelId}/performance`,
      performanceData
    )
    return response
  } catch (error) {
    console.error(`创建模型 ${modelId} 性能记录失败:`, error)
    throw error
  }
}

// 获取活跃模型统计
export const getModelStats = async (): Promise<{
  total: number
  active: number
  by_type: Record<string, number>
}> => {
  try {
    const models = await getModels({ limit: 1000, active_only: false })
    
    const stats = {
      total: models.total,
      active: models.data.filter(model => model.is_active).length,
      by_type: {} as Record<string, number>
    }

    models.data.forEach(model => {
      if (model.model_type) {
        stats.by_type[model.model_type] = (stats.by_type[model.model_type] || 0) + 1
      }
    })

    return stats
  } catch (error) {
    console.error('获取模型统计失败:', error)
    throw error
  }
}

// 批量运行模型回测
export const runBatchModelBacktest = async (
  modelIds: number[],
  backtestRequest: Omit<BacktestRequest, 'model_ids'>
): Promise<Record<number, BacktestResult>> => {
  try {
    const promises = modelIds.map(modelId =>
      runModelBacktest(modelId, {
        ...backtestRequest,
        model_ids: [modelId]
      }).catch(error => {
        console.error(`模型 ${modelId} 回测失败:`, error)
        return null
      })
    )

    const results = await Promise.all(promises)
    const data: Record<number, BacktestResult> = {}

    results.forEach((result, index) => {
      if (result && result.backtest_result) {
        data[modelIds[index]] = result.backtest_result
      }
    })

    return data
  } catch (error) {
    console.error('批量运行模型回测失败:', error)
    throw error
  }
}

// 搜索模型
export const searchModels = async (query: string, limit: number = 20): Promise<BacktestModel[]> => {
  try {
    const models = await getModels({ limit: 1000, active_only: true })
    const filteredModels = models.data.filter(
      model =>
        model.name.toLowerCase().includes(query.toLowerCase()) ||
        model.model_type.toLowerCase().includes(query.toLowerCase()) ||
        model.description?.toLowerCase().includes(query.toLowerCase())
    )
    return filteredModels.slice(0, limit)
  } catch (error) {
    console.error('搜索模型失败:', error)
    throw error
  }
}

// 获取模型性能排名
export const getModelRankings = async (metric: keyof BacktestResult = 'total_return'): Promise<Array<{
  model: BacktestModel
  performance: number
  rank: number
}>> => {
  try {
    const models = await getModels({ limit: 100, active_only: true })
    const rankings = []

    for (const model of models.data) {
      if (model.performance_metrics) {
        const performance = model.performance_metrics[metric as keyof typeof model.performance_metrics] as number
        if (performance !== undefined) {
          rankings.push({
            model,
            performance,
            rank: 0 // 将在后面排序
          })
        }
      }
    }

    // 根据性能指标排序
    rankings.sort((a, b) => b.performance - a.performance)
    
    // 分配排名
    rankings.forEach((item, index) => {
      item.rank = index + 1
    })

    return rankings
  } catch (error) {
    console.error('获取模型排名失败:', error)
    throw error
  }
}

export default {
  getModels,
  getModel,
  createModel,
  updateModel,
  deleteModel,
  runModelBacktest,
  getModelPerformance,
  createModelPerformance,
  getModelStats,
  runBatchModelBacktest,
  searchModels,
  getModelRankings
}