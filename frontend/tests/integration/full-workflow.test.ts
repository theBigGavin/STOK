/**
 * 完整工作流程集成测试
 * 验证从前端到后端的完整用户工作流程
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
  timeout: 90000, // 工作流程测试需要更长的超时时间
  retryAttempts: 5
}

describe('完整工作流程集成测试', () => {
  let testClient: IntegrationTestClient
  let dataManager: TestDataManager
  let performanceTester: PerformanceTester
  let testEnvironment: any

  // 测试数据
  let workflowStocks: any[] = []
  let workflowModels: any[] = []
  let workflowDecisions: any[] = []
  let workflowBacktests: any[] = []

  beforeAll(async () => {
    console.log('🚀 启动完整工作流程集成测试...')
    
    // 初始化测试环境
    testEnvironment = setupIntegrationTestEnvironment()
    testClient = testEnvironment.testClient
    dataManager = testEnvironment.dataManager
    performanceTester = testEnvironment.performanceTester

    // 等待服务可用
    console.log('⏳ 等待后端服务启动...')
    await testClient.waitForService(120000)
    console.log('✅ 后端服务已就绪')
  })

  afterAll(async () => {
    console.log('🧹 清理工作流程测试数据...')
    await dataManager.cleanup()
    console.log('✅ 工作流程测试数据清理完成')
  })

  beforeEach(async () => {
    // 重置性能测试器
    performanceTester.reset()
  })

  afterEach(async () => {
    // 记录工作流程性能报告
    const report = performanceTester.getReport()
    if (report.summary.totalOperations > 0) {
      console.log('📊 工作流程性能报告:', report.summary)
    }
  })

  describe('股票分析完整工作流程', () => {
    it('应该能够完成完整的股票分析流程', async () => {
      console.log('📈 开始股票分析完整工作流程...')

      // 步骤1: 搜索和获取股票列表
      console.log('🔍 步骤1: 搜索股票...')
      const searchResponse = await performanceTester.measure(
        '搜索股票',
        () => testClient.getClient().get('/stocks?limit=5&active_only=true')
      )
      
      IntegrationAssertions.validatePaginatedResponse(searchResponse)
      expect(searchResponse.data.data.data.length).toBeGreaterThan(0)
      console.log(`✅ 找到 ${searchResponse.data.data.data.length} 只股票`)

      // 步骤2: 选择特定股票并获取详情
      console.log('📋 步骤2: 获取股票详情...')
      const selectedStock = searchResponse.data.data.data[0]
      const stockDetailResponse = await performanceTester.measure(
        '获取股票详情',
        () => testClient.getClient().get(`/stocks/${selectedStock.symbol}`)
      )
      
      IntegrationAssertions.validateApiResponse(stockDetailResponse)
      expect(stockDetailResponse.data.data.symbol).toBe(selectedStock.symbol)
      console.log(`✅ 获取股票 ${selectedStock.symbol} 详情成功`)

      // 步骤3: 获取股票历史数据
      console.log('📊 步骤3: 获取股票历史数据...')
      const startDate = '2023-01-01'
      const endDate = '2023-01-31'
      const stockDataResponse = await performanceTester.measure(
        '获取股票历史数据',
        () => testClient.getClient().get(
          `/stocks/${selectedStock.symbol}/data?start_date=${startDate}&end_date=${endDate}`
        )
      )
      
      IntegrationAssertions.validateApiResponse(stockDataResponse)
      expect(stockDataResponse.data.data.data.length).toBeGreaterThan(0)
      console.log(`✅ 获取 ${stockDataResponse.data.data.data.length} 条历史数据`)

      // 步骤4: 获取最新股票数据
      console.log('🔄 步骤4: 获取最新股票数据...')
      const latestDataResponse = await performanceTester.measure(
        '获取最新股票数据',
        () => testClient.getClient().get(`/stocks/${selectedStock.symbol}/latest`)
      )
      
      IntegrationAssertions.validateApiResponse(latestDataResponse)
      expect(latestDataResponse.data.data.latest_data).toBeDefined()
      console.log('✅ 获取最新数据成功')

      workflowStocks.push({
        symbol: selectedStock.symbol,
        detail: stockDetailResponse.data.data,
        history: stockDataResponse.data.data.data,
        latest: latestDataResponse.data.data.latest_data
      })

      console.log('🎉 股票分析完整工作流程完成')
    }, 30000) // 30秒超时
  })

  describe('模型管理完整工作流程', () => {
    it('应该能够完成完整的模型管理流程', async () => {
      console.log('🤖 开始模型管理完整工作流程...')

      // 步骤1: 获取模型列表
      console.log('📋 步骤1: 获取模型列表...')
      const modelsResponse = await performanceTester.measure(
        '获取模型列表',
        () => testClient.getClient().get('/models?active_only=true')
      )
      
      IntegrationAssertions.validatePaginatedResponse(modelsResponse)
      const initialModelCount = modelsResponse.data.data.data.length
      console.log(`✅ 找到 ${initialModelCount} 个模型`)

      // 步骤2: 创建新模型
      console.log('🆕 步骤2: 创建新模型...')
      const newModelData = {
        name: `工作流程测试模型_${Date.now()}`,
        description: '用于完整工作流程测试的模型',
        model_type: 'technical',
        parameters: { 
          period: 14,
          threshold: 0.5,
          short_window: 5,
          long_window: 20
        },
        is_active: true
      }

      const createModelResponse = await performanceTester.measure(
        '创建模型',
        () => testClient.getClient().post('/models', newModelData)
      )
      
      IntegrationAssertions.validateApiResponse(createModelResponse)
      const createdModel = createModelResponse.data.data
      expect(createdModel.name).toBe(newModelData.name)
      console.log(`✅ 创建模型 ${createdModel.name} 成功`)

      // 步骤3: 获取模型详情
      console.log('🔍 步骤3: 获取模型详情...')
      const modelDetailResponse = await performanceTester.measure(
        '获取模型详情',
        () => testClient.getClient().get(`/models/${createdModel.id}`)
      )
      
      IntegrationAssertions.validateApiResponse(modelDetailResponse)
      expect(modelDetailResponse.data.data.id).toBe(createdModel.id)
      console.log('✅ 获取模型详情成功')

      // 步骤4: 更新模型信息
      console.log('✏️ 步骤4: 更新模型信息...')
      const updateData = {
        description: '更新后的模型描述 - 工作流程测试',
        parameters: { ...newModelData.parameters, period: 21 }
      }

      const updateModelResponse = await performanceTester.measure(
        '更新模型',
        () => testClient.getClient().put(`/models/${createdModel.id}`, updateData)
      )
      
      IntegrationAssertions.validateApiResponse(updateModelResponse)
      expect(updateModelResponse.data.data.description).toBe(updateData.description)
      console.log('✅ 更新模型信息成功')

      // 步骤5: 验证模型列表更新
      console.log('🔄 步骤5: 验证模型列表更新...')
      const updatedModelsResponse = await performanceTester.measure(
        '验证模型列表',
        () => testClient.getClient().get('/models?active_only=true')
      )
      
      IntegrationAssertions.validatePaginatedResponse(updatedModelsResponse)
      expect(updatedModelsResponse.data.data.data.length).toBe(initialModelCount + 1)
      console.log('✅ 模型列表更新验证成功')

      workflowModels.push(createdModel)

      console.log('🎉 模型管理完整工作流程完成')
    }, 30000) // 30秒超时
  })

  describe('决策生成完整工作流程', () => {
    let testStock: any
    let testModel: any

    beforeAll(async () => {
      // 准备工作流程测试数据
      testStock = await dataManager.createTestStock(
        testClient.getClient(),
        'WORKFLOW001',
        '工作流程测试股票001'
      )
      
      await dataManager.createTestStockData(
        testClient.getClient(),
        'WORKFLOW001',
        30
      )

      testModel = await dataManager.createTestModel(
        testClient.getClient(),
        '工作流程决策模型',
        'technical'
      )
    })

    it('应该能够完成完整的决策生成流程', async () => {
      console.log('🎯 开始决策生成完整工作流程...')

      // 步骤1: 生成单个决策
      console.log('🔮 步骤1: 生成单个决策...')
      const decisionRequest = {
        symbol: 'WORKFLOW001',
        trade_date: '2023-01-15',
        current_position: 0.0
      }

      const singleDecisionResponse = await performanceTester.measure(
        '生成单个决策',
        () => testClient.getClient().post('/decisions/generate', decisionRequest)
      )
      
      IntegrationAssertions.validateApiResponse(singleDecisionResponse)
      IntegrationAssertions.validateDecisionData(singleDecisionResponse.data.data)
      console.log(`✅ 生成决策: ${singleDecisionResponse.data.data.final_decision.decision}`)

      // 步骤2: 批量生成决策
      console.log('📦 步骤2: 批量生成决策...')
      const batchRequest = {
        symbols: ['WORKFLOW001'],
        trade_date: '2023-01-15'
      }

      const batchDecisionResponse = await performanceTester.measure(
        '批量生成决策',
        () => testClient.getClient().post('/decisions/batch', batchRequest)
      )
      
      IntegrationAssertions.validateApiResponse(batchDecisionResponse)
      expect(batchDecisionResponse.data.data.success_count).toBeGreaterThan(0)
      console.log(`✅ 批量决策成功: ${batchDecisionResponse.data.data.success_count}/${batchDecisionResponse.data.data.total_count}`)

      // 步骤3: 获取决策历史
      console.log('📚 步骤3: 获取决策历史...')
      const startDate = '2023-01-01'
      const endDate = '2023-01-31'
      const decisionHistoryResponse = await performanceTester.measure(
        '获取决策历史',
        () => testClient.getClient().get(
          `/decisions/history/WORKFLOW001?start_date=${startDate}&end_date=${endDate}`
        )
      )
      
      IntegrationAssertions.validateApiResponse(decisionHistoryResponse)
      expect(decisionHistoryResponse.data.data.history.length).toBeGreaterThan(0)
      console.log(`✅ 获取 ${decisionHistoryResponse.data.data.history.length} 条决策历史`)

      // 步骤4: 获取决策列表
      console.log('📋 步骤4: 获取决策列表...')
      const decisionsListResponse = await performanceTester.measure(
        '获取决策列表',
        () => testClient.getClient().get('/decisions?limit=10')
      )
      
      IntegrationAssertions.validatePaginatedResponse(decisionsListResponse)
      console.log(`✅ 获取 ${decisionsListResponse.data.data.data.length} 条决策记录`)

      workflowDecisions.push({
        single: singleDecisionResponse.data.data,
        batch: batchDecisionResponse.data.data,
        history: decisionHistoryResponse.data.data.history,
        list: decisionsListResponse.data.data.data
      })

      console.log('🎉 决策生成完整工作流程完成')
    }, 30000) // 30秒超时
  })

  describe('回测分析完整工作流程', () => {
    let testStock: any
    let testModel: any

    beforeAll(async () => {
      // 准备工作流程测试数据
      testStock = await dataManager.createTestStock(
        testClient.getClient(),
        'BACKTEST001',
        '回测工作流程测试股票'
      )
      
      await dataManager.createTestStockData(
        testClient.getClient(),
        'BACKTEST001',
        60 // 创建60天的测试数据用于回测
      )

      testModel = await dataManager.createTestModel(
        testClient.getClient(),
        '回测工作流程模型',
        'technical'
      )
    })

    it('应该能够完成完整的回测分析流程', async () => {
      console.log('📊 开始回测分析完整工作流程...')

      // 步骤1: 运行模型回测
      console.log('🔄 步骤1: 运行模型回测...')
      const modelBacktestRequest = {
        symbol: 'BACKTEST001',
        start_date: '2023-01-01',
        end_date: '2023-02-28',
        initial_capital: 100000,
        model_ids: [testModel.id]
      }

      const modelBacktestResponse = await performanceTester.measure(
        '运行模型回测',
        () => testClient.getClient().post('/backtest/model', modelBacktestRequest)
      )
      
      IntegrationAssertions.validateApiResponse(modelBacktestResponse)
      expect(modelBacktestResponse.data.data.backtest_result.total_return).toBeDefined()
      console.log(`✅ 模型回测完成，总收益率: ${(modelBacktestResponse.data.data.backtest_result.total_return * 100).toFixed(2)}%`)

      // 步骤2: 运行组合回测
      console.log('📈 步骤2: 运行组合回测...')
      const portfolioBacktestRequest = {
        symbols: ['BACKTEST001'],
        start_date: '2023-01-01',
        end_date: '2023-02-28',
        initial_capital: 100000,
        rebalance_frequency: 'monthly'
      }

      const portfolioBacktestResponse = await performanceTester.measure(
        '运行组合回测',
        () => testClient.getClient().post('/backtest/portfolio', portfolioBacktestRequest)
      )
      
      IntegrationAssertions.validateApiResponse(portfolioBacktestResponse)
      expect(portfolioBacktestResponse.data.data.portfolio_result.total_return).toBeDefined()
      console.log(`✅ 组合回测完成，总收益率: ${(portfolioBacktestResponse.data.data.portfolio_result.total_return * 100).toFixed(2)}%`)

      // 步骤3: 比较回测结果
      console.log('⚖️ 步骤3: 比较回测结果...')
      const compareRequests = [
        {
          symbol: 'BACKTEST001',
          start_date: '2023-01-01',
          end_date: '2023-01-31',
          initial_capital: 100000,
          model_ids: [testModel.id]
        },
        {
          symbol: 'BACKTEST001',
          start_date: '2023-02-01',
          end_date: '2023-02-28',
          initial_capital: 100000,
          model_ids: [testModel.id]
        }
      ]

      const compareResponse = await performanceTester.measure(
        '比较回测结果',
        () => testClient.getClient().post('/backtest/compare', compareRequests)
      )
      
      IntegrationAssertions.validateApiResponse(compareResponse)
      expect(compareResponse.data.data.comparison.length).toBe(2)
      console.log(`✅ 回测比较完成，比较了 ${compareResponse.data.data.comparison.length} 个结果`)

      // 步骤4: 获取回测结果列表
      console.log('📋 步骤4: 获取回测结果列表...')
      const backtestResultsResponse = await performanceTester.measure(
        '获取回测结果列表',
        () => testClient.getClient().get('/backtest/results?limit=5')
      )
      
      IntegrationAssertions.validatePaginatedResponse(backtestResultsResponse)
      console.log(`✅ 获取 ${backtestResultsResponse.data.data.data.length} 条回测结果`)

      workflowBacktests.push({
        model: modelBacktestResponse.data.data,
        portfolio: portfolioBacktestResponse.data.data,
        comparison: compareResponse.data.data,
        results: backtestResultsResponse.data.data.data
      })

      console.log('🎉 回测分析完整工作流程完成')
    }, 45000) // 45秒超时
  })

  describe('端到端用户旅程', () => {
    it('应该能够模拟真实用户的完整投资分析旅程', async () => {
      console.log('👤 开始端到端用户旅程测试...')

      // 用户旅程: 新用户注册后进行的完整分析流程
      
      // 阶段1: 探索和发现
      console.log('🔍 阶段1: 探索和发现...')
      
      // 1.1 查看系统健康状态
      const healthResponse = await testClient.getClient().get('/health')
      expect(healthResponse.data.data.status).toBe('healthy')
      console.log('✅ 系统健康状态检查通过')

      // 1.2 浏览股票列表
      const stocksBrowseResponse = await testClient.getClient().get('/stocks?limit=20&active_only=true')
      expect(stocksBrowseResponse.data.data.data.length).toBeGreaterThan(0)
      console.log(`✅ 浏览 ${stocksBrowseResponse.data.data.data.length} 只股票`)

      // 1.3 搜索感兴趣的股票
      const searchResponse = await testClient.getClient().get('/stocks?symbol=TES')
      const searchResults = searchResponse.data.data.data
      console.log(`✅ 搜索到 ${searchResults.length} 只相关股票`)

      // 阶段2: 深入分析
      console.log('📊 阶段2: 深入分析...')
      
      if (searchResults.length > 0) {
        const targetStock = searchResults[0]
        
        // 2.1 查看股票详情
        const stockDetail = await testClient.getClient().get(`/stocks
        const targetStock = searchResults[0]
        
        // 2.1 查看股票详情
        const stockDetail = await testClient.getClient().get(`/stocks/${targetStock.symbol}`)
        expect(stockDetail.data.data.symbol).toBe(targetStock.symbol)
        console.log(`✅ 查看股票 ${targetStock.symbol} 详情`)

        // 2.2 分析股票历史数据
        const stockHistory = await testClient.getClient().get(
          `/stocks/${targetStock.symbol}/data?start_date=2023-01-01&end_date=2023-03-31`
        )
        expect(stockHistory.data.data.data.length).toBeGreaterThan(0)
        console.log(`✅ 分析 ${stockHistory.data.data.data.length} 条历史数据`)

        // 阶段3: 决策制定
        console.log('🎯 阶段3: 决策制定...')
        
        // 3.1 生成交易决策
        const decisionResponse = await testClient.getClient().post('/decisions/generate', {
          symbol: targetStock.symbol,
          trade_date: '2023-03-31',
          current_position: 0.0
        })
        expect(decisionResponse.data.data.final_decision.decision).toBeDefined()
        console.log(`✅ 生成决策: ${decisionResponse.data.data.final_decision.decision}`)

        // 3.2 查看可用模型
        const modelsResponse = await testClient.getClient().get('/models?active_only=true')
        const availableModels = modelsResponse.data.data.data
        console.log(`✅ 查看 ${availableModels.length} 个可用模型`)

        // 阶段4: 回测验证
        console.log('📈 阶段4: 回测验证...')
        
        if (availableModels.length > 0) {
          const selectedModel = availableModels[0]
          
          // 4.1 运行模型回测
          const backtestResponse = await testClient.getClient().post('/backtest/model', {
            symbol: targetStock.symbol,
            start_date: '2023-01-01',
            end_date: '2023-03-31',
            initial_capital: 100000,
            model_ids: [selectedModel.id]
          })
          expect(backtestResponse.data.data.backtest_result.total_return).toBeDefined()
          console.log(`✅ 回测完成，收益率: ${(backtestResponse.data.data.backtest_result.total_return * 100).toFixed(2)}%`)

          // 4.2 查看回测结果详情
          const backtestResults = await testClient.getClient().get('/backtest/results?limit=3')
          expect(backtestResults.data.data.data.length).toBeGreaterThanOrEqual(0)
          console.log(`✅ 查看 ${backtestResults.data.data.data.length} 条回测结果`)
        }

        // 阶段5: 总结和报告
        console.log('📋 阶段5: 总结和报告...')
        
        // 5.1 获取决策历史
        const decisionHistory = await testClient.getClient().get(
          `/decisions/history/${targetStock.symbol}?start_date=2023-01-01&end_date=2023-03-31`
        )
        expect(decisionHistory.data.data.history.length).toBeGreaterThanOrEqual(0)
        console.log(`✅ 查看 ${decisionHistory.data.data.history.length} 条决策历史`)

        // 5.2 获取系统性能指标
        const metricsResponse = await testClient.getClient().get('/metrics')
        expect(metricsResponse.data.data.cpu_percent).toBeDefined()
        console.log('✅ 查看系统性能指标')

        console.log('🎉 端到端用户旅程测试完成')
      }
    }, 60000) // 60秒超时
  })

  describe('错误处理和恢复工作流程', () => {
    it('应该能够处理各种错误情况并优雅恢复', async () => {
      console.log('🛡️ 开始错误处理和恢复工作流程测试...')

      // 测试1: 处理无效股票代码
      console.log('❌ 测试1: 处理无效股票代码...')
      try {
        await testClient.getClient().get('/stocks/INVALID_STOCK_999')
        throw new Error('应该抛出404错误')
      } catch (error: any) {
        expect(error.response?.status).toBe(404)
        console.log('✅ 正确处理无效股票代码')
      }

      // 测试2: 处理无效模型ID
      console.log('❌ 测试2: 处理无效模型ID...')
      try {
        await testClient.getClient().get('/models/999999')
        throw new Error('应该抛出404错误')
      } catch (error: any) {
        expect(error.response?.status).toBe(404)
        console.log('✅ 正确处理无效模型ID')
      }

      // 测试3: 处理无效日期范围
      console.log('❌ 测试3: 处理无效日期范围...')
      try {
        await testClient.getClient().get('/stocks/TEST001/data?start_date=2023-13-01&end_date=2023-01-01')
        throw new Error('应该抛出400错误')
      } catch (error: any) {
        expect([400, 422]).toContain(error.response?.status)
        console.log('✅ 正确处理无效日期范围')
      }

      // 测试4: 恢复后继续正常工作
      console.log('🔄 测试4: 错误恢复后继续工作...')
      
      // 在错误处理后，系统应该能够继续正常工作
      const healthResponse = await testClient.getClient().get('/health')
      expect(healthResponse.data.data.status).toBe('healthy')
      console.log('✅ 系统在错误处理后保持健康')

      const stocksResponse = await testClient.getClient().get('/stocks?limit=5')
      expect(stocksResponse.data.data.data.length).toBeGreaterThan(0)
      console.log('✅ 系统在错误处理后继续正常工作')

      console.log('🎉 错误处理和恢复工作流程测试完成')
    }, 30000) // 30秒超时
  })

  describe('数据一致性验证工作流程', () => {
    it('应该确保整个工作流程中的数据一致性', async () => {
      console.log('🔍 开始数据一致性验证工作流程...')

      // 验证1: 股票数据一致性
      console.log('📊 验证1: 股票数据一致性...')
      const stocksResponse = await testClient.getClient().get('/stocks?limit=10')
      const stocks = stocksResponse.data.data.data

      for (const stock of stocks) {
        IntegrationAssertions.validateStockData(stock)
        
        // 验证股票详情与列表中的信息一致
        const detailResponse = await testClient.getClient().get(`/stocks/${stock.symbol}`)
        expect(detailResponse.data.data.symbol).toBe(stock.symbol)
        expect(detailResponse.data.data.name).toBe(stock.name)
      }
      console.log(`✅ 验证 ${stocks.length} 只股票数据一致性`)

      // 验证2: 模型数据一致性
      console.log('🤖 验证2: 模型数据一致性...')
      const modelsResponse = await testClient.getClient().get('/models?limit=10')
      const models = modelsResponse.data.data.data

      for (const model of models) {
        IntegrationAssertions.validateModelData(model)
        
        // 验证模型详情与列表中的信息一致
        const detailResponse = await testClient.getClient().get(`/models/${model.id}`)
        expect(detailResponse.data.data.name).toBe(model.name)
        expect(detailResponse.data.data.model_type).toBe(model.model_type)
      }
      console.log(`✅ 验证 ${models.length} 个模型数据一致性`)

      // 验证3: 决策数据逻辑一致性
      console.log('🎯 验证3: 决策数据逻辑一致性...')
      const decisionsResponse = await testClient.getClient().get('/decisions?limit=5')
      const decisions = decisionsResponse.data.data.data

      for (const decision of decisions) {
        expect(decision.symbol).toBeTruthy()
        expect(decision.trade_date).toBeTruthy()
        expect(['BUY', 'SELL', 'HOLD']).toContain(decision.final_decision)
        expect(decision.confidence_score).toBeGreaterThanOrEqual(0)
        expect(decision.confidence_score).toBeLessThanOrEqual(1)
      }
      console.log(`✅ 验证 ${decisions.length} 条决策数据逻辑一致性`)

      console.log('🎉 数据一致性验证工作流程完成')
    }, 45000) // 45秒超时
  })

  describe('工作流程性能基准', () => {
    it('应该满足工作流程性能要求', async () => {
      console.log('⚡ 开始工作流程性能基准测试...')

      // 基准1: 股票探索工作流程性能
      console.log('📈 基准1: 股票探索工作流程...')
      const exploreStartTime = performance.now()
      
      await testClient.getClient().get('/stocks?limit=10')
      await testClient.getClient().get('/stocks/TEST001')
      await testClient.getClient().get('/stocks/TEST001/data?start_date=2023-01-01&end_date=2023-01-10')
      
      const exploreDuration = performance.now() - exploreStartTime
      expect(exploreDuration).toBeLessThan(5000) // 5秒
      console.log(`✅ 股票探索工作流程耗时: ${exploreDuration.toFixed(2)}ms`)

      // 基准2: 决策生成工作流程性能
      console.log('🎯 基准2: 决策生成工作流程...')
      const decisionStartTime = performance.now()
      
      await testClient.getClient().post('/decisions/generate', {
        symbol: 'TEST001',
        trade_date: '2023-01-05',
        current_position: 0.0
      })
      
      const decisionDuration = performance.now() - decisionStartTime
      expect(decisionDuration).toBeLessThan(10000) // 10秒
      console.log(`✅ 决策生成工作流程耗时: ${decisionDuration.toFixed(2)}ms`)

      // 基准3: 回测分析工作流程性能
      console.log('📊 基准3: 回测分析工作流程...')
      const backtestStartTime = performance.now()
      
      await testClient.getClient().post('/backtest/model', {
        symbol: 'TEST001',
        start_date: '2023-01-01',
        end_date: '2023-01-10',
        initial_capital: 100000,
        model_ids: [1]
      })
      
      const backtestDuration = performance.now() - backtestStartTime
      expect(backtestDuration).toBeLessThan(15000) // 15秒
      console.log(`✅ 回测分析工作流程耗时: ${backtestDuration.toFixed(2)}ms`)

      console.log('🎉 工作流程性能基准测试完成')
    }, 60000) // 60秒超时
  })

  describe('工作流程总结报告', () => {
    afterAll(() => {
      console.log('\n📋 完整工作流程集成测试总结报告:')
      console.log(`📈 股票分析工作流程: ${workflowStocks.length} 个流程完成`)
      console.log(`🤖 模型管理工作流程: ${workflowModels.length} 个流程完成`)
      console.log(`🎯 决策生成工作流程: ${workflowDecisions.length} 个流程完成`)
      console.log(`📊 回测分析工作流程: ${workflowBacktests.length} 个流程完成`)
      
      const stats = dataManager.getStats()
      console.log('🧹 测试数据统计:')
      Object.entries(stats).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} 条记录`)
      })
    })
  })
})