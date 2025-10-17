/**
 * 集成测试辅助工具函数
 * 提供集成测试专用的工具函数、测试数据管理和环境管理
 */

import { vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

// 集成测试环境配置
export interface IntegrationTestConfig {
  baseURL: string
  timeout: number
  retryAttempts: number
  retryDelay: number
}

// 默认集成测试配置
export const DEFAULT_INTEGRATION_CONFIG: IntegrationTestConfig = {
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
}

// API 客户端配置
export class IntegrationTestClient {
  private client: AxiosInstance
  private config: IntegrationTestConfig

  constructor(config: IntegrationTestConfig = DEFAULT_INTEGRATION_CONFIG) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 设置请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Integration Test] Making request to: ${config.url}`)
        return config
      },
      (error) => {
        console.error('[Integration Test] Request error:', error)
        return Promise.reject(error)
      }
    )

    // 设置响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[Integration Test] Response received: ${response.status}`)
        return response
      },
      async (error) => {
        console.error('[Integration Test] Response error:', error.response?.status, error.message)
        
        // 重试逻辑
        if (error.config && error.config.retryCount < this.config.retryAttempts) {
          error.config.retryCount = error.config.retryCount || 0
          error.config.retryCount += 1
          
          console.log(`[Integration Test] Retrying request (${error.config.retryCount}/${this.config.retryAttempts})`)
          
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
          return this.client(error.config)
        }
        
        return Promise.reject(error)
      }
    )
  }

  // 获取 API 客户端
  getClient(): AxiosInstance {
    return this.client
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health')
      return response.data.status === 'success' && 
             response.data.data.status === 'healthy'
    } catch (error) {
      console.error('[Integration Test] Health check failed:', error)
      return false
    }
  }

  // 等待服务可用
  async waitForService(timeout = 60000): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      if (await this.healthCheck()) {
        console.log('[Integration Test] Service is available')
        return true
      }
      
      console.log('[Integration Test] Waiting for service...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    throw new Error(`Service not available within ${timeout}ms`)
  }
}

// 测试数据管理
export class TestDataManager {
  private createdData: Array<{ type: string; id: string | number; cleanup: () => Promise<void> }> = []

  // 创建测试股票
  async createTestStock(client: AxiosInstance, symbol: string, name: string): Promise<any> {
    const stockData = {
      symbol,
      name,
      market: 'NASDAQ',
      industry: 'Technology',
      is_active: true
    }

    try {
      const response = await client.post('/stocks', stockData)
      const stock = response.data.data
      
      this.createdData.push({
        type: 'stock',
        id: stock.id,
        cleanup: async () => {
          try {
            await client.delete(`/stocks/${stock.symbol}`)
          } catch (error) {
            console.warn(`Failed to cleanup stock ${stock.symbol}:`, error)
          }
        }
      })
      
      return stock
    } catch (error: any) {
      // 如果股票已存在，尝试获取现有股票
      if (error.response?.status === 400 && error.response?.data?.message?.includes('已存在')) {
        const response = await client.get(`/stocks/${symbol}`)
        return response.data.data
      }
      throw error
    }
  }

  // 创建测试模型
  async createTestModel(client: AxiosInstance, name: string, modelType: string = 'technical'): Promise<any> {
    const modelData = {
      name,
      description: `测试模型 - ${name}`,
      model_type: modelType,
      parameters: { period: 14 },
      is_active: true
    }

    const response = await client.post('/models', modelData)
    const model = response.data.data
    
    this.createdData.push({
      type: 'model',
      id: model.id,
      cleanup: async () => {
        try {
          await client.delete(`/models/${model.id}`)
        } catch (error) {
          console.warn(`Failed to cleanup model ${model.id}:`, error)
        }
      }
    })
    
    return model
  }

  // 创建测试股票数据
  async createTestStockData(client: AxiosInstance, symbol: string, days: number = 30): Promise<any[]> {
    const stockData = []
    const baseDate = new Date('2023-01-01')
    
    for (let i = 0; i < days; i++) {
      const tradeDate = new Date(baseDate)
      tradeDate.setDate(baseDate.getDate() + i)
      
      const data = {
        trade_date: tradeDate.toISOString().split('T')[0],
        open_price: 100 + Math.random() * 50,
        high_price: 110 + Math.random() * 50,
        low_price: 90 + Math.random() * 50,
        close_price: 105 + Math.random() * 50,
        volume: 1000000 + Math.floor(Math.random() * 1000000),
        turnover: 100000000 + Math.floor(Math.random() * 100000000)
      }
      
      try {
        const response = await client.post(`/stocks/${symbol}/data`, data)
        stockData.push(response.data.data)
      } catch (error: any) {
        // 如果数据已存在，跳过
        if (error.response?.status === 400 && error.response?.data?.message?.includes('已存在')) {
          continue
        }
        throw error
      }
    }
    
    return stockData
  }

  // 清理所有测试数据
  async cleanup(): Promise<void> {
    console.log(`[Test Data Manager] Cleaning up ${this.createdData.length} test records`)
    
    // 按创建顺序反向清理
    for (let i = this.createdData.length - 1; i >= 0; i--) {
      const data = this.createdData[i]
      try {
        await data.cleanup()
      } catch (error) {
        console.warn(`Failed to cleanup ${data.type} ${data.id}:`, error)
      }
    }
    
    this.createdData = []
  }

  // 获取创建的数据统计
  getStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {}
    
    this.createdData.forEach(data => {
      stats[data.type] = (stats[data.type] || 0) + 1
    })
    
    return stats
  }
}

// 性能测试工具
export class PerformanceTester {
  private measurements: Array<{ operation: string; duration: number; timestamp: number }> = []

  // 测量操作执行时间
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.measurements.push({
        operation,
        duration,
        timestamp: Date.now()
      })
      
      console.log(`[Performance] ${operation} took ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.measurements.push({
        operation: `${operation} (failed)`,
        duration,
        timestamp: Date.now()
      })
      
      console.error(`[Performance] ${operation} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  // 获取性能报告
  getReport(): {
    operations: { [key: string]: { count: number; avg: number; min: number; max: number } }
    summary: { totalOperations: number; totalTime: number; avgOperationTime: number }
  } {
    const operations: { [key: string]: number[] } = {}
    
    this.measurements.forEach(measurement => {
      if (!operations[measurement.operation]) {
        operations[measurement.operation] = []
      }
      operations[measurement.operation].push(measurement.duration)
    })
    
    const operationStats: { [key: string]: { count: number; avg: number; min: number; max: number } } = {}
    
    Object.entries(operations).forEach(([operation, durations]) => {
      const count = durations.length
      const avg = durations.reduce((sum, duration) => sum + duration, 0) / count
      const min = Math.min(...durations)
      const max = Math.max(...durations)
      
      operationStats[operation] = { count, avg, min, max }
    })
    
    const totalOperations = this.measurements.length
    const totalTime = this.measurements.reduce((sum, m) => sum + m.duration, 0)
    const avgOperationTime = totalTime / totalOperations
    
    return {
      operations: operationStats,
      summary: {
        totalOperations,
        totalTime,
        avgOperationTime
      }
    }
  }

  // 重置测量数据
  reset(): void {
    this.measurements = []
  }
}

// 安全测试工具
export class SecurityTester {
  private client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  // 测试 SQL 注入防护
  async testSqlInjection(): Promise<{ passed: boolean; details: string[] }> {
    const details: string[] = []
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1' UNION SELECT 1,2,3 --"
    ]

    let passed = true

    for (const payload of sqlInjectionPayloads) {
      try {
        // 测试股票搜索
        await this.client.get(`/stocks?symbol=${encodeURIComponent(payload)}`)
        details.push(`SQL注入测试失败: 端点未正确过滤输入 - ${payload}`)
        passed = false
      } catch (error: any) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          details.push(`SQL注入测试通过: 端点正确拒绝恶意输入 - ${payload}`)
        } else {
          details.push(`SQL注入测试不确定: 响应状态 ${error.response?.status} - ${payload}`)
        }
      }
    }

    return { passed, details }
  }

  // 测试 XSS 防护
  async testXssProtection(): Promise<{ passed: boolean; details: string[] }> {
    const details: string[] = []
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')"
    ]

    let passed = true

    for (const payload of xssPayloads) {
      try {
        // 测试创建股票
        await this.client.post('/stocks', {
          symbol: payload,
          name: payload,
          market: 'NASDAQ',
          industry: 'Technology'
        })
        details.push(`XSS测试失败: 端点未正确过滤输入 - ${payload}`)
        passed = false
      } catch (error: any) {
        if (error.response?.status === 400) {
          details.push(`XSS测试通过: 端点正确拒绝恶意输入 - ${payload}`)
        } else {
          details.push(`XSS测试不确定: 响应状态 ${error.response?.status} - ${payload}`)
        }
      }
    }

    return { passed, details }
  }

  // 测试输入验证
  async testInputValidation(): Promise<{ passed: boolean; details: string[] }> {
    const details: string[] = []
    const invalidInputs = [
      { symbol: 'A'.repeat(100), name: 'Test' }, // 过长的股票代码
      { symbol: 'TEST', name: 'T'.repeat(500) }, // 过长的股票名称
      { symbol: '123', name: 'Test' }, // 无效的股票代码格式
      { symbol: 'TEST@', name: 'Test' } // 包含特殊字符的股票代码
    ]

    let passed = true

    for (const input of invalidInputs) {
      try {
        await this.client.post('/stocks', {
          ...input,
          market: 'NASDAQ',
          industry: 'Technology'
        })
        details.push(`输入验证测试失败: 端点未正确验证输入 - ${JSON.stringify(input)}`)
        passed = false
      } catch (error: any) {
        if (error.response?.status === 400) {
          details.push(`输入验证测试通过: 端点正确拒绝无效输入 - ${JSON.stringify(input)}`)
        } else {
          details.push(`输入验证测试不确定: 响应状态 ${error.response?.status} - ${JSON.stringify(input)}`)
        }
      }
    }

    return { passed, details }
  }
}

// 测试环境设置
export const setupIntegrationTestEnvironment = () => {
  // 设置 Pinia
  const pinia = createPinia()
  setActivePinia(pinia)

  // 设置路由
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'Dashboard',
        component: { template: '<div>Dashboard</div>' }
      },
      {
        path: '/stocks',
        name: 'Stocks',
        component: { template: '<div>Stocks</div>' }
      },
      {
        path: '/models',
        name: 'Models',
        component: { template: '<div>Models</div>' }
      },
      {
        path: '/decisions',
        name: 'Decisions',
        component: { template: '<div>Decisions</div>' }
      },
      {
        path: '/backtest',
        name: 'Backtest',
        component: { template: '<div>Backtest</div>' }
      }
    ]
  })

  return {
    pinia,
    router,
    testClient: new IntegrationTestClient(),
    dataManager: new TestDataManager(),
    performanceTester: new PerformanceTester()
  }
}

// 通用断言工具
export const IntegrationAssertions = {
  // 验证 API 响应格式
  validateApiResponse(response: AxiosResponse): void {
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('status')
    expect(response.data).toHaveProperty('message')
    expect(response.data).toHaveProperty('data')
    expect(['success', 'error']).toContain(response.data.status)
  },

  // 验证分页响应格式
  validatePaginatedResponse(response: AxiosResponse): void {
    IntegrationAssertions.validateApiResponse(response)
    expect(response.data.data).toHaveProperty('data')
    expect(response.data.data).toHaveProperty('total')
    expect(response.data.data).toHaveProperty('skip')
    expect(response.data.data).toHaveProperty('limit')
    expect(Array.isArray(response.data.data.data)).toBe(true)
  },

  // 验证股票数据结构
  validateStockData(stock: any): void {
    expect(stock).toHaveProperty('id')
    expect(stock).toHaveProperty('symbol')
    expect(stock).toHaveProperty('name')
    expect(stock).toHaveProperty('market')
    expect(stock).toHaveProperty('industry')
    expect(stock).toHaveProperty('is_active')
  },

  // 验证模型数据结构
  validateModelData(model: any): void {
    expect(model).toHaveProperty('id')
    expect(model).toHaveProperty('name')
    expect(model).toHaveProperty('description')
    expect(model).toHaveProperty('model_type')
    expect(model).toHaveProperty('parameters')
    expect(model).toHaveProperty('is_active')
  },

  // 验证决策数据结构
  validateDecisionData(decision: any): void {
    expect(decision).toHaveProperty('symbol')
    expect(decision).toHaveProperty('trade_date')
    expect(decision).toHaveProperty('final_decision')
    expect(decision.final_decision).toHaveProperty('decision')
    expect(decision.final_decision).toHaveProperty('confidence')
    expect(decision.final_decision).toHaveProperty('vote_summary')
    expect(decision.final_decision).toHaveProperty('model_details')
  }
}

// 导出默认配置和工具
export default {
  IntegrationTestClient,
  TestDataManager,
  PerformanceTester,
  SecurityTester,
  setupIntegrationTestEnvironment,
  IntegrationAssertions,
  DEFAULT_INTEGRATION_CONFIG
}