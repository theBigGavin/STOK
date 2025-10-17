/**
 * 性能集成测试
 * 测试系统在高负载下的表现、API响应时间和吞吐量
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

// 性能测试配置
const PERFORMANCE_CONFIG = {
  ...DEFAULT_INTEGRATION_CONFIG,
  timeout: 120000, // 性能测试需要更长的超时时间
  retryAttempts: 3
}

// 性能基准配置
const PERFORMANCE_BENCHMARKS = {
  // API响应时间基准（毫秒）
  responseTime: {
    healthCheck: 1000,
    stockList: 2000,
    stockDetail: 1500,
    modelList: 2000,
    decisionGeneration: 5000,
    backtest: 10000,
    portfolioBacktest: 15000
  },
  // 吞吐量基准（请求/秒）
  throughput: {
    healthCheck: 10,
    stockList: 5,
    stockDetail: 8,
    modelList: 5,
    decisionGeneration: 2,
    backtest: 1
  },
  // 并发用户基准
  concurrency: {
    light: 5,
    medium: 10,
    heavy: 20
  }
}

describe('性能集成测试', () => {
  let testClient: IntegrationTestClient
  let dataManager: TestDataManager
  let performanceTester: PerformanceTester
  let testEnvironment: any

  // 性能测试结果
  let performanceResults: any = {
    responseTimes: {},
    throughput: {},
    concurrency: {},
    loadTests: {}
  }

  beforeAll(async () => {
    console.log('🚀 启动性能集成测试...')
    
    // 初始化测试环境
    testEnvironment = setupIntegrationTestEnvironment()
    testClient = testEnvironment.testClient
    dataManager = testEnvironment.dataManager
    performanceTester = testEnvironment.performanceTester

    // 等待服务可用
    console.log('⏳ 等待后端服务启动...')
    await testClient.waitForService(120000)
    console.log('✅ 后端服务已就绪')

    // 准备性能测试数据
    console.log('📊 准备性能测试数据...')
    await preparePerformanceTestData()
    console.log('✅ 性能测试数据准备完成')
  })

  afterAll(async () => {
    console.log('🧹 清理性能测试数据...')
    await dataManager.cleanup()
    console.log('✅ 性能测试数据清理完成')

    // 输出性能测试总结报告
    generatePerformanceReport()
  })

  beforeEach(async () => {
    // 重置性能测试器
    performanceTester.reset()
  })

  afterEach(async () => {
    // 记录性能测试结果
    const report = performanceTester.getReport()
    if (report.summary.totalOperations > 0) {
      console.log('📊 性能测试报告:', report.summary)
    }
  })

  // 准备性能测试数据
  async function preparePerformanceTestData(): Promise<void> {
    // 创建多个测试股票用于性能测试
    for (let i = 1; i <= 10; i++) {
      await dataManager.createTestStock(
        testClient.getClient(),
        `PERF${i.toString().padStart(3, '0')}`,
        `性能测试股票${i}`
      )
      
      // 为每个股票创建测试数据
      await dataManager.createTestStockData(
        testClient.getClient(),
        `PERF${i.toString().padStart(3, '0')}`,
        100 // 创建100天的测试数据
      )
    }

    // 创建多个测试模型用于性能测试
    for (let i = 1; i <= 5; i++) {
      await dataManager.createTestModel(
        testClient.getClient(),
        `性能测试模型${i}`,
        i % 2 === 0 ? 'technical' : 'fundamental'
      )
    }
  }

  // 生成性能测试报告
  function generatePerformanceReport(): void {
    console.log('\n📋 性能集成测试总结报告:')
    console.log('='.repeat(50))
    
    // 响应时间报告
    console.log('\n⏱️ 响应时间性能:')
    Object.entries(performanceResults.responseTimes).forEach(([endpoint, result]: [string, any]) => {
      const benchmark = PERFORMANCE_BENCHMARKS.responseTime[endpoint as keyof typeof PERFORMANCE_BENCHMARKS.responseTime] || 5000
      const status = result.avg <= benchmark ? '✅' : '❌'
      console.log(`  ${status} ${endpoint}: ${result.avg.toFixed(2)}ms (基准: ${benchmark}ms)`)
    })

    // 吞吐量报告
    console.log('\n📈 吞吐量性能:')
    Object.entries(performanceResults.throughput).forEach(([endpoint, result]: [string, any]) => {
      const benchmark = PERFORMANCE_BENCHMARKS.throughput[endpoint as keyof typeof PERFORMANCE_BENCHMARKS.throughput] || 5
      const status = result.requestsPerSecond >= benchmark ? '✅' : '❌'
      console.log(`  ${status} ${endpoint}: ${result.requestsPerSecond.toFixed(2)} req/s (基准: ${benchmark} req/s)`)
    })

    // 并发性能报告
    console.log('\n👥 并发性能:')
    Object.entries(performanceResults.concurrency).forEach(([level, result]: [string, any]) => {
      const successRate = (result.successful / result.total) * 100
      const status = successRate >= 90 ? '✅' : '❌'
      console.log(`  ${status} ${level}并发: ${successRate.toFixed(1)}% 成功率`)
    })

    console.log('\n🎉 性能测试完成')
  }

  describe('API响应时间测试', () => {
    it('应该满足健康检查API响应时间要求', async () => {
      const responseTimes: number[] = []
      
      // 执行多次健康检查测试响应时间稳定性
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        await testClient.getClient().get('/health')
        const endTime = performance.now()
        responseTimes.push(endTime - startTime)
        
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      const maxResponseTime = Math.max(...responseTimes)
      const minResponseTime = Math.min(...responseTimes)

      performanceResults.responseTimes.healthCheck = {
        avg: avgResponseTime,
        min: minResponseTime,
        max: maxResponseTime,
        measurements: responseTimes.length
      }

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_BENCHMARKS.responseTime.healthCheck)
      console.log(`✅ 健康检查API响应时间: ${avgResponseTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.responseTime.healthCheck}ms)`)
    })

    it('应该满足股票列表API响应时间要求', async () => {
      const responseTimes: number[] = []
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        await testClient.getClient().get('/stocks?limit=50')
        const endTime = performance.now()
        responseTimes.push(endTime - startTime)
        
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length

      performanceResults.responseTimes.stockList = {
        avg: avgResponseTime,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        measurements: responseTimes.length
      }

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_BENCHMARKS.responseTime.stockList)
      console.log(`✅ 股票列表API响应时间: ${avgResponseTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.responseTime.stockList}ms)`)
    })

    it('应该满足股票详情API响应时间要求', async () => {
      const responseTimes: number[] = []
      
      for (let i = 1; i <= 5; i++) {
        const startTime = performance.now()
        await testClient.getClient().get(`/stocks/PERF${i.toString().padStart(3, '0')}`)
        const endTime = performance.now()
        responseTimes.push(endTime - startTime)
        
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length

      performanceResults.responseTimes.stockDetail = {
        avg: avgResponseTime,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        measurements: responseTimes.length
      }

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_BENCHMARKS.responseTime.stockDetail)
      console.log(`✅ 股票详情API响应时间: ${avgResponseTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.responseTime.stockDetail}ms)`)
    })

    it('应该满足模型列表API响应时间要求', async () => {
      const responseTimes: number[] = []
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        await testClient.getClient().get('/models?limit=20')
        const endTime = performance.now()
        responseTimes.push(endTime - startTime)
        
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length

      performanceResults.responseTimes.modelList = {
        avg: avgResponseTime,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        measurements: responseTimes.length
      }

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_BENCHMARKS.responseTime.modelList)
      console.log(`✅ 模型列表API响应时间: ${avgResponseTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.responseTime.modelList}ms)`)
    })

    it('应该满足决策生成API响应时间要求', async () => {
      const responseTimes: number[] = []
      
      for (let i = 1; i <= 3; i++) {
        const startTime = performance.now()
        await testClient.getClient().post('/decisions/generate', {
          symbol: `PERF${i.toString().padStart(3, '0')}`,
          trade_date: '2023-03-15',
          current_position: 0.0
        })
        const endTime = performance.now()
        responseTimes.push(endTime - startTime)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length

      performanceResults.responseTimes.decisionGeneration = {
        avg: avgResponseTime,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        measurements: responseTimes.length
      }

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_BENCHMARKS.responseTime.decisionGeneration)
      console.log(`✅ 决策生成API响应时间: ${avgResponseTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.responseTime.decisionGeneration}ms)`)
    })

    it('应该满足回测分析API响应时间要求', async () => {
      const responseTimes: number[] = []
      
      for (let i = 1; i <= 2; i++) {
        const startTime = performance.now()
        await testClient.getClient().post('/backtest/model', {
          symbol: `PERF${i.toString().padStart(3, '0')}`,
          start_date: '2023-01-01',
          end_date: '2023-03-31',
          initial_capital: 100000,
          model_ids: [1]
        })
        const endTime = performance.now()
        responseTimes.push(endTime - startTime)
        
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length

      performanceResults.responseTimes.backtest = {
        avg: avgResponseTime,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        measurements: responseTimes.length
      }

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_BENCHMARKS.responseTime.backtest)
      console.log(`✅ 回测分析API响应时间: ${avgResponseTime.toFixed(2)}ms (基准: ${PERFORMANCE_BENCHMARKS.responseTime.backtest}ms)`)
    })
  })

  describe('吞吐量测试', () => {
    it('应该满足健康检查API吞吐量要求', async () => {
      const testDuration = 5000 // 5秒测试
      const startTime = performance.now()
      let requestCount = 0
      
      while (performance.now() - startTime < testDuration) {
        try {
          await testClient.getClient().get('/health')
          requestCount++
        } catch (error) {
          // 忽略错误继续测试
        }
        
        // 短暂延迟避免过度负载
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      const actualDuration = performance.now() - startTime
      const requestsPerSecond = (requestCount / actualDuration) * 1000

      performanceResults.throughput.healthCheck = {
        requestsPerSecond,
        totalRequests: requestCount,
        testDuration: actualDuration
      }

      expect(requestsPerSecond).toBeGreaterThanOrEqual(PERFORMANCE_BENCHMARKS.throughput.healthCheck)
      console.log(`✅ 健康检查API吞吐量: ${requestsPerSecond.toFixed(2)} req/s (基准: ${PERFORMANCE_BENCHMARKS.throughput.healthCheck} req/s)`)
    })

    it('应该满足股票列表API吞吐量要求', async () => {
      const testDuration = 10000 // 10秒测试
      const startTime = performance.now()
      let requestCount = 0
      
      while (performance.now() - startTime < testDuration) {
        try {
          await testClient.getClient().get('/stocks?limit=10')
          requestCount++
        } catch (error) {
          // 忽略错误继续测试
        }
        
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      const actualDuration = performance.now() - startTime
      const requestsPerSecond = (requestCount / actualDuration) * 1000

      performanceResults.throughput.stockList = {
        requestsPerSecond,
        totalRequests: requestCount,
        testDuration: actualDuration
      }

      expect(requestsPerSecond).toBeGreaterThanOrEqual(PERFORMANCE_BENCHMARKS.throughput.stockList)
      console.log(`✅ 股票列表API吞吐量: ${requestsPerSecond.toFixed(2)} req/s (基准: ${PERFORMANCE_BENCHMARKS.throughput.stockList} req/s)`)
    })

    it('应该满足股票详情API吞吐量要求', async () => {
      const testDuration = 10000 // 10秒测试
      const startTime = performance.now()
      let requestCount = 0
      const symbols = ['PERF001', 'PERF002', 'PERF003', 'PERF004', 'PERF005']
      
      while (performance.now() - startTime < testDuration) {
        const symbol = symbols[requestCount % symbols.length]
        try {
          await testClient.getClient().get(`/stocks/${symbol}`)
          requestCount++
        } catch (error) {
          // 忽略错误继续测试
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const actualDuration = performance.now() - startTime
      const requestsPerSecond = (requestCount / actualDuration) * 1000

      performanceResults.throughput.stockDetail = {
        requestsPerSecond,
        totalRequests: requestCount,
        testDuration: actualDuration
      }

      expect(requestsPerSecond).toBeGreaterThanOrEqual(PERFORMANCE_BENCHMARKS.throughput.stockDetail)
      console.log(`✅ 股票详情API吞吐量: ${requestsPerSecond.toFixed(2)} req/s (基准: ${PERFORMANCE_BENCHMARKS.throughput.stockDetail} req/s)`)
    })
  })

  describe('并发性能测试', () => {
    it('应该满足轻度并发负载要求', async () => {
      const concurrentUsers = PERFORMANCE_BENCHMARKS.concurrency.light
      const testPromises = []
      
      for (let i = 0; i < concurrentUsers; i++) {
        testPromises.push(
          testClient.getClient().get('/health').then(() => 'success').catch(() => 'failed')
        )
      }
      
      const results = await Promise.all(testPromises)
      const successful = results.filter(result => result === 'success').length
      
      performanceResults.concurrency.light = {
        successful,
        total: concurrentUsers,
        successRate: (successful / concurrentUsers) * 100
      }

      expect(successful).toBeGreaterThanOrEqual(concurrentUsers * 0.9) // 90%成功率
      console.log(`✅ 轻度并发负载: ${successful}/${concurrentUsers} 成功 (${((successful / concurrentUsers) * 100).toFixed(1)}%)`)
    })

    it('应该满足中度并发负载要求', async () => {
      const concurrentUsers = PERFORMANCE_BENCHMARKS.concurrency.medium
      const testPromises = []
      
      for (
      for (let i = 0; i < concurrentUsers; i++) {
        testPromises.push(
          testClient.getClient().get('/stocks?limit=5').then(() => 'success').catch(() => 'failed')
        )
      }
      
      const results = await Promise.all(testPromises)
      const successful = results.filter(result => result === 'success').length
      
      performanceResults.concurrency.medium = {
        successful,
        total: concurrentUsers,
        successRate: (successful / concurrentUsers) * 100
      }

      expect(successful).toBeGreaterThanOrEqual(concurrentUsers * 0.8) // 80%成功率
      console.log(`✅ 中度并发负载: ${successful}/${concurrentUsers} 成功 (${((successful / concurrentUsers) * 100).toFixed(1)}%)`)
    })

    it('应该满足重度并发负载要求', async () => {
      const concurrentUsers = PERFORMANCE_BENCHMARKS.concurrency.heavy
      const testPromises = []
      
      for (let i = 0; i < concurrentUsers; i++) {
        // 混合不同类型的请求
        if (i % 3 === 0) {
          testPromises.push(testClient.getClient().get('/health').then(() => 'success').catch(() => 'failed'))
        } else if (i % 3 === 1) {
          testPromises.push(testClient.getClient().get('/stocks?limit=3').then(() => 'success').catch(() => 'failed'))
        } else {
          testPromises.push(testClient.getClient().get('/models?limit=3').then(() => 'success').catch(() => 'failed'))
        }
      }
      
      const results = await Promise.all(testPromises)
      const successful = results.filter(result => result === 'success').length
      
      performanceResults.concurrency.heavy = {
        successful,
        total: concurrentUsers,
        successRate: (successful / concurrentUsers) * 100
      }

      expect(successful).toBeGreaterThanOrEqual(concurrentUsers * 0.7) // 70%成功率
      console.log(`✅ 重度并发负载: ${successful}/${concurrentUsers} 成功 (${((successful / concurrentUsers) * 100).toFixed(1)}%)`)
    })
  })

  describe('负载压力测试', () => {
    it('应该在高负载下保持系统稳定性', async () => {
      console.log('⚡ 执行高负载压力测试...')
      
      const testDuration = 30000 // 30秒负载测试
      const startTime = performance.now()
      let totalRequests = 0
      let successfulRequests = 0
      let failedRequests = 0
      
      const endpoints = [
        '/health',
        '/stocks?limit=5',
        '/models?limit=5',
        '/stocks/PERF001',
        '/stocks/PERF001/data?start_date=2023-01-01&end_date=2023-01-10'
      ]
      
      // 创建负载生成器
      const loadGenerators = []
      
      for (let i = 0; i < 3; i++) {
        loadGenerators.push(
          (async () => {
            while (performance.now() - startTime < testDuration) {
              const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
              try {
                await testClient.getClient().get(endpoint)
                successfulRequests++
              } catch (error) {
                failedRequests++
              }
              totalRequests++
              
              // 随机延迟
              await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
            }
          })()
        )
      }
      
      // 等待所有负载生成器完成
      await Promise.all(loadGenerators)
      
      const actualDuration = performance.now() - startTime
      const requestsPerSecond = (totalRequests / actualDuration) * 1000
      const successRate = (successfulRequests / totalRequests) * 100
      
      performanceResults.loadTests.stability = {
        totalRequests,
        successfulRequests,
        failedRequests,
        requestsPerSecond,
        successRate,
        testDuration: actualDuration
      }

      expect(successRate).toBeGreaterThanOrEqual(80) // 80%成功率
      console.log(`✅ 高负载稳定性测试: ${successRate.toFixed(1)}% 成功率, ${requestsPerSecond.toFixed(2)} req/s`)
    })

    it('应该在持续负载下保持响应时间稳定', async () => {
      console.log('📊 执行持续负载响应时间测试...')
      
      const testDuration = 60000 // 60秒持续负载
      const measurementInterval = 5000 // 每5秒测量一次
      const startTime = performance.now()
      const responseTimeMeasurements: number[] = []
      
      const loadGenerator = setInterval(async () => {
        // 执行一些请求来维持负载
        await Promise.all([
          testClient.getClient().get('/health').catch(() => null),
          testClient.getClient().get('/stocks?limit=5').catch(() => null),
          testClient.getClient().get('/models?limit=5').catch(() => null)
        ])
      }, 1000)
      
      // 定期测量响应时间
      const measurementIntervalId = setInterval(async () => {
        const measurementStart = performance.now()
        try {
          await testClient.getClient().get('/health')
          const measurementEnd = performance.now()
          responseTimeMeasurements.push(measurementEnd - measurementStart)
        } catch (error) {
          // 忽略测量失败
        }
      }, measurementInterval)
      
      // 等待测试完成
      await new Promise(resolve => setTimeout(resolve, testDuration))
      
      clearInterval(loadGenerator)
      clearInterval(measurementIntervalId)
      
      // 分析响应时间稳定性
      if (responseTimeMeasurements.length > 0) {
        const avgResponseTime = responseTimeMeasurements.reduce((sum, time) => sum + time, 0) / responseTimeMeasurements.length
        const responseTimeVariance = responseTimeMeasurements.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimeMeasurements.length
        const responseTimeStdDev = Math.sqrt(responseTimeVariance)
        
        performanceResults.loadTests.responseTimeStability = {
          measurements: responseTimeMeasurements.length,
          avgResponseTime,
          stdDev: responseTimeStdDev,
          coefficientOfVariation: (responseTimeStdDev / avgResponseTime) * 100
        }

        // 响应时间变异系数应小于50%
        const coefficientOfVariation = (responseTimeStdDev / avgResponseTime) * 100
        expect(coefficientOfVariation).toBeLessThan(50)
        console.log(`✅ 持续负载响应时间稳定性: 变异系数 ${coefficientOfVariation.toFixed(1)}%`)
      }
    })
  })

  describe('内存和资源使用测试', () => {
    it('应该在长时间运行后保持内存使用稳定', async () => {
      console.log('🧠 执行内存使用稳定性测试...')
      
      const initialMetrics = await testClient.getClient().get('/metrics')
      const initialMemory = initialMetrics.data.data.memory_percent
      
      // 执行一系列操作来测试内存使用
      const operations = []
      for (let i = 0; i < 50; i++) {
        operations.push(
          testClient.getClient().get('/stocks?limit=10'),
          testClient.getClient().get('/models?limit=10'),
          testClient.getClient().get(`/stocks/PERF${(i % 10) + 1}`)
        )
      }
      
      await Promise.all(operations)
      
      const finalMetrics = await testClient.getClient().get('/metrics')
      const finalMemory = finalMetrics.data.data.memory_percent
      
      if (initialMemory !== null && finalMemory !== null) {
        const memoryIncrease = finalMemory - initialMemory
        
        performanceResults.resourceUsage = {
          initialMemory,
          finalMemory,
          memoryIncrease,
          operationsCount: operations.length
        }

        // 内存增长不应超过10%
        expect(memoryIncrease).toBeLessThan(10)
        console.log(`✅ 内存使用稳定性测试: 内存增长 ${memoryIncrease.toFixed(2)}%`)
      } else {
        console.log('⚠️ 内存使用数据不可用，跳过内存稳定性测试')
      }
    })
  })
})