import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStocksStore } from '@/store/stocks'
import * as stockApi from '@/api/stocks'
import type { Stock, StockDailyData, StockListParams, StockDataParams } from '@/types/api'
import { createMockStock, createMockStockDailyData, createMockStockDataArray, createMockApiError } from '@/tests/utils/test-utils'

// Mock API 模块
vi.mock('@/api/stocks', () => ({
  getStocks: vi.fn(),
  getStock: vi.fn(),
  getStockData: vi.fn(),
  searchStocks: vi.fn(),
  refreshStockData: vi.fn()
}))

describe('股票 Store', () => {
  let stocksStore: ReturnType<typeof useStocksStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    stocksStore = useStocksStore()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该正确初始化状态', () => {
      expect(stocksStore.stocks).toEqual([])
      expect(stocksStore.currentStock).toBeNull()
      expect(stocksStore.stockData).toEqual([])
      expect(stocksStore.loading).toBe(false)
      expect(stocksStore.error).toBeNull()
      expect(stocksStore.lastUpdated).toBeNull()
      expect(stocksStore.pagination).toEqual({
        current: 1,
        size: 20,
        total: 0,
        skip: 0,
        limit: 20
      })
      expect(stocksStore.filters).toEqual({
        symbol: '',
        market: '',
        industry: '',
        activeOnly: true
      })
      expect(stocksStore.searchQuery).toBe('')
      expect(stocksStore.searchResults).toEqual([])
      expect(stocksStore.searchLoading).toBe(false)
    })

    it('应该正确计算 getters', () => {
      expect(stocksStore.stockList).toEqual([])
      expect(stocksStore.isLoading).toBe(false)
      expect(stocksStore.hasError).toBe(false)
      expect(stocksStore.getError).toBeNull()
      expect(stocksStore.getLastUpdated).toBeNull()
      expect(stocksStore.getPagination).toEqual(stocksStore.pagination)
      expect(stocksStore.getFilters).toEqual(stocksStore.filters)
      expect(stocksStore.getSearchQuery).toBe('')
      expect(stocksStore.getSearchResults).toEqual([])
      expect(stocksStore.isSearchLoading).toBe(false)
      expect(stocksStore.getStockDetail).toBeNull()
      expect(stocksStore.getStockData).toEqual([])
    })
  })

  describe('获取股票列表', () => {
    const mockStocks = [createMockStock(), createMockStock({ id: 2, symbol: 'GOOGL' })]
    const mockResponse = {
      data: mockStocks,
      total: 100,
      skip: 0,
      limit: 20
    }

    it('应该成功获取股票列表', async () => {
      vi.mocked(stockApi.getStocks).mockResolvedValue(mockResponse)

      await stocksStore.fetchStocks()

      expect(stockApi.getStocks).toHaveBeenCalledWith({
        skip: 0,
        limit: 20,
        active_only: true,
        market: ''
      })
      expect(stocksStore.stocks).toEqual(mockStocks)
      expect(stocksStore.pagination.total).toBe(100)
      expect(stocksStore.loading).toBe(false)
      expect(stocksStore.error).toBeNull()
      expect(stocksStore.lastUpdated).toBeInstanceOf(Date)
    })

    it('应该使用自定义参数获取股票列表', async () => {
      vi.mocked(stockApi.getStocks).mockResolvedValue(mockResponse)

      const params: StockListParams = {
        skip: 40,
        limit: 10,
        active_only: false,
        market: 'NASDAQ'
      }

      await stocksStore.fetchStocks(params)

      expect(stockApi.getStocks).toHaveBeenCalledWith(params)
    })

    it('应该处理获取股票列表失败', async () => {
      const error = createMockApiError('获取股票列表失败')
      vi.mocked(stockApi.getStocks).mockRejectedValue(error)

      await stocksStore.fetchStocks()

      expect(stocksStore.error).toBe('获取股票列表失败')
      expect(stocksStore.loading).toBe(false)
      expect(stocksStore.stocks).toEqual([])
    })

    it('应该更新缓存', async () => {
      vi.mocked(stockApi.getStocks).mockResolvedValue(mockResponse)

      await stocksStore.fetchStocks()

      expect(stocksStore.stockCache.get('AAPL')).toEqual(mockStocks[0])
      expect(stocksStore.stockCache.get('GOOGL')).toEqual(mockStocks[1])
    })
  })

  describe('获取股票详情', () => {
    const mockStock = createMockStock()

    it('应该成功获取股票详情', async () => {
      vi.mocked(stockApi.getStock).mockResolvedValue(mockStock)

      const result = await stocksStore.fetchStock('AAPL')

      expect(stockApi.getStock).toHaveBeenCalledWith('AAPL')
      expect(stocksStore.currentStock).toEqual(mockStock)
      expect(result).toEqual(mockStock)
      expect(stocksStore.loading).toBe(false)
      expect(stocksStore.error).toBeNull()
    })

    it('应该从缓存中获取股票详情', async () => {
      stocksStore.stockCache.set('AAPL', mockStock)

      const result = await stocksStore.fetchStock('AAPL')

      expect(stockApi.getStock).not.toHaveBeenCalled()
      expect(stocksStore.currentStock).toEqual(mockStock)
      expect(result).toEqual(mockStock)
    })

    it('应该处理获取股票详情失败', async () => {
      const error = createMockApiError('获取股票详情失败')
      vi.mocked(stockApi.getStock).mockRejectedValue(error)

      await expect(stocksStore.fetchStock('AAPL')).rejects.toThrow()

      expect(stocksStore.error).toBe('获取股票 AAPL 详情失败')
      expect(stocksStore.loading).toBe(false)
    })
  })

  describe('获取股票历史数据', () => {
    const mockStockData = createMockStockDataArray(5)
    const mockResponse = {
      symbol: 'AAPL',
      data: mockStockData,
      metadata: {
        start_date: '2023-01-01',
        end_date: '2023-01-05',
        record_count: 5,
        total_count: 5,
        skip: 0,
        limit: 1000,
        has_more: false
      }
    }

    const params: StockDataParams = {
      start_date: '2023-01-01',
      end_date: '2023-01-05'
    }

    it('应该成功获取股票历史数据', async () => {
      vi.mocked(stockApi.getStockData).mockResolvedValue(mockResponse)

      const result = await stocksStore.fetchStockData('AAPL', params)

      expect(stockApi.getStockData).toHaveBeenCalledWith('AAPL', params)
      expect(stocksStore.stockData).toEqual(mockStockData)
      expect(result).toEqual(mockStockData)
      expect(stocksStore.loading).toBe(false)
      expect(stocksStore.error).toBeNull()
    })

    it('应该从缓存中获取股票历史数据', async () => {
      const cacheKey = 'AAPL_2023-01-01_2023-01-05'
      stocksStore.dataCache.set(cacheKey, mockStockData)

      const result = await stocksStore.fetchStockData('AAPL', params)

      expect(stockApi.getStockData).not.toHaveBeenCalled()
      expect(stocksStore.stockData).toEqual(mockStockData)
      expect(result).toEqual(mockStockData)
    })

    it('应该处理获取股票历史数据失败', async () => {
      const error = createMockApiError('获取历史数据失败')
      vi.mocked(stockApi.getStockData).mockRejectedValue(error)

      await expect(stocksStore.fetchStockData('AAPL', params)).rejects.toThrow()

      expect(stocksStore.error).toBe('获取股票 AAPL 历史数据失败')
      expect(stocksStore.loading).toBe(false)
    })
  })

  describe('搜索股票', () => {
    const mockStocks = [createMockStock(), createMockStock({ id: 2, symbol: 'GOOGL' })]

    it('应该成功搜索股票', async () => {
      vi.mocked(stockApi.searchStocks).mockResolvedValue(mockStocks)

      await stocksStore.searchStocks('Apple', 10)

      expect(stockApi.searchStocks).toHaveBeenCalledWith('Apple', 10)
      expect(stocksStore.searchResults).toEqual(mockStocks)
      expect(stocksStore.searchQuery).toBe('Apple')
      expect(stocksStore.searchLoading).toBe(false)
    })

    it('应该处理空查询', async () => {
      await stocksStore.searchStocks('', 10)

      expect(stockApi.searchStocks).not.toHaveBeenCalled()
      expect(stocksStore.searchResults).toEqual([])
    })

    it('应该处理搜索失败', async () => {
      vi.mocked(stockApi.searchStocks).mockRejectedValue(new Error('搜索失败'))

      await stocksStore.searchStocks('Apple', 10)

      expect(stocksStore.searchResults).toEqual([])
      expect(stocksStore.searchLoading).toBe(false)
    })

    it('应该更新搜索缓存', async () => {
      vi.mocked(stockApi.searchStocks).mockResolvedValue(mockStocks)

      await stocksStore.searchStocks('Apple', 10)

      expect(stocksStore.stockCache.get('AAPL')).toEqual(mockStocks[0])
      expect(stocksStore.stockCache.get('GOOGL')).toEqual(mockStocks[1])
    })
  })

  describe('刷新股票数据', () => {
    const mockResponse = {
      symbol: 'AAPL',
      updated_records: 10,
      status: 'completed' as const
    }

    it('应该成功刷新股票数据', async () => {
      vi.mocked(stockApi.refreshStockData).mockResolvedValue(mockResponse)

      const result = await stocksStore.refreshStockData('AAPL')

      expect(stockApi.refreshStockData).toHaveBeenCalledWith('AAPL')
      expect(result).toEqual(mockResponse)
      expect(stocksStore.loading).toBe(false)
      expect(stocksStore.error).toBeNull()
    })

    it('应该清除相关缓存', async () => {
      vi.mocked(stockApi.refreshStockData).mockResolvedValue(mockResponse)

      // 设置一些缓存数据
      stocksStore.stockCache.set('AAPL', createMockStock())
      stocksStore.dataCache.set('AAPL_2023-01-01_2023-01-31', createMockStockDataArray(5))

      await stocksStore.refreshStockData('AAPL')

      expect(stocksStore.stockCache.get('AAPL')).toBeUndefined()
      expect(stocksStore.dataCache.get('AAPL_2023-01-01_2023-01-31')).toBeUndefined()
    })

    it('应该处理刷新失败', async () => {
      const error = createMockApiError('刷新失败')
      vi.mocked(stockApi.refreshStockData).mockRejectedValue(error)

      await expect(stocksStore.refreshStockData('AAPL')).rejects.toThrow()

      expect(stocksStore.error).toBe('刷新股票 AAPL 数据失败')
      expect(stocksStore.loading).toBe(false)
    })
  })

  describe('筛选和分页', () => {
    it('应该更新筛选条件', () => {
      const newFilters = {
        symbol: 'AAPL',
        market: 'NASDAQ',
        industry: 'Technology',
        activeOnly: false
      }

      stocksStore.updateFilters(newFilters)

      expect(stocksStore.filters).toEqual(newFilters)
      expect(stocksStore.pagination.current).toBe(1)
      expect(stocksStore.pagination.skip).toBe(0)
    })

    it('应该更新分页', () => {
      stocksStore.updatePagination(2, 50)

      expect(stocksStore.pagination.current).toBe(2)
      expect(stocksStore.pagination.size).toBe(50)
      expect(stocksStore.pagination.limit).toBe(50)
      expect(stocksStore.pagination.skip).toBe(50)
    })

    it('应该只更新页码', () => {
      stocksStore.updatePagination(3)

      expect(stocksStore.pagination.current).toBe(3)
      expect(stocksStore.pagination.size).toBe(20) // 保持不变
      expect(stocksStore.pagination.skip).toBe(40)
    })
  })

  describe('状态管理', () => {
    it('应该清除错误', () => {
      stocksStore.error = '测试错误'
      stocksStore.clearError()

      expect(stocksStore.error).toBeNull()
    })

    it('应该清除搜索', () => {
      stocksStore.searchQuery = 'Apple'
      stocksStore.searchResults = [createMockStock()]
      stocksStore.clearSearch()

      expect(stocksStore.searchQuery).toBe('')
      expect(stocksStore.searchResults).toEqual([])
    })

    it('应该清除缓存', () => {
      stocksStore.stockCache.set('AAPL', createMockStock())
      stocksStore.dataCache.set('key', createMockStockDataArray(5))
      stocksStore.lastUpdated = new Date()

      stocksStore.clearCache()

      expect(stocksStore.stockCache.size).toBe(0)
      expect(stocksStore.dataCache.size).toBe(0)
      expect(stocksStore.lastUpdated).toBeNull()
    })

    it('应该重置状态', () => {
      // 设置一些状态
      stocksStore.stocks = [createMockStock()]
      stocksStore.currentStock = createMockStock()
      stocksStore.stockData = createMockStockDataArray(5)
      stocksStore.loading = true
      stocksStore.error = '测试错误'
      stocksStore.lastUpdated = new Date()
      stocksStore.pagination = { current: 2, size: 50, total: 100, skip: 50, limit: 50 }
      stocksStore.filters = { symbol: 'AAPL', market: 'NASDAQ', industry: 'Tech', activeOnly: false }
      stocksStore.searchQuery = 'Apple'
      stocksStore.searchResults = [createMockStock()]
      stocksStore.searchLoading = true
      stocksStore.stockCache.set('AAPL', createMockStock())
      stocksStore.dataCache.set('key', createMockStockDataArray(5))

      stocksStore.reset()

      // 验证状态已重置
      expect(stocksStore.stocks).toEqual([])
      expect(stocksStore.currentStock).toBeNull()
      expect(stocksStore.stockData).toEqual([])
      expect(stocksStore.loading).toBe(false)
      expect(stocksStore.error).toBeNull()
      expect(stocksStore.lastUpdated).toBeNull()
      expect(stocksStore.pagination).toEqual({
        current: 1,
        size: 20,
        total: 0,
        skip: 0,
        limit: 20
      })
      expect(stocksStore.filters).toEqual({
        symbol: '',
        market: '',
        industry: '',
        activeOnly: true
      })
      expect(stocksStore.searchQuery).toBe('')
      expect(stocksStore.searchResults).toEqual([])
      expect(stocksStore.searchLoading).toBe(false)
      expect(stocksStore.stockCache.size).toBe(0)
      expect(stocksStore.dataCache.size).toBe(0)
    })
  })

  describe('缓存机制', () => {
    it('应该正确使用股票缓存', async () => {
      const mockStock = createMockStock()
      vi.mocked(stockApi.getStock).mockResolvedValue(mockStock)

      // 第一次调用 - 从 API 获取
      await stocksStore.fetchStock('AAPL')
      expect(stockApi.getStock).toHaveBeenCalledTimes(1)

      // 第二次调用 - 从缓存获取
      await stocksStore.fetchStock('AAPL')
      expect(stockApi.getStock).toHaveBeenCalledTimes(1) // 没有再次调用
    })

    it('应该正确使用数据缓存', async () => {
      const mockData = createMockStockDataArray(5)
      const mockResponse = {
        symbol: 'AAPL',
        data: mockData,
        metadata: {} as any
      }
      vi.mocked(stockApi.getStockData).mockResolvedValue(mockResponse)

      const params: StockDataParams = {
        start_date: '2023-01-01',
        end_date: '2023-01-05'
      }

      // 第一次调用 - 从 API 获取
      await stocksStore.fetchStockData('AAPL', params)
      expect(stockApi.getStockData).toHaveBeenCalledTimes(1)

      // 第二次调用 - 从缓存获取
      await stocksStore.fetchStockData('AAPL', params)
      expect(stockApi.getStockData).toHaveBeenCalledTimes(1) // 没有再次调用
    })
  })
})