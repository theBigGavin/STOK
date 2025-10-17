
/**
 * 模型数据状态管理Store
 * 管理机器学习模型信息、性能指标、权重配置等功能
 */

import { defineStore } from 'pinia'
import type { ModelInfo } from '~/types/models'
import { modelApi, useCachedModelApi } from '~/api/models'
import { useErrorHandler } from '~/composables/errorHandler'

// 模型性能指标接口
interface ModelPerformance {
  modelId: number
  modelName: string
  metrics: {
    accuracy?: number
    precision?: number
    recall?: number
    f1Score?: number
    totalReturn?: number
    sharpeRatio?: number
    maxDrawdown?: number
    winRate?: number
  }
  lastUpdated: string
  dataPoints: number
}

// 模型权重配置接口
interface ModelWeightConfig {
  modelId: number
  weight: number
  isActive: boolean
  reason?: string
}

// 模型训练状态接口
interface ModelTrainingStatus {
  trainingId: string
  modelId: number
  status: 'pending' | 'training' | 'completed' | 'failed'
  progress?: number
  estimatedCompletion?: string
  message?: string
}

// 模型状态接口
interface ModelState {
  // 模型列表
  models: ModelInfo[]
  // 模型性能指标缓存
  modelPerformance: Map<number, ModelPerformance>
  // 加载状态
  loading: boolean
  // 错误信息
  error: string | null
  // 选中的模型
  selectedModel: ModelInfo | null
  // 模型筛选条件
  filters: {
    modelType: string | null
    activeOnly: boolean
    searchQuery: string
  }
  // 模型权重配置
  weightConfigs: ModelWeightConfig[]
  // 训练状态
  trainingStatus: Map<string, ModelTrainingStatus>
  // 模型统计
  stats: {
    totalModels: number
    activeModels: number
    technicalModels: number
    mlModels: number
    dlModels: number
    avgAccuracy: number
    bestModel: ModelInfo | null
  }
}

/**
 * 模型数据状态管理Store
 */
export const useModelStore = defineStore('models', () => {
  const { handleApiError } = useErrorHandler()
  const cachedModelApi = useCachedModelApi()

  // 状态定义
  const state = reactive<ModelState>({
    models: [],
    modelPerformance: new Map(),
    loading: false,
    error: null,
    selectedModel: null,
    filters: {
      modelType: null,
      activeOnly: true,
      searchQuery: ''
    },
    weightConfigs: [],
    trainingStatus: new Map(),
    stats: {
      totalModels: 0,
      activeModels: 0,
      technicalModels: 0,
      mlModels: 0,
      dlModels: 0,
      avgAccuracy: 0,
      bestModel: null
    }
  })

  // 计算属性
  const computedState = {
    // 活跃模型列表
    activeModels: computed(() => 
      state.models.filter(model => model.isActive)
    ),

    // 筛选后的模型列表
    filteredModels: computed(() => {
      let filtered = state.models

      // 按模型类型筛选
      if (state.filters.modelType) {
        filtered = filtered.filter(model => model.modelType === state.filters.modelType)
      }

      // 按活跃状态筛选
      if (state.filters.activeOnly) {
        filtered = filtered.filter(model => model.isActive)
      }

      // 按搜索查询筛选
      if (state.filters.searchQuery) {
        const query = state.filters.searchQuery.toLowerCase()
        filtered = filtered.filter(model => 
          model.name.toLowerCase().includes(query) || 
          (model.description && model.description.toLowerCase().includes(query))
        )
      }

      return filtered
    }),

    // 按类型分组的模型
    modelsByType: computed(() => {
      const grouped: Record<string, ModelInfo[]> = {}
      state.models.forEach(model => {
        const type = model.modelType
        if (!grouped[type]) {
          grouped[type] = []
        }
        grouped[type].push(model)
      })
      return grouped
    }),

    // 选中的模型性能指标
    selectedModelPerformance: computed(() => {
      if (!state.selectedModel) return null
      return state.modelPerformance.get(state.selectedModel.modelId) || null
    }),

    // 模型性能排名
    modelRankings: computed(() => {
      const modelsWithPerformance = state.models.map(model => {
        const performance = state.modelPerformance.get(model.modelId)
        return {
          ...model,
          performance,
          score: privateMethods.calculateModelScore(model, performance)
        }
      })

      return modelsWithPerformance
        .filter(model => model.score > 0)
        .sort((a, b) => b.score - a.score)
    }),

    // 正在训练的模型
    trainingModels: computed(() => 
      Array.from(state.trainingStatus.values()).filter(status => 
        status.status === 'pending' || status.status === 'training'
      )
    ),

    // 模型权重总和（用于验证）
    totalWeight: computed(() => 
      state.weightConfigs
        .filter(config => config.isActive)
        .reduce((sum, config) => sum + config.weight, 0)
    ),

    // 是否有权重配置错误
    hasWeightError: computed(() => {
      const activeWeights = state.weightConfigs
        .filter(config => config.isActive)
        .map(config => config.weight)
      
      if (activeWeights.length === 0) return false
      
      const total = activeWeights.reduce((sum, weight) => sum + weight, 0)
      return Math.abs(total - 1) > 0.01 // 允许1%的误差
    })
  }

  // 私有方法
  const privateMethods = {
    /**
     * 计算模型综合评分
     */
    calculateModelScore(model: ModelInfo, performance?: ModelPerformance): number {
      if (!performance) return 0

      const metrics = performance.metrics
      let score = 0

      // 基于准确率
      if (metrics.accuracy) score += metrics.accuracy * 0.3
      // 基于总回报
      if (metrics.totalReturn) score += Math.max(0, metrics.totalReturn) * 0.3
      // 基于夏普比率
      if (metrics.sharpeRatio) score += Math.max(0, metrics.sharpeRatio) * 0.2
      // 基于胜率
      if (metrics.winRate) score += metrics.winRate * 0.2

      return score
    },

    /**
     * 更新模型统计信息
     */
    updateStats() {
      const totalModels = state.models.length
      const activeModels = state.models.filter(model => model.isActive).length
      
      const technicalModels = state.models.filter(model => model.modelType === 'technical').length
      const mlModels = state.models.filter(model => model.modelType === 'ml').length
      const dlModels = state.models.filter(model => model.modelType === 'dl').length

      // 计算平均准确率
      const modelsWithAccuracy = state.models.filter(model => 
        model.performanceMetrics?.accuracy !== undefined
      )
      const avgAccuracy = modelsWithAccuracy.length > 0 
        ? modelsWithAccuracy.reduce((sum, model) => 
            sum + (model.performanceMetrics?.accuracy || 0), 0) / modelsWithAccuracy.length
        : 0

      // 找出最佳模型
      const bestModel = state.models
        .filter(model => model.performanceMetrics?.accuracy !== undefined)
        .sort((a, b) => (b.performanceMetrics?.accuracy || 0) - (a.performanceMetrics?.accuracy || 0))[0] || null

      state.stats = {
        totalModels,
        activeModels,
        technicalModels,
        mlModels,
        dlModels,
        avgAccuracy,
        bestModel
      }
    }
  }

  // Actions
  const actions = {
    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      state.loading = loading
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      state.error = error
    },

    /**
     * 清除错误信息
     */
    clearError() {
      state.error = null
    },

    /**
     * 设置筛选条件
     */
    setFilters(filters: Partial<ModelState['filters']>) {
      state.filters = { ...state.filters, ...filters }
    },

    /**
     * 重置筛选条件
     */
    resetFilters() {
      state.filters = {
        modelType: null,
        activeOnly: true,
        searchQuery: ''
      }
    },

    /**
     * 选择模型
     */
    selectModel(model: ModelInfo | null) {
      state.selectedModel = model
    },

    /**
     * 获取所有模型列表
     */
    async fetchModels() {
      state.loading = true
      state.error = null

      try {
        const models = await modelApi.getModels()
        state.models = models
        privateMethods.updateStats()
        return models
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取所有模型列表（带缓存）
     */
    async fetchModelsCached() {
      state.loading = true
      state.error = null

      try {
        const models = await cachedModelApi.getModels()
        state.models = models
        privateMethods.updateStats()
        return models
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取活跃模型列表
     */
    async fetchActiveModels() {
      state.loading = true
      state.error = null

      try {
        const models = await modelApi.getActiveModels()
        state.models = models
        privateMethods.updateStats()
        return models
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取活跃模型列表（带缓存）
     */
    async fetchActiveModelsCached() {
      state.loading = true
      state.error = null

      try {
        const models = await cachedModelApi.getActiveModels()
        state.models = models
        privateMethods.updateStats()
        return models
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取模型详情
     */
    async fetchModelDetail(modelId: number) {
      state.loading = true
      state.error = null

      try {
        const model = await modelApi.getModelDetail(modelId)
        
        // 更新模型列表中的信息
        const index = state.models.findIndex(m => m.modelId === modelId)
        if (index !== -1) {
          state.models[index] = model
        } else {
          state.models.push(model)
        }
        
        privateMethods.updateStats()
        return model
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取模型详情（带缓存）
     */
    async fetchModelDetailCached(modelId: number) {
      state.loading = true
      state.error = null

      try {
        const model = await cachedModelApi.getModelDetail(modelId)
        
        // 更新模型列表中的信息
        const index = state.models.findIndex(m => m.modelId === modelId)
        if (index !== -1) {
          state.models[index] = model
        } else {
          state.models.push(model)
        }
        
        privateMethods.updateStats()
        return model
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取模型性能指标
     */
    async fetchModelPerformance(modelId: number) {
      state.loading = true
      state.error = null

      try {
        const performance = await modelApi.getModelPerformance(modelId)
        state.modelPerformance.set(modelId, performance)
        return performance
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取模型性能指标（带缓存）
     */
    async fetchModelPerformanceCached(modelId: number) {
      state.loading = true
      state.error = null

      try {
        const performance = await cachedModelApi.getModelPerformance(modelId)
        state.modelPerformance.set(modelId, performance)
        return performance
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取所有模型性能指标
     */
    async fetchAllModelPerformance() {
      state.loading = true
      state.error = null

      try {
        const performanceList = await modelApi.getAllModelPerformance()
        
        // 更新性能指标缓存
        performanceList.forEach(performance => {
          state.modelPerformance.set(performance.modelId, performance)
        })
        
        return performanceList
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取所有模型性能指标（带缓存）
     */
    async fetchAllModelPerformanceCached() {
      state.loading = true
      state.error = null

      try {
        const performanceList = await cachedModelApi.getAllModelPerformance()
        
        // 更新性能指标缓存
        performanceList.forEach(performance => {
          state.modelPerformance.set(performance.modelId, performance)
        })
        
        return performanceList
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 更新模型权重
     */
    async updateModelWeight(modelId: number, weight: number) {
      state.loading = true
      state.error = null

      try {
        const config = await modelApi.updateModelWeight(modelId, weight)
        
        // 更新权重配置
        const existingIndex = state.weightConfigs.findIndex(c => c.modelId === modelId)
        if (existingIndex !== -1) {
          state.weightConfigs[existingIndex] = config
        } else {
          state.weightConfigs.push(config)
        }
        
        // 更新模型列表中的权重
        const modelIndex = state.models.findIndex(m => m.modelId === modelId)
        if (modelIndex !== -1) {
          state.models[modelIndex]!.weight = weight
        }
        
        // 清除相关缓存
        cachedModelApi.clearModelCache()
        
        return config
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 批量更新模型权重
     */
    async updateModelWeights(weights: Record<number, number>) {
      state.loading = true
      state.error = null

      try {
        const configs = await modelApi.updateModelWeights(weights)
        
        // 更新权重配置
        state.weightConfigs = configs
        
        // 更新模型列表中的权重
        Object.entries(weights).forEach(([modelId, weight]) => {
          const id = parseInt(modelId)
          const modelIndex = state.models.findIndex(m => m.modelId === id)
          if (modelIndex !== -1) {
            state.models[modelIndex]!.weight = weight
          }
        })
        
        // 清除相关缓存
        cachedModelApi.clearModelCache()
        
        return configs
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 启用/禁用模型
     */
    async toggleModelActive(modelId: number, isActive: boolean) {
      state.loading = true
      state.error = null

      try {
        const model = await modelApi.toggleModelActive(modelId, isActive)
        
        // 更新模型列表
        const index = state.models.findIndex(m => m.modelId === modelId)
        if (index !== -1) {
          state.models[index] = model
        }
        
        privateMethods.updateStats()
        
        // 清除相关缓存
        cachedModelApi.clearModelCache()
        
        return model
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 重新评估模型性能
     */
    async reevaluateModel(modelId: number) {
      state.loading = true
      state.error = null

      try {
        const performance = await modelApi.reevaluateModel(modelId)
        state.modelPerformance.set(modelId, performance)
        
        // 清除相关缓存
        cachedModelApi.clearModelCache()
        
        return performance
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 清除模型缓存
     */
    clearModelCache() {
      state.modelPerformance.clear()
      state.trainingStatus.clear()
      cachedModelApi.clearModelCache()
    },

    /**
     * 重置模型状态
     */
    reset() {
      state.models = []
      state.modelPerformance.clear()
      state.loading = false
      state.error = null
      state.selectedModel = null
      state.filters = {
        modelType: null,
        activeOnly: true,
        searchQuery: ''
      }
      state.weightConfigs = []
      state.trainingStatus.clear()
      state.stats = {
        totalModels: 0,
        activeModels: 0,
        technicalModels: 0,
        mlModels: 0,
        dlModels: 0,
        avgAccuracy: 0,
        bestModel: null
      }
    }
  }

  // 返回Store内容
  return {
    // 状态
    ...toRefs(state),
    // 计算属性
    ...computedState,
    // Actions
    ...actions
  }
})

// 导出Store类型
export type ModelStore = ReturnType<typeof useModelStore>