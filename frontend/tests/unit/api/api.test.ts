import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { http, api } from '@/api/base'
import * as stockApi from '@/api/stocks'
import type { Stock, StockDailyData, StockDataResponse, PaginatedResponse } from '@/types/api'

describe('API 服务', () => {
  let mockAxios: MockAdapter

  beforeEach(() => {
    mockAxios = new MockAdapter(axios)
    localStorage.clear()
  })

  afterEach(() => {
    mockAxios.restore()
    vi.clearAllMocks()
  })

  describe('基础 API 配置', () => {
    it('应该正确配置 axios 实例', () => {
      expect(api.defaults.baseURL).toBe('http://localhost:8099')
      expect(api.defaults.timeout).toBe(15000)
      expect(api.defaults.headers['Content-Type']).toBe('application/json')
    })

    it('应该导出 HTTP 方法', () => {
      expect(typeof http.get).toBe('function')
      expect(typeof http.post).toBe('function')
      expect(typeof http.put).toBe('function')
      expect(typeof http.delete).toBe('function')
      expect(typeof http.patch).toBe('function')
    })
  })

  describe('请求拦截器', () => {
    it('应该添加认证令牌到请求头', async () => {
      const token = 'test-token-123'
      localStorage.setItem('token', token)

      mockAxios.onGet('/test').reply(200, { data: 'success' })

      await http.get('/test')

      const request = mockAxios.history.get[0]
      expect(request.headers?.Authorization).toBe(`Bearer ${token}`)
    })

    it('应该为 GET 请求添加时间戳防止缓存', async () => {
      mockAxios.onGet('/test').reply(200, { data: 'success' })

      await http.get('/test', { params: { foo: 'bar' } })

      const request = mockAxios.history.get[0]
      expect(request.params).toHaveProperty('_t')
      expect(typeof request.params._t).toBe('number')
    })

    it('应该在没有令牌时不添加认证头', async () => {
      localStorage.removeItem('token')

      mockAxios.onGet('/test').reply(200, { data: 'success' })

      await http.get('/test')

      const request = mockAxios.history.get[0]
      expect(request.headers?.Authorization).toBeUndefined()
    })
  })

  describe('响应拦截器', () => {
    it('应该处理成功的响应', async () => {
      const responseData = { data: 'test', message: 'success', status: 'success' }
      mockAxios.onGet('/success').reply(200, responseData)

      const result = await http.get('/success')
      expect(result).toEqual('test')
    })

    it('应该处理标准格式的响应数据', async () => {
      const responseData = { data: { items: [1, 2, 3] }, message: 'success', status: 'success' }
      mockAxios.onGet('/standard').reply(200, responseData)

      const result = await http.get('/standard')
      expect(result).toEqual({ items: [1, 2, 3] })
    })

    it('应该处理非标准格式的响应数据', async () => {
      const responseData = { items: [1, 2, 3] }
      mockAxios.onGet('/non-standard').reply(200, responseData)

      const result = await http.get('/non-standard')
      expect(result).toEqual({ items: [1, 2, 3] })
    })

    it('应该处理错误状态的响应', async () => {
      const errorResponse = { data: null, message: '请求失败', status: 'error' }
      mockAxios.onGet('/error').reply(200, errorResponse)

      await expect(http.get('/error')).rejects.toThrow('请求失败')
    })
  })

  describe('错误处理', () => {
    it('应该处理 400 错误', async () => {
      mockAxios.onGet('/400').reply(400, { message: '请求参数错误' })

      await expect(http.get('/400')).rejects.toThrow('请求参数错误')
    })

    it('应该处理 401 错误', async () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
      mockAxios.onGet('/401').reply(401)

      await expect(http.get('/401')).rejects.toThrow('未授权，请重新登录')
      expect(removeItemSpy).toHaveBeenCalledWith('token')
    })

    it('应该处理 403 错误', async () => {
      mockAxios.onGet('/403').reply(403)

      await expect(http.get('/403')).rejects.toThrow('拒绝访问')
    })

    it('应该处理 404 错误', async () => {
      mockAxios.onGet('/404').reply(404)

      await expect(http.get('/404')).rejects.toThrow('请求的资源不存在')
    })

    it('应该处理 422 错误', async () => {
      mockAxios.onGet('/422').reply(422, { message: '数据验证失败' })

      await expect(http.get('/422')).rejects.toThrow('数据验证失败')
    })

    it('应该处理 429 错误', async () => {
      mockAxios.onGet('/429').reply(429)

      await expect(http.get('/429')).rejects.toThrow('请求过于频繁，请稍后重试')
    })

    it('应该处理 500 错误', async () => {
      mockAxios.onGet('/500').reply(500)

      await expect(http.get('/500')).rejects.toThrow('服务器内部错误')
    })

    it('应该处理网络连接错误', async () => {
      mockAxios.onGet('/network-error').networkError()

      await expect(http.get('/network-error')).rejects.toThrow('网络连接失败，请检查网络设置')
    })

    it('应该处理未知错误', async () => {
      mockAxios.onGet('/unknown-error').reply(() => {
        throw new Error('Unknown error')
      })

      await expect(http.get('/unknown-error')).rejects.toThrow('Unknown error')
    })
  })

  describe('股票 API 服务', () => {
    const mockStock: Stock = {
      id: 1,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      market: 'NASDAQ',
      industry: 'Technology',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }

    const mockStockData: StockDailyData = {
      id: 1,
      stock_id: 1,
      trade_date: '2023-01-01',
      open_price: 150.00,
      high_price: 155.00,
      low_price: 149.50,
      close_price: 152.50,
      volume: 1000000,
      turnover: 152500000,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }

    const mockPaginatedResponse: PaginatedResponse<Stock> = {
      data: [mockStock],
      total: 1,
      skip: 0,
      limit: 20
    }

    const mockStockDataResponse: StockDataResponse = {
      symbol: 'AAPL',
      data: [mockStockData],
      metadata: {
        start_date: '2023-01-01',
        end_date: '2023-01-01',
        record_count: 1,
        total_count: 1,
        skip: 0,
        limit: 1000,
        has_more: false
      }
    }

    describe('获取股票列表', () => {
      it('应该成功获取股票列表', async () => {
        mockAxios.onGet('/api/v1/stocks').reply(200, mockPaginatedResponse)

        const result = await stockApi.getStocks()
        expect(result).toEqual(mockPaginatedResponse)
      })

      it('应该支持分页参数', async () => {
        mockAxios.onGet('/api/v1/stocks').reply(200, mockPaginatedResponse)

        const params = { skip: 20, limit: 10, active_only: false, market: 'NASDAQ' }
        await stockApi.getStocks(params)

        const request = mockAxios.history.get[0]
        expect(request.params).toEqual({
          skip: 20,
          limit: 10,
          active_only: false,
          market: 'NASDAQ'
        })
      })

      it('应该处理获取股票列表失败', async () => {
        mockAxios.onGet('/api/v1/stocks').reply(500)

        await expect(stockApi.getStocks()).rejects.toThrow()
      })
    })

    describe('获取股票详情', () => {
      it('应该成功获取股票详情', async () => {
        mockAxios.onGet('/api/v1/stocks/AAPL').reply(200, mockStock)

        const result = await stockApi.getStock('AAPL')
        expect(result).toEqual(mockStock)
      })

      it('应该处理获取股票详情失败', async () => {
        mockAxios.onGet('/api/v1/stocks/AAPL').reply(404)

        await expect(stockApi.getStock('AAPL')).rejects.toThrow()
      })
    })

    describe('获取股票历史数据', () => {
      it('应该成功获取股票历史数据', async () => {
        mockAxios.onGet('/api/v1/stocks/AAPL/data').reply(200, mockStockDataResponse)

        const params = {
          start_date: '2023-01-01',
          end_date: '2023-01-31',
          include_features: true,
          skip: 0,
          limit: 1000
        }

        const result = await stockApi.getStockData('AAPL', params)
        expect(result).toEqual(mockStockDataResponse)
      })

      it('应该处理获取股票历史数据失败', async () => {
        mockAxios.onGet('/api/v1/stocks/AAPL/data').reply(500)

        const params = {
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        }

        await expect(stockApi.getStockData('AAPL', params)).rejects.toThrow()
      })
    })

    describe('搜索股票', () => {
      it('应该成功搜索股票', async () => {
        mockAxios.onGet('/api/v1/stocks').reply(200, {
          data: [mockStock],
          total: 1,
          skip: 0,
          limit: 1000
        })

        const result = await stockApi.searchStocks('Apple', 10)
        expect(result).toEqual([mockStock])
      })

      it('应该处理搜索股票失败', async () => {
        mockAxios.onGet('/api/v1/stocks').reply(500)

        await expect(stockApi.searchStocks('Apple', 10)).rejects.toThrow()
      })
    })

    describe('刷新股票数据', () => {
      it('应该成功刷新股票数据', async () => {
        const refreshResponse = {
          symbol: 'AAPL',
          updated_records: 10,
          status: 'completed' as const
        }

        mockAxios.onPost('/api/v1/stocks/AAPL/refresh').reply(200, refreshResponse)

        const result = await stockApi.refreshStockData('AAPL')
        expect(result).toEqual(refreshResponse)
      })

      it('应该处理刷新股票数据失败', async () => {
        mockAxios.onPost('/api/v1/stocks/AAPL/refresh').reply(500)

        await expect(stockApi.refreshStockData('AAPL')).rejects.toThrow()
      })
    })

    describe('批量操作', () => {
      it('应该成功批量获取股票数据', async () => {
        mockAxios.onGet('/api/v1/stocks/AAPL/data').reply(200, mockStockDataResponse)
        mockAxios.onGet('/api/v1/stocks/GOOGL/data').reply(200, {
          ...mockStockDataResponse,
          symbol: 'GOOGL'
        })

        const params = {
          start_date: '2023-01-01',
          end_date: '2023-01-31',
          include_features: true,
          skip: 0,
          limit: 1000
        }

        const result = await stockApi.getBatchStockData(['AAPL', 'GOOGL'], params)
        expect(result).toHaveProperty('AAPL')
        expect(result).toHaveProperty('GOOGL')
      })

      it('应该处理批量获取中的部分失败', async () => {
        mockAxios.onGet('/api/v1/stocks/AAPL/data').reply(200, mockStockDataResponse)
        mockAxios.onGet('/api/v1/stocks/GOOGL/data').reply(500)

        const params = {
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        }

        const result = await stockApi.getBatchStockData(['AAPL', 'GOOGL'], params)
        expect(result).toHaveProperty('AAPL')
        expect(result).not.toHaveProperty('GOOGL')
      })
    })
  })
})