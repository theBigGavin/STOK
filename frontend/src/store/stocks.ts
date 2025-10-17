import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as stockApi from '@/api/stocks'
import type {
  Stock,
  StockDailyData,
  StockDataResponse,
  StockListParams,
  StockDataParams
} from '@/types/api'

// 股票状态管理
export const useStocksStore = defineStore('stocks', () => {
  // 状态
  const stocks = ref<Stock[]>([])
  const currentStock = ref<Stock | null>(null)
  const stockData = ref<StockDailyData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 分页状态
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0,
    skip: 0,
    limit: 20
  })

  // 筛选状态
  const filters = ref({
    symbol: '',
    market: '',
    industry: '',
    activeOnly: true
  })

  // 搜索状态
  const searchQuery = ref('')
  const searchResults = ref<Stock[]>([])
  const searchLoading = ref(false)

  // 缓存状态
  const stockCache = ref<Map<string, Stock>>(new Map())
  const dataCache = ref<Map<string, StockDailyData[]>>(new Map())

  // Getters
  const stockList = computed(() => stocks.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const getError = computed(() => error.value)
  const getLastUpdated = computed(() => lastUpdated.value)
  const getPagination = computed(() => pagination.value)
  const getFilters = computed(() => filters.value)
  const getSearchQuery = computed(() => searchQuery.value)
  const getSearchResults = computed(() => searchResults.value)
  const isSearchLoading = computed(() => searchLoading.value)

  // 获取股票详情
  const getStockDetail = computed(() => currentStock.value)
  const getStockData = computed(() => stockData.value)

  // Actions

  // 获取股票列表
  const fetchStocks = async (params?: StockListParams) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await stockApi.getStocks({
        skip: params?.skip || pagination.value.skip,
        limit: params?.limit || pagination.value.limit,
        active_only: params?.active_only ?? filters.value.activeOnly,
        market: params?.market || filters.value.market
      })

      stocks.value = response.data
      pagination.value.total = response.total
      pagination.value.skip = response.skip
      pagination.value.limit = response.limit
      
      // 更新缓存
      response.data.forEach(stock => {
        stockCache.value.set(stock.symbol, stock)
      })
      
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取股票列表失败'
      console.error('获取股票列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取股票详情
  const fetchStock = async (symbol: string) => {
    // 检查缓存
    const cachedStock = stockCache.value.get(symbol)
    if (cachedStock) {
      currentStock.value = cachedStock
      return cachedStock
    }

    loading.value = true
    error.value = null
    
    try {
      const stock = await stockApi.getStock(symbol)
      currentStock.value = stock
      stockCache.value.set(symbol, stock)
      lastUpdated.value = new Date()
      return stock
    } catch (err) {
      error.value = err instanceof Error ? err.message : `获取股票 ${symbol} 详情失败`
      console.error(`获取股票 ${symbol} 详情失败:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取股票历史数据
  const fetchStockData = async (symbol: string, params: StockDataParams) => {
    const cacheKey = `${symbol}_${params.start_date}_${params.end_date}`
    
    // 检查缓存
    const cachedData = dataCache.value.get(cacheKey)
    if (cachedData) {
      stockData.value = cachedData
      return cachedData
    }

    loading.value = true
    error.value = null
    
    try {
      const response = await stockApi.getStockData(symbol, params)
      stockData.value = response.data
      dataCache.value.set(cacheKey, response.data)
      lastUpdated.value = new Date()
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : `获取股票 ${symbol} 历史数据失败`
      console.error(`获取股票 ${symbol} 历史数据失败:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 搜索股票
  const searchStocks = async (query: string, limit: number = 20) => {
    if (!query.trim()) {
      searchResults.value = []
      return
    }

    searchLoading.value = true
    searchQuery.value = query
    
    try {
      const results = await stockApi.searchStocks(query, limit)
      searchResults.value = results
      
      // 更新缓存
      results.forEach(stock => {
        stockCache.value.set(stock.symbol, stock)
      })
    } catch (err) {
      console.error('搜索股票失败:', err)
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  // 刷新股票数据
  const refreshStockData = async (symbol: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await stockApi.refreshStockData(symbol)
      lastUpdated.value = new Date()
      
      // 清除相关缓存
      stockCache.value.delete(symbol)
      dataCache.value.forEach((_, key: string) => {
        if (key.startsWith(symbol)) {
          dataCache.value.delete(key)
        }
      })
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : `刷新股票 ${symbol} 数据失败`
      console.error(`刷新股票 ${symbol} 数据失败:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新筛选条件
  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    Object.assign(filters.value, newFilters)
    pagination.value.current = 1
    pagination.value.skip = 0
  }

  // 更新分页
  const updatePagination = (page: number, size?: number) => {
    pagination.value.current = page
    if (size) {
      pagination.value.size = size
      pagination.value.limit = size
    }
    pagination.value.skip = (page - 1) * pagination.value.size
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 清除搜索
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
  }

  // 清除缓存
  const clearCache = () => {
    stockCache.value.clear()
    dataCache.value.clear()
    lastUpdated.value = null
  }

  // 重置状态
  const reset = () => {
    stocks.value = []
    currentStock.value = null
    stockData.value = []
    loading.value = false
    error.value = null
    lastUpdated.value = null
    pagination.value = {
      current: 1,
      size: 20,
      total: 0,
      skip: 0,
      limit: 20
    }
    filters.value = {
      symbol: '',
      market: '',
      industry: '',
      activeOnly: true
    }
    searchQuery.value = ''
    searchResults.value = []
    searchLoading.value = false
    clearCache()
  }

  return {
    // State
    stocks,
    currentStock,
    stockData,
    loading,
    error,
    lastUpdated,
    pagination,
    filters,
    searchQuery,
    searchResults,
    searchLoading,
    
    // Getters
    stockList,
    isLoading,
    hasError,
    getError,
    getLastUpdated,
    getPagination,
    getFilters,
    getSearchQuery,
    getSearchResults,
    isSearchLoading,
    getStockDetail,
    getStockData,
    
    // Actions
    fetchStocks,
    fetchStock,
    fetchStockData,
    searchStocks,
    refreshStockData,
    updateFilters,
    updatePagination,
    clearError,
    clearSearch,
    clearCache,
    reset
  }
})

export default useStocksStore