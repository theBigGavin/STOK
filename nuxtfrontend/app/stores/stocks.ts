/**
 * 股票数据状态管理Store
 * 管理股票基本信息、日线数据、搜索和筛选功能
 */

import { defineStore } from 'pinia'
import type { StockInfo, StockDailyData } from '~/types/stocks'
import type { StockQueryParams } from '~/types/query'
import type { PaginatedResponse } from '~/types/api'
import { stockApi, useCachedStockApi } from '~/api/stocks'
import { useErrorHandler } from '~/composables/errorHandler'

// Nuxt运行时配置
const isClient = typeof window !== 'undefined'

// 股票状态接口
interface StockState {
  // 股票列表
  stocks: StockInfo[]
  // 股票日线数据缓存
  stockData: Map<string, StockDailyData[]>
  // 加载状态
  loading: boolean
  // 错误信息
  error: string | null
  // 分页信息
  pagination: {
    total: number
    skip: number
    limit: number
    hasMore: boolean
  }
  // 搜索历史
  searchHistory: string[]
  // 选中的股票
  selectedStock: StockInfo | null
  // 股票筛选条件
  filters: {
    market: string | null
    activeOnly: boolean
    searchQuery: string
  }
}

/**
 * 股票数据状态管理Store
 */
export const useStockStore = defineStore('stocks', () => {
  const { handleApiError } = useErrorHandler()
  const cachedStockApi = useCachedStockApi()

  // 状态定义
  const state = reactive<StockState>({
    stocks: [],
    stockData: new Map(),
    loading: false,
    error: null,
    pagination: {
      total: 0,
      skip: 0,
      limit: 50,
      hasMore: false
    },
    searchHistory: [],
    selectedStock: null,
    filters: {
      market: null,
      activeOnly: true,
      searchQuery: ''
    }
  })

  // 计算属性
  const computedState = {
    // 活跃股票列表
    activeStocks: computed(() => 
      state.stocks.filter(stock => stock.isActive)
    ),

    // 筛选后的股票列表
    filteredStocks: computed(() => {
      let filtered = state.stocks

      // 按市场筛选
      if (state.filters.market) {
        filtered = filtered.filter(stock => stock.market === state.filters.market)
      }

      // 按活跃状态筛选
      if (state.filters.activeOnly) {
        filtered = filtered.filter(stock => stock.isActive)
      }

      // 按搜索查询筛选
      if (state.filters.searchQuery) {
        const query = state.filters.searchQuery.toLowerCase()
        filtered = filtered.filter(stock => 
          stock.symbol.toLowerCase().includes(query) || 
          stock.name.toLowerCase().includes(query)
        )
      }

      return filtered
    }),

    // 按市场分组的股票
    stocksByMarket: computed(() => {
      const grouped: Record<string, StockInfo[]> = {}
      state.stocks.forEach(stock => {
        const market = stock.market
        if (!grouped[market]) {
          grouped[market] = []
        }
        grouped[market].push(stock)
      })
      return grouped
    }),

    // 最近搜索的关键词
    recentSearches: computed(() => 
      state.searchHistory.slice(0, 10)
    ),

    // 是否有更多数据可加载
    canLoadMore: computed(() => state.pagination.hasMore),

    // 选中的股票数据
    selectedStockData: computed(() => {
      if (!state.selectedStock) return null
      return state.stockData.get(state.selectedStock.symbol) || null
    })
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
    setFilters(filters: Partial<StockState['filters']>) {
      state.filters = { ...state.filters, ...filters }
    },

    /**
     * 重置筛选条件
     */
    resetFilters() {
      state.filters = {
        market: null,
        activeOnly: true,
        searchQuery: ''
      }
    },

    /**
     * 选择股票
     */
    selectStock(stock: StockInfo | null) {
      state.selectedStock = stock
    },

    /**
     * 获取股票列表
     */
    async fetchStocks(params?: StockQueryParams) {
      state.loading = true
      state.error = null

      try {
        const response: PaginatedResponse<StockInfo> = await stockApi.getStocks(params)
        
        state.stocks = response.data
        state.pagination = {
          total: response.total,
          skip: response.skip || 0,
          limit: response.limit || 50,
          hasMore: (response.skip || 0) + (response.limit || 50) < response.total
        }
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取股票列表（带缓存）
     */
    async fetchStocksCached(params?: StockQueryParams) {
      state.loading = true
      state.error = null

      try {
        const response: PaginatedResponse<StockInfo> = await cachedStockApi.getStocks(params)
        
        state.stocks = response.data
        state.pagination = {
          total: response.total,
          skip: response.skip || 0,
          limit: response.limit || 50,
          hasMore: (response.skip || 0) + (response.limit || 50) < response.total
        }
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 加载更多股票
     */
    async loadMoreStocks() {
      if (!state.pagination.hasMore || state.loading) return

      const nextSkip = state.pagination.skip + state.pagination.limit
      
      try {
        const response: PaginatedResponse<StockInfo> = await stockApi.getStocks({
          skip: nextSkip,
          limit: state.pagination.limit
        })

        state.stocks = [...state.stocks, ...response.data]
        state.pagination = {
          total: response.total,
          skip: nextSkip,
          limit: state.pagination.limit,
          hasMore: nextSkip + state.pagination.limit < response.total
        }
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      }
    },

    /**
     * 获取股票日线数据
     */
    async fetchStockData(symbol: string, startDate: string, endDate: string) {
      state.loading = true
      state.error = null

      try {
        const response = await stockApi.getStockData(symbol, startDate, endDate)
        state.stockData.set(symbol, response.data)
        return response.data
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取股票日线数据（带缓存）
     */
    async fetchStockDataCached(symbol: string, startDate: string, endDate: string) {
      state.loading = true
      state.error = null

      try {
        const response = await cachedStockApi.getStockData(symbol, startDate, endDate)
        state.stockData.set(symbol, response.data)
        return response.data
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 搜索股票
     */
    async searchStocks(query: string, limit: number = 10) {
      if (!query.trim()) {
        return []
      }

      state.loading = true
      state.error = null

      try {
        const results = await stockApi.searchStocks(query, limit)
        
        // 添加到搜索历史
        this.addToSearchHistory(query)
        
        return results
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 添加到搜索历史
     */
    addToSearchHistory(query: string) {
      // 移除重复项
      state.searchHistory = state.searchHistory.filter(item => item !== query)
      // 添加到开头
      state.searchHistory.unshift(query)
      // 限制数量
      if (state.searchHistory.length > 20) {
        state.searchHistory = state.searchHistory.slice(0, 20)
      }
      // 保存到本地存储
      if (isClient) {
        localStorage.setItem('stock-search-history', JSON.stringify(state.searchHistory))
      }
    },

    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
      if (isClient) {
        const savedHistory = localStorage.getItem('stock-search-history')
        if (savedHistory) {
          try {
            state.searchHistory = JSON.parse(savedHistory)
          } catch (error) {
            console.error('加载搜索历史失败:', error)
          }
        }
      }
    },

    /**
     * 清除搜索历史
     */
    clearSearchHistory() {
      state.searchHistory = []
      if (isClient) {
        localStorage.removeItem('stock-search-history')
      }
    },

    /**
     * 刷新股票数据
     */
    async refreshStockData(symbol: string) {
      state.loading = true
      state.error = null

      try {
        const response = await stockApi.refreshStockData(symbol)
        
        // 清除相关缓存
        cachedStockApi.clearStockCache()
        
        return response
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 批量获取股票数据
     */
    async fetchBatchStockData(
      symbols: string[], 
      startDate: string, 
      endDate: string
    ) {
      state.loading = true
      state.error = null

      try {
        const response = await stockApi.getBatchStockData(symbols, startDate, endDate)
        
        // 更新缓存
        Object.entries(response).forEach(([symbol, data]) => {
          state.stockData.set(symbol, data)
        })
        
        return response
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 获取股票基本信息
     */
    async fetchStockInfo(symbol: string) {
      state.loading = true
      state.error = null

      try {
        const stockInfo = await stockApi.getStockInfo(symbol)
        
        // 更新股票列表中的信息
        const index = state.stocks.findIndex(stock => stock.symbol === symbol)
        if (index !== -1) {
          state.stocks[index] = stockInfo
        }
        
        return stockInfo
      } catch (error) {
        state.error = handleApiError(error).message
        throw error
      } finally {
        state.loading = false
      }
    },

    /**
     * 清除股票数据缓存
     */
    clearStockDataCache() {
      state.stockData.clear()
      cachedStockApi.clearStockCache()
    },

    /**
     * 重置股票状态
     */
    reset() {
      state.stocks = []
      state.stockData.clear()
      state.loading = false
      state.error = null
      state.pagination = {
        total: 0,
        skip: 0,
        limit: 50,
        hasMore: false
      }
      state.selectedStock = null
      state.filters = {
        market: null,
        activeOnly: true,
        searchQuery: ''
      }
    },

    /**
     * 初始化股票状态
     */
    initialize() {
      this.loadSearchHistory()
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
export type StockStore = ReturnType<typeof useStockStore>