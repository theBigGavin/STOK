import { http } from './index'
import type {
  Stock,
  StockDailyData,
  StockDataResponse,
  StockRefreshResponse,
  ApiResponse,
  PaginatedResponse,
  StockListParams,
  StockDataParams
} from '@/types/api'

/**
 * 股票数据 API 服务
 */

// 获取股票列表
export const getStocks = async (params?: StockListParams): Promise<PaginatedResponse<Stock>> => {
  try {
    const response = await http.get<PaginatedResponse<Stock>>('/api/v1/stocks', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 100,
        active_only: params?.active_only ?? true,
        market: params?.market
      }
    })
    return response
  } catch (error) {
    console.error('获取股票列表失败:', error)
    throw error
  }
}

// 获取股票详情
export const getStock = async (symbol: string): Promise<Stock> => {
  try {
    const response = await http.get<Stock>(`/api/v1/stocks/${symbol}`)
    return response
  } catch (error) {
    console.error(`获取股票 ${symbol} 详情失败:`, error)
    throw error
  }
}

// 获取股票历史数据
export const getStockData = async (
  symbol: string,
  params: StockDataParams
): Promise<StockDataResponse> => {
  try {
    const response = await http.get<StockDataResponse>(
      `/api/v1/stocks/${symbol}/data`,
      {
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          include_features: params.include_features || false,
          skip: params.skip || 0,
          limit: params.limit || 1000
        }
      }
    )
    return response
  } catch (error) {
    console.error(`获取股票 ${symbol} 历史数据失败:`, error)
    throw error
  }
}

// 获取最新股票数据
export const getLatestStockData = async (symbol: string): Promise<StockDailyData> => {
  try {
    const response = await http.get<{ latest_data: StockDailyData }>(
      `/api/v1/stocks/${symbol}/latest`
    )
    return response.latest_data
  } catch (error) {
    console.error(`获取股票 ${symbol} 最新数据失败:`, error)
    throw error
  }
}

// 刷新股票数据
export const refreshStockData = async (symbol: string): Promise<StockRefreshResponse> => {
  try {
    const response = await http.post<StockRefreshResponse>(
      `/api/v1/stocks/${symbol}/refresh`
    )
    return response
  } catch (error) {
    console.error(`刷新股票 ${symbol} 数据失败:`, error)
    throw error
  }
}

// 创建股票
export const createStock = async (stockData: {
  symbol: string
  name: string
  market: string
  industry?: string
}): Promise<Stock> => {
  try {
    const response = await http.post<Stock>('/api/v1/stocks', stockData)
    return response
  } catch (error) {
    console.error('创建股票失败:', error)
    throw error
  }
}

// 更新股票信息
export const updateStock = async (
  symbol: string,
  updateData: {
    name?: string
    market?: string
    industry?: string
    is_active?: boolean
  }
): Promise<Stock> => {
  try {
    const response = await http.put<Stock>(`/api/v1/stocks/${symbol}`, updateData)
    return response
  } catch (error) {
    console.error(`更新股票 ${symbol} 信息失败:`, error)
    throw error
  }
}

// 删除股票（软删除）
export const deleteStock = async (symbol: string): Promise<void> => {
  try {
    await http.delete(`/api/v1/stocks/${symbol}`)
  } catch (error) {
    console.error(`删除股票 ${symbol} 失败:`, error)
    throw error
  }
}

// 创建股票日线数据
export const createStockData = async (
  symbol: string,
  data: {
    trade_date: string
    open_price: number
    high_price: number
    low_price: number
    close_price: number
    volume: number
    turnover?: number
  }
): Promise<StockDailyData> => {
  try {
    const response = await http.post<StockDailyData>(
      `/api/v1/stocks/${symbol}/data`,
      data
    )
    return response
  } catch (error) {
    console.error(`创建股票 ${symbol} 日线数据失败:`, error)
    throw error
  }
}

// 批量获取股票数据
export const getBatchStockData = async (
  symbols: string[],
  params: Omit<StockDataParams, 'start_date' | 'end_date'> & {
    start_date: string
    end_date: string
  }
): Promise<Record<string, StockDataResponse>> => {
  try {
    const promises = symbols.map(symbol =>
      getStockData(symbol, params).catch(error => {
        console.error(`获取股票 ${symbol} 数据失败:`, error)
        return null
      })
    )

    const results = await Promise.all(promises)
    const data: Record<string, StockDataResponse> = {}

    results.forEach((result: StockDataResponse | null, index: number) => {
      if (result) {
        data[symbols[index]] = result
      }
    })

    return data
  } catch (error) {
    console.error('批量获取股票数据失败:', error)
    throw error
  }
}

// 搜索股票
export const searchStocks = async (query: string, limit: number = 20): Promise<Stock[]> => {
  try {
    const stocks = await getStocks({ limit: 1000, active_only: true })
    const filteredStocks = stocks.data.filter(
      stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
    )
    return filteredStocks.slice(0, limit)
  } catch (error) {
    console.error('搜索股票失败:', error)
    throw error
  }
}

// 获取活跃股票数量统计
export const getStockStats = async (): Promise<{
  total: number
  active: number
  by_market: Record<string, number>
}> => {
  try {
    const stocks = await getStocks({ limit: 1000, active_only: false })
    
    const stats = {
      total: stocks.total,
      active: stocks.data.filter(stock => stock.is_active).length,
      by_market: {} as Record<string, number>
    }

    stocks.data.forEach(stock => {
      if (stock.market) {
        stats.by_market[stock.market] = (stats.by_market[stock.market] || 0) + 1
      }
    })

    return stats
  } catch (error) {
    console.error('获取股票统计失败:', error)
    throw error
  }
}

export default {
  getStocks,
  getStock,
  getStockData,
  getLatestStockData,
  refreshStockData,
  createStock,
  updateStock,
  deleteStock,
  createStockData,
  getBatchStockData,
  searchStocks,
  getStockStats
}