// 集成测试设置文件
// 在所有集成测试运行前执行

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { IntegrationTestClient, TestDataManager } from './test-helpers'

// 全局测试客户端实例
let testClient: IntegrationTestClient
let testDataManager: TestDataManager

// 测试环境配置
const TEST_CONFIG = {
  apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1',
  timeout: parseInt(process.env.TEST_TIMEOUT || '120000'),
  retryAttempts: parseInt(process.env.TEST_RETRY_COUNT || '3'),
  retryDelay: 1000
}

// 在所有测试运行前执行
beforeAll(async () => {
  console.log('🚀 启动集成测试环境...')
  
  // 创建测试客户端
  testClient = new IntegrationTestClient({
    baseURL: TEST_CONFIG.apiBaseUrl,
    timeout: TEST_CONFIG.timeout,
    retryAttempts: TEST_CONFIG.retryAttempts,
    retryDelay: TEST_CONFIG.retryDelay
  })
  
  // 创建测试数据管理器
  testDataManager = new TestDataManager()
  
  // 等待服务就绪
  await testClient.waitForService(TEST_CONFIG.timeout)
  
  console.log('✅ 集成测试环境已就绪')
}, TEST_CONFIG.timeout)

// 在每个测试运行前执行
beforeEach(async () => {
  // 清理测试数据
  await testDataManager.cleanup()
  
  // 设置测试超时
  vi.setConfig({ testTimeout: TEST_CONFIG.timeout })
})

// 在每个测试运行后执行
afterEach(async () => {
  // 清理测试数据
  await testDataManager.cleanup()
})

// 在所有测试运行后执行
afterAll(async () => {
  console.log('🧹 清理集成测试环境...')
  
  // 清理所有测试数据
  await testDataManager.cleanup()
  
  console.log('✅ 集成测试环境已清理')
})

// 导出全局测试工具
export { testClient, testDataManager, TEST_CONFIG }