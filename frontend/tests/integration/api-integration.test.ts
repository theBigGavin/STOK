/**
 * API 集成测试
 * 验证前端与后端 API 的完整集成功能
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { 
  IntegrationTestClient, 
  TestDataManager, 
  PerformanceTester,
  IntegrationAssertions,
  setupIntegrationTestEnvironment,
  DEFAULT_INTEGRATION_CONFIG
} from './test-helpers'

// 测试配置
const TEST_CONFIG = {
  ...DEFAULT_INTEGRATION_CONFIG,
  timeout: 60000, // 集成测试需要更长的超时时间
  retryAttempts: 5
}

describe('API 集成测试', () => {
  let testClient: IntegrationTestClient
  let dataManager: TestDataManager
  let performanceTester: PerformanceTester
  let testEnvironment: any

  // 测试数据
  let testStock: any
  let testModel: any
  let testStockData: any[]

  beforeAll(async () => {
    console.log('🚀 启动 API 集成测试...')
    
    // 初始化测试环境
    testEnvironment = setupIntegrationTestEnvironment()
    testClient = testEnvironment.testClient
    dataManager = testEnvironment.dataManager
    performanceTester = testEnvironment.performanceTester

    // 等待服务可用
    console.log('⏳ 等待后端服务启动...')
    await testClient.waitForService(120000) // 2分钟超时
    console.log('✅ 后端服务已就绪')
  })

  afterAll(async () => {
    console.log('🧹 清理测试数据...')
    await dataManager.cleanup()
    console.log('✅ 测试数据清理完成')
  })

  beforeEach(async () => {
    // 重置性能测试器
    performanceTester.reset()
  })

  afterEach(async () => {
    // 记录性能报告
    const report = performanceTester.getReport()
    if (report.summary.totalOperations > 0) {
      console.log('📊 性能报告:', report.summary)
    }
  })

  describe('系统健康检查 API', () => {
    it('应该能够检查系统健康状态', async () => {
      const response = await performanceTester.measure(
        '健康检查',
        () => testClient.getClient().get('/health')
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data.status).toBe('healthy')
      expect(response.data.data.components.database.status).toBe('healthy')
      expect(response.data.data.components.redis.status).toBe('healthy')
    })

    it('应该能够获取系统指标', async () => {
      const response = await performanceTester.measure(
        '系统指标',
        () => testClient.getClient().get('/metrics')
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('cpu_percent')
      expect(response.data.data).toHaveProperty('memory_percent')
      expect(response.data.data).toHaveProperty('disk_usage_percent')
    })

    it('应该能够获取系统信息', async () => {
      const response = await performanceTester.measure(
        '系统信息',
        () => testClient.getClient().get('/info')
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data.name).toBe('股票回测决策系统')
      expect(response.data.data.version).toBe('1.0.0')
    })
  })

  describe('股票数据 API 集成', () => {
    beforeAll(async () => {
      // 创建测试股票
      testStock = await dataManager.createTestStock(
        testClient.getClient(),
        'TEST001',
        '测试股票001'
      )
      
      // 创建测试股票数据
      testStockData = await dataManager.createTestStockData(
        testClient.getClient(),
        'TEST001',
        10 // 创建10天的测试数据
      )
    })

    it('应该能够获取股票列表', async () => {
      const response = await performanceTester.measure(
        '获取股票列表',
        () => testClient.getClient().get('/stocks?limit=5')
      )

      IntegrationAssertions.validatePaginatedResponse(response)
      expect(response.data.data.data.length).toBeGreaterThan(0)
      
      // 验证第一个股票的数据结构
      const firstStock = response.data.data.data[0]
      IntegrationAssertions.validateStockData(firstStock)
    })

    it('应该能够获取特定股票详情', async () => {
      const response = await performanceTester.measure(
        '获取股票详情',
        () => testClient.getClient().get(`/stocks/${testStock.symbol}`)
      )

      IntegrationAssertions.validateApiResponse(response)
      IntegrationAssertions.validateStockData(response.data.data)
      expect(response.data.data.symbol).toBe(testStock.symbol)
    })

    it('应该能够获取股票历史数据', async () => {
      const startDate = '2023-01-01'
      const endDate = '2023-01-10'
      
      const response = await performanceTester.measure(
        '获取股票历史数据',
        () => testClient.getClient().get(
          `/stocks/${testStock.symbol}/data?start_date=${startDate}&end_date=${endDate}`
        )
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('symbol')
      expect(response.data.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('metadata')
      expect(Array.isArray(response.data.data.data)).toBe(true)
      
      if (response.data.data.data.length > 0) {
        const firstData = response.data.data.data[0]
        expect(firstData).toHaveProperty('trade_date')
        expect(firstData).toHaveProperty('open_price')
        expect(firstData).toHaveProperty('high_price')
        expect(firstData).toHaveProperty('low_price')
        expect(firstData).toHaveProperty('close_price')
        expect(firstData).toHaveProperty('volume')
      }
    })

    it('应该能够获取最新股票数据', async () => {
      const response = await performanceTester.measure(
        '获取最新股票数据',
        () => testClient.getClient().get(`/stocks/${testStock.symbol}/latest`)
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('symbol')
      expect(response.data.data).toHaveProperty('latest_data')
      expect(response.data.data.latest_data).toHaveProperty('trade_date')
      expect(response.data.data.latest_data).toHaveProperty('close_price')
    })

    it('应该能够搜索股票', async () => {
      const response = await performanceTester.measure(
        '搜索股票',
        () => testClient.getClient().get('/stocks?symbol=TEST')
      )

      IntegrationAssertions.validatePaginatedResponse(response)
      expect(response.data.data.data.length).toBeGreaterThan(0)
      
      // 验证搜索结果包含测试股票
      const foundStock = response.data.data.data.find((stock: any) => 
        stock.symbol === testStock.symbol
      )
      expect(foundStock).toBeDefined()
    })

    it('应该能够处理不存在的股票', async () => {
      try {
        await testClient.getClient().get('/stocks/NONEXISTENT')
        throw new Error('应该抛出404错误')
      } catch (error: any) {
        expect(error.response?.status).toBe(404)
        expect(error.response?.data.message).toContain('不存在')
      }
    })
  })

  describe('模型管理 API 集成', () => {
    beforeAll(async () => {
      // 创建测试模型
      testModel = await dataManager.createTestModel(
        testClient.getClient(),
        '测试技术模型',
        'technical'
      )
    })

    it('应该能够获取模型列表', async () => {
      const response = await performanceTester.measure(
        '获取模型列表',
        () => testClient.getClient().get('/models')
      )

      IntegrationAssertions.validatePaginatedResponse(response)
      expect(response.data.data.data.length).toBeGreaterThan(0)
      
      const firstModel = response.data.data.data[0]
      IntegrationAssertions.validateModelData(firstModel)
    })

    it('应该能够获取特定模型详情', async () => {
      const response = await performanceTester.measure(
        '获取模型详情',
        () => testClient.getClient().get(`/models/${testModel.id}`)
      )

      IntegrationAssertions.validateApiResponse(response)
      IntegrationAssertions.validateModelData(response.data.data)
      expect(response.data.data.id).toBe(testModel.id)
      expect(response.data.data.name).toBe(testModel.name)
    })

    it('应该能够创建新模型', async () => {
      const newModelData = {
        name: '新建测试模型',
        description: '这是一个新建的测试模型',
        model_type: 'technical',
        parameters: { period: 20, threshold: 0.5 },
        is_active: true
      }

      const response = await performanceTester.measure(
        '创建模型',
        () => testClient.getClient().post('/models', newModelData)
      )

      IntegrationAssertions.validateApiResponse(response)
      IntegrationAssertions.validateModelData(response.data.data)
      expect(response.data.data.name).toBe(newModelData.name)
      expect(response.data.data.model_type).toBe(newModelData.model_type)
    })

    it('应该能够更新模型信息', async () => {
      const updateData = {
        description: '更新后的模型描述',
        parameters: { period: 25, threshold: 0.6 }
      }

      const response = await performanceTester.measure(
        '更新模型',
        () => testClient.getClient().put(`/models/${testModel.id}`, updateData)
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data.description).toBe(updateData.description)
      expect(response.data.data.parameters.period).toBe(updateData.parameters.period)
    })

    it('应该能够运行模型回测', async () => {
      const backtestRequest = {
        symbol: 'TEST001',
        start_date: '2023-01-01',
        end_date: '2023-01-10',
        initial_capital: 100000,
        model_ids: [testModel.id]
      }

      const response = await performanceTester.measure(
        '运行模型回测',
        () => testClient.getClient().post(`/models/${testModel.id}/backtest`, backtestRequest)
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('symbol')
      expect(response.data.data).toHaveProperty('backtest_result')
      expect(response.data.data.backtest_result).toHaveProperty('total_return')
      expect(response.data.data.backtest_result).toHaveProperty('sharpe_ratio')
    })

    it('应该能够获取模型性能历史', async () => {
      const response = await performanceTester.measure(
        '获取模型性能历史',
        () => testClient.getClient().get(`/models/${testModel.id}/performance`)
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('model_id')
      expect(response.data.data).toHaveProperty('performance_history')
      expect(Array.isArray(response.data.data.performance_history)).toBe(true)
    })
  })

  describe('决策引擎 API 集成', () => {
    it('应该能够生成单个决策', async () => {
      const decisionRequest = {
        symbol: 'TEST001',
        trade_date: '2023-01-05',
        current_position: 0.0
      }

      const response = await performanceTester.measure(
        '生成单个决策',
        () => testClient.getClient().post('/decisions/generate', decisionRequest)
      )

      IntegrationAssertions.validateApiResponse(response)
      IntegrationAssertions.validateDecisionData(response.data.data)
      
      // 验证决策数据的完整性
      const decision = response.data.data
      expect(['BUY', 'SELL', 'HOLD']).toContain(decision.final_decision.decision)
      expect(decision.final_decision.confidence).toBeGreaterThan(0)
      expect(decision.final_decision.confidence).toBeLessThanOrEqual(1)
      expect(decision.final_decision.vote_summary).toHaveProperty('BUY')
      expect(decision.final_decision.vote_summary).toHaveProperty('SELL')
      expect(decision.final_decision.vote_summary).toHaveProperty('HOLD')
      expect(Array.isArray(decision.final_decision.model_details)).toBe(true)
    })

    it('应该能够批量生成决策', async () => {
      const batchRequest = {
        symbols: ['TEST001'],
        trade_date: '2023-01-05'
      }

      const response = await performanceTester.measure(
        '批量生成决策',
        () => testClient.getClient().post('/decisions/batch', batchRequest)
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('batch_results')
      expect(response.data.data).toHaveProperty('total_count')
      expect(response.data.data).toHaveProperty('success_count')
      expect(response.data.data).toHaveProperty('timestamp')
      
      expect(Array.isArray(response.data.data.batch_results)).toBe(true)
      expect(response.data.data.success_count).toBeGreaterThanOrEqual(0)
      expect(response.data.data.total_count).toBe(batchRequest.symbols.length)
    })

    it('应该能够获取决策历史', async () => {
      const startDate = '2023-01-01'
      const endDate = '2023-01-10'
      
      const response = await performanceTester.measure(
        '获取决策历史',
        () => testClient.getClient().get(
          `/decisions/history/TEST001?start_date=${startDate}&end_date=${endDate}`
        )
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('symbol')
      expect(response.data.data).toHaveProperty('history')
      expect(response.data.data).toHaveProperty('metadata')
      expect(Array.isArray(response.data.data.history)).toBe(true)
    })

    it('应该能够获取决策列表', async () => {
      const response = await performanceTester.measure(
        '获取决策列表',
        () => testClient.getClient().get('/decisions?limit=5')
      )

      IntegrationAssertions.validatePaginatedResponse(response)
      expect(response.data.data.data.length).toBeGreaterThanOrEqual(0)
      
      if (response.data.data.data.length > 0) {
        const firstDecision = response.data.data.data[0]
        expect(firstDecision).toHaveProperty('symbol')
        expect(firstDecision).toHaveProperty('trade_date')
        expect(firstDecision).toHaveProperty('final_decision')
        expect(['BUY', 'SELL', 'HOLD']).toContain(firstDecision.final_decision)
      }
    })
  })

  describe('回测分析 API 集成', () => {
    it('应该能够运行模型回测', async () => {
      const backtestRequest = {
        symbol: 'TEST001',
        start_date: '2023-01-01',
        end_date: '2023-01-10',
        initial_capital: 100000,
        model_ids: [testModel.id]
      }

      const response = await performanceTester.measure(
        '运行回测分析',
        () => testClient.getClient().post('/backtest/model', backtestRequest)
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('symbol')
      expect(response.data.data).toHaveProperty('backtest_result')
      expect(response.data.data).toHaveProperty('parameters')
      
      const result = response.data.data.backtest_result
      expect(result).toHaveProperty('total_return')
      expect(result).toHaveProperty('annual_return')
      expect(result).toHaveProperty('volatility')
      expect(result).toHaveProperty('sharpe_ratio')
      expect(result).toHaveProperty('max_drawdown')
      expect(result).toHaveProperty('total_trades')
    })

    it('应该能够运行组合回测', async () => {
      const portfolioRequest = {
        symbols: ['TEST001'],
        start_date: '2023-01-01',
        end_date: '2023-01-10',
        initial_capital: 100000,
        rebalance_frequency: 'monthly'
      }

      const response = await performanceTester.measure(
        '运行组合回测',
        () => testClient.getClient().post('/backtest/portfolio', portfolioRequest)
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('portfolio_result')
      expect(response.data.data).toHaveProperty('parameters')
      
      const result = response.data.data.portfolio_result
      expect(result).toHaveProperty('total_return')
      expect(result).toHaveProperty('annual_return')
      expect(result).toHaveProperty('volatility')
      expect(result).toHaveProperty('sharpe_ratio')
      expect(result).toHaveProperty('portfolio_weights')
      expect(result).toHaveProperty('individual_returns')
    })

    it('应该能够比较回测结果', async () => {
      const compareRequests = [
        {
          symbol: 'TEST001',
          start_date: '2023-01-01',
          end_date: '2023-01-05',
          initial_capital: 100000,
          model_ids: [testModel.id]
        },
        {
          symbol: 'TEST001',
          start_date: '2023-01-06',
          end_date: '2023-01-10',
          initial_capital: 100000,
          model_ids: [testModel.id]
        }
      ]

      const response = await performanceTester.measure(
        '比较回测结果',
        () => testClient.getClient().post('/backtest/compare', compareRequests)
      )

      IntegrationAssertions.validateApiResponse(response)
      expect(response.data.data).toHaveProperty('comparison')
      expect(response.data.data).toHaveProperty('summary')
      
      expect(Array.isArray(response.data.data.comparison)).toBe(true)
      expect(response.data.data.summary).toHaveProperty('best_performer')
      expect(response.data.data.summary).toHaveProperty('worst_performer')
      expect(response.data.data.summary).toHaveProperty('avg_return')
    })

    it('应该能够获取回测结果详情', async () => {
      // 首先获取回测结果列表
      const listResponse = await testClient.getClient().get('/backtest/results?limit=1')
      
      if (listResponse.data.data.data.length > 0) {

        const resultId = listResponse.data.data.data[0].id
        
        const response = await performanceTester.measure(
          '获取回测结果详情',
          () => testClient.getClient().get(`/backtest/results/${resultId}`)
        )

        IntegrationAssertions.validateApiResponse(response)
        expect(response.data.data).toHaveProperty('id')
        expect(response.data.data).toHaveProperty('model_id')
        expect(response.data.data).toHaveProperty('model_name')
        expect(response.data.data).toHaveProperty('backtest_date')
        expect(response.data.data).toHaveProperty('results')
        expect(response.data.data).toHaveProperty('trades')
      }
    })

    it('应该能够获取回测结果列表', async () => {
      const response = await performanceTester.measure(
        '获取回测结果列表',
        () => testClient.getClient().get('/backtest/results?limit=5')
      )

      IntegrationAssertions.validatePaginatedResponse(response)
      expect(response.data.data.data.length).toBeGreaterThanOrEqual(0)
      
      if (response.data.data.data.length > 0) {
        const firstResult = response.data.data.data[0]
        expect(firstResult).toHaveProperty('id')
        expect(firstResult).toHaveProperty('model_id')
        expect(firstResult).toHaveProperty('model_name')
        expect(firstResult).toHaveProperty('backtest_date')
        expect(firstResult).toHaveProperty('results')
      }
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该正确处理无效的股票代码', async () => {
      try {
        await testClient.getClient().get('/stocks/INVALID_SYMBOL_123')
        throw new Error('应该抛出404错误')
      } catch (error: any) {
        expect(error.response?.status).toBe(404)
        expect(error.response?.data.message).toContain('不存在')
      }
    })

    it('应该正确处理无效的模型ID', async () => {
      try {
        await testClient.getClient().get('/models/999999')
        throw new Error('应该抛出404错误')
      } catch (error: any) {
        expect(error.response?.status).toBe(404)
        expect(error.response?.data.message).toContain('不存在')
      }
    })

    it('应该正确处理无效的日期格式', async () => {
      try {
        await testClient.getClient().get(
          `/stocks/${testStock.symbol}/data?start_date=invalid&end_date=2023-01-01`
        )
        throw new Error('应该抛出400错误')
      } catch (error: any) {
        expect([400, 422]).toContain(error.response?.status)
      }
    })

    it('应该正确处理超出范围的参数', async () => {
      try {
        await testClient.getClient().get('/stocks?limit=10000') // 超出最大限制
        throw new Error('应该抛出422错误')
      } catch (error: any) {
        expect([400, 422]).toContain(error.response?.status)
      }
    })
  })

  describe('数据一致性验证', () => {
    it('应该确保股票数据的完整性', async () => {
      // 获取股票列表
      const stocksResponse = await testClient.getClient().get('/stocks?limit=10')
      const stocks = stocksResponse.data.data.data

      // 对每个股票验证数据结构
      for (const stock of stocks) {
        IntegrationAssertions.validateStockData(stock)
        
        // 验证必填字段不为空
        expect(stock.symbol).toBeTruthy()
        expect(stock.name).toBeTruthy()
        expect(stock.market).toBeTruthy()
        expect(stock.is_active).toBeDefined()
      }
    })

    it('应该确保模型数据的完整性', async () => {
      // 获取模型列表
      const modelsResponse = await testClient.getClient().get('/models?limit=10')
      const models = modelsResponse.data.data.data

      // 对每个模型验证数据结构
      for (const model of models) {
        IntegrationAssertions.validateModelData(model)
        
        // 验证必填字段不为空
        expect(model.name).toBeTruthy()
        expect(model.model_type).toBeTruthy()
        expect(model.parameters).toBeDefined()
        expect(model.is_active).toBeDefined()
      }
    })

    it('应该确保决策数据的逻辑一致性', async () => {
      const decisionRequest = {
        symbol: 'TEST001',
        trade_date: '2023-01-05',
        current_position: 0.0
      }

      const response = await testClient.getClient().post('/decisions/generate', decisionRequest)
      const decision = response.data.data

      // 验证投票统计的一致性
      const voteSummary = decision.final_decision.vote_summary
      const totalVotes = voteSummary.BUY + voteSummary.SELL + voteSummary.HOLD
      expect(totalVotes).toBeGreaterThan(0)

      // 验证模型详情与投票统计的一致性
      const modelDetails = decision.final_decision.model_details
      expect(modelDetails.length).toBe(totalVotes)

      // 验证置信度在合理范围内
      expect(decision.final_decision.confidence).toBeGreaterThanOrEqual(0)
      expect(decision.final_decision.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('性能基准测试', () => {
    it('股票列表API响应时间应小于1秒', async () => {
      const response = await performanceTester.measure(
        '股票列表性能测试',
        () => testClient.getClient().get('/stocks?limit=10')
      )

      const report = performanceTester.getReport()
      const operation = report.operations['股票列表性能测试']
      expect(operation.avg).toBeLessThan(1000) // 1秒
    })

    it('决策生成API响应时间应小于3秒', async () => {
      const decisionRequest = {
        symbol: 'TEST001',
        trade_date: '2023-01-05',
        current_position: 0.0
      }

      const response = await performanceTester.measure(
        '决策生成性能测试',
        () => testClient.getClient().post('/decisions/generate', decisionRequest)
      )

      const report = performanceTester.getReport()
      const operation = report.operations['决策生成性能测试']
      expect(operation.avg).toBeLessThan(3000) // 3秒
    })

    it('回测分析API响应时间应小于5秒', async () => {
      const backtestRequest = {
        symbol: 'TEST001',
        start_date: '2023-01-01',
        end_date: '2023-01-10',
        initial_capital: 100000,
        model_ids: [testModel.id]
      }

      const response = await performanceTester.measure(
        '回测分析性能测试',
        () => testClient.getClient().post('/backtest/model', backtestRequest)
      )

      const report = performanceTester.getReport()
      const operation = report.operations['回测分析性能测试']
      expect(operation.avg).toBeLessThan(5000) // 5秒
    })
  })
})
