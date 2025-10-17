import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getModels,
  getModel,
  createModel,
  updateModel,
  deleteModel,
  runModelBacktest,
  getModelPerformance,
  getModelStats,
  searchModels,
  getModelRankings
} from '@/api/models'
import type {
  BacktestModel,
  BacktestModelCreate,
  BacktestModelUpdate,
  BacktestRequest,
  BacktestResult,
  ModelPerformance,
  ModelListParams
} from '@/types/api'

// 模型状态管理
export const useModelStore = defineStore('models', () => {
  // 状态
  const models = ref<BacktestModel[]>([])
  const currentModel = ref<BacktestModel | null>(null)
  const modelPerformance = ref<ModelPerformance[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const filterType = ref<string>('')
  const pagination = ref({
    current: 1,
    size: 10,
    total: 0
  })

  // 计算属性
  const filteredModels = computed(() => {
    let filtered = models.value

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter((model: BacktestModel) =>
        model.name.toLowerCase().includes(query) ||
        model.model_type.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query)
      )
    }

    // 类型过滤
    if (filterType.value) {
      filtered = filtered.filter((model: BacktestModel) => model.model_type === filterType.value)
    }

    return filtered
  })

  const activeModels = computed(() =>
    models.value.filter((model: BacktestModel) => model.is_active)
  )

  const modelTypes = computed(() => {
    const types = new Set(models.value.map((model: BacktestModel) => model.model_type))
    return Array.from(types)
  })

  const modelStats = computed(() => {
    const stats = {
      total: models.value.length,
      active: activeModels.value.length,
      byType: {} as Record<string, number>
    }

    models.value.forEach((model: BacktestModel) => {
      if (model.model_type) {
        stats.byType[model.model_type] = (stats.byType[model.model_type] || 0) + 1
      }
    })

    return stats
  })

  // 动作
  const fetchModels = async (params?: ModelListParams) => {
    loading.value = true
    error.value = null
    try {
      const response = await getModels(params)
      models.value = response.data
      pagination.value.total = response.total
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取模型列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchModel = async (modelId: number) => {
    loading.value = true
    error.value = null
    try {
      const model = await getModel(modelId)
      currentModel.value = model
      return model
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取模型详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addModel = async (modelData: BacktestModelCreate) => {
    loading.value = true
    error.value = null
    try {
      const newModel = await createModel(modelData)
      models.value.push(newModel)
      return newModel
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建模型失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const editModel = async (modelId: number, updateData: BacktestModelUpdate) => {
    loading.value = true
    error.value = null
    try {
      const updatedModel = await updateModel(modelId, updateData)
      const index = models.value.findIndex((model: BacktestModel) => model.id === modelId)
      if (index !== -1) {
        models.value[index] = updatedModel
      }
      if (currentModel.value?.id === modelId) {
        currentModel.value = updatedModel
      }
      return updatedModel
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新模型失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeModel = async (modelId: number) => {
    loading.value = true
    error.value = null
    try {
      await deleteModel(modelId)
      models.value = models.value.filter((model: BacktestModel) => model.id !== modelId)
      if (currentModel.value?.id === modelId) {
        currentModel.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除模型失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleModelStatus = async (modelId: number, isActive: boolean) => {
    try {
      await editModel(modelId, { is_active: isActive })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '切换模型状态失败'
      throw err
    }
  }

  const runBacktest = async (modelId: number, backtestRequest: BacktestRequest) => {
    loading.value = true
    error.value = null
    try {
      const result = await runModelBacktest(modelId, backtestRequest)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '运行回测失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchModelPerformance = async (modelId: number, startDate?: string, endDate?: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await getModelPerformance(modelId, startDate, endDate)
      modelPerformance.value = response.performance_history
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取模型性能失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchModelStats = async () => {
    loading.value = true
    error.value = null
    try {
      const stats = await getModelStats()
      return stats
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取模型统计失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchModelsByQuery = async (query: string, limit = 20) => {
    loading.value = true
    error.value = null
    try {
      const results = await searchModels(query, limit)
      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : '搜索模型失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchModelRankings = async (metric: keyof BacktestResult = 'total_return') => {
    loading.value = true
    error.value = null
    try {
      const rankings = await getModelRankings(metric)
      return rankings
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取模型排名失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const setFilterType = (type: string) => {
    filterType.value = type
  }

  const setPagination = (page: number, size: number) => {
    pagination.value.current = page
    pagination.value.size = size
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentModel = () => {
    currentModel.value = null
  }

  const clearModelPerformance = () => {
    modelPerformance.value = []
  }

  return {
    // 状态
    models,
    currentModel,
    modelPerformance,
    loading,
    error,
    searchQuery,
    filterType,
    pagination,

    // 计算属性
    filteredModels,
    activeModels,
    modelTypes,
    modelStats,

    // 动作
    fetchModels,
    fetchModel,
    addModel,
    editModel,
    removeModel,
    toggleModelStatus,
    runBacktest,
    fetchModelPerformance,
    fetchModelStats,
    searchModelsByQuery,
    fetchModelRankings,
    setSearchQuery,
    setFilterType,
    setPagination,
    clearError,
    clearCurrentModel,
    clearModelPerformance
  }
})