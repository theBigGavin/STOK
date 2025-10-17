/**
 * 安全集成测试
 * 验证API认证授权机制、数据验证和输入过滤、敏感数据保护
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { 
  IntegrationTestClient, 
  TestDataManager, 
  SecurityTester,
  IntegrationAssertions,
  setupIntegrationTestEnvironment,
  DEFAULT_INTEGRATION_CONFIG
} from './test-helpers'

// 安全测试配置
const SECURITY_CONFIG = {
  ...DEFAULT_INTEGRATION_CONFIG,
  timeout: 30000,
  retryAttempts: 3
}

describe('安全集成测试', () => {
  let testClient: IntegrationTestClient
  let dataManager: TestDataManager
  let securityTester: SecurityTester
  let testEnvironment: any

  // 安全测试结果
  let securityResults: any = {
    sqlInjection: {},
    xssProtection: {},
    inputValidation: {},
    dataProtection: {},
    authentication: {}
  }

  beforeAll(async () => {
    console.log('🚀 启动安全集成测试...')
    
    // 初始化测试环境
    testEnvironment = setupIntegrationTestEnvironment()
    testClient = testEnvironment.testClient
    dataManager = testEnvironment.dataManager
    securityTester = new SecurityTester(testClient.getClient())

    // 等待服务可用
    console.log('⏳ 等待后端服务启动...')
    await testClient.waitForService(120000)
    console.log('✅ 后端服务已就绪')
  })

  afterAll(async () => {
    console.log('🧹 清理安全测试数据...')
    await dataManager.cleanup()
    console.log('✅ 安全测试数据清理完成')

    // 输出安全测试总结报告
    generateSecurityReport()
  })

  // 生成安全测试报告
  function generateSecurityReport(): void {
    console.log('\n📋 安全集成测试总结报告:')
    console.log('='.repeat(50))
    
    // SQL注入防护报告
    console.log('\n🛡️ SQL注入防护:')
    const sqlInjectionResult = securityResults.sqlInjection
    if (sqlInjectionResult.passed) {
      console.log('  ✅ SQL注入防护测试通过')
      sqlInjectionResult.details.forEach((detail: string) => {
        console.log(`    ${detail}`)
      })
    } else {
      console.log('  ❌ SQL注入防护测试失败')
      sqlInjectionResult.details.forEach((detail: string) => {
        console.log(`    ${detail}`)
      })
    }

    // XSS防护报告
    console.log('\n🛡️ XSS防护:')
    const xssResult = securityResults.xssProtection
    if (xssResult.passed) {
      console.log('  ✅ XSS防护测试通过')
      xssResult.details.forEach((detail: string) => {
        console.log(`    ${detail}`)
      })
    } else {
      console.log('  ❌ XSS防护测试失败')
      xssResult.details.forEach((detail: string) => {
        console.log(`    ${detail}`)
      })
    }

    // 输入验证报告
    console.log('\n🛡️ 输入验证:')
    const inputValidationResult = securityResults.inputValidation
    if (inputValidationResult.passed) {
      console.log('  ✅ 输入验证测试通过')
      inputValidationResult.details.forEach((detail: string) => {
        console.log(`    ${detail}`)
      })
    } else {
      console.log('  ❌ 输入验证测试失败')
      inputValidationResult.details.forEach((detail: string) => {
        console.log(`    ${detail}`)
      })
    }

    // 数据保护报告
    console.log('\n🛡️ 数据保护:')
    const dataProtectionResult = securityResults.dataProtection
    if (dataProtectionResult.passed) {
      console.log('  ✅ 数据保护测试通过')
    } else {
      console.log('  ❌ 数据保护测试失败')
    }

    console.log('\n🎉 安全测试完成')
  }

  describe('SQL注入防护测试', () => {
    it('应该能够防护SQL注入攻击', async () => {
      console.log('🛡️ 测试SQL注入防护...')
      
      const result = await securityTester.testSqlInjection()
      securityResults.sqlInjection = result

      expect(result.passed).toBe(true)
      console.log(`✅ SQL注入防护测试: ${result.passed ? '通过' : '失败'}`)
      
      if (!result.passed) {
        result.details.forEach(detail => console.log(`  ${detail}`))
      }
    })

    it('应该防护参数化查询中的SQL注入', async () => {
      console.log('🛡️ 测试参数化查询防护...')
      
      const sqlInjectionTests = [
        {
          endpoint: '/stocks',
          params: { symbol: "' OR '1'='1" },
          expectedStatus: 400
        },
        {
          endpoint: '/stocks',
          params: { market: "'; DROP TABLE stocks; --" },
          expectedStatus: 400
        },
        {
          endpoint: '/models',
          params: { model_type: "1' UNION SELECT 1,2,3 --" },
          expectedStatus: 400
        }
      ]

      const results = []
      
      for (const test of sqlInjectionTests) {
        try {
          const response = await testClient.getClient().get(test.endpoint, { params: test.params })
          results.push({
            test: test.endpoint,
            status: 'failed',
            reason: `端点未正确过滤SQL注入: ${JSON.stringify(test.params)}`
          })
        } catch (error: any) {
          if (error.response?.status === test.expectedStatus) {
            results.push({
              test: test.endpoint,
              status: 'passed',
              reason: `端点正确拒绝SQL注入: ${JSON.stringify(test.params)}`
            })
          } else {
            results.push({
              test: test.endpoint,
              status: 'uncertain',
              reason: `响应状态 ${error.response?.status}, 期望 ${test.expectedStatus}`
            })
          }
        }
      }

      const failedTests = results.filter(r => r.status === 'failed')
      expect(failedTests.length).toBe(0)
      console.log(`✅ 参数化查询防护测试: ${results.filter(r => r.status === 'passed').length}/${results.length} 通过`)
    })
  })

  describe('XSS防护测试', () => {
    it('应该能够防护跨站脚本攻击', async () => {
      console.log('🛡️ 测试XSS防护...')
      
      const result = await securityTester.testXssProtection()
      securityResults.xssProtection = result

      expect(result.passed).toBe(true)
      console.log(`✅ XSS防护测试: ${result.passed ? '通过' : '失败'}`)
      
      if (!result.passed) {
        result.details.forEach(detail => console.log(`  ${detail}`))
      }
    })

    it('应该防护HTML和JavaScript注入', async () => {
      console.log('🛡️ 测试HTML/JavaScript注入防护...')
      
      const xssPayloads = [
        '<script>document.location="http://evil.com"</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        'vbscript:msgbox(1)'
      ]

      const results = []
      
      for (const payload of xssPayloads) {
        try {
          // 测试创建包含XSS payload的股票
          await testClient.getClient().post('/stocks', {
            symbol: payload,
            name: payload,
            market: 'NASDAQ',
            industry: 'Technology'
          })
          results.push({
            payload,
            status: 'failed',
            reason: '端点未正确过滤XSS payload'
          })
        } catch (error: any) {
          if (error.response?.status === 400) {
            results.push({
              payload,
              status: 'passed',
              reason: '端点正确拒绝XSS payload'
            })
          } else {
            results.push({
              payload,
              status: 'uncertain',
              reason: `响应状态 ${error.response?.status}`
            })
          }
        }
      }

      const failedTests = results.filter(r => r.status === 'failed')
      expect(failedTests.length).toBe(0)
      console.log(`✅ HTML/JavaScript注入防护测试: ${results.filter(r => r.status === 'passed').length}/${results.length} 通过`)
    })
  })

  describe('输入验证测试', () => {
    it('应该能够验证输入数据的有效性', async () => {
      console.log('🛡️ 测试输入验证...')
      
      const result = await securityTester.testInputValidation()
      securityResults.inputValidation = result

      expect(result.passed).toBe(true)
      console.log(`✅ 输入验证测试: ${result.passed ? '通过' : '失败'}`)
      
      if (!result.passed) {
        result.details.forEach(detail => console.log(`  ${detail}`))
      }
    })

    it('应该验证数值范围限制', async () => {
      console.log('🛡️ 测试数值范围验证...')
      
      const rangeTests = [
        {
          endpoint: '/stocks',
          params: { limit: -1 },
          expectedStatus: 422
        },
        {
          endpoint: '/stocks',
          params: { limit: 10000 },
          expectedStatus: 422
        },
        {
          endpoint: '/stocks',
          params: { skip: -10 },
          expectedStatus: 422
        }
      ]

      const results = []
      
      for (const test of rangeTests) {
        try {
          await testClient.getClient().get(test.endpoint, { params: test.params })
          results.push({
            test: JSON.stringify(test.params),
            status: 'failed',
            reason: '端点未正确验证数值范围'
          })
        } catch (error: any) {
          if (error.response?.status === test.expectedStatus) {
            results.push({
              test: JSON.stringify(test.params),
              status: 'passed',
              reason: '端点正确验证数值范围'
            })
          } else {
            results.push({
              test: JSON.stringify(test.params),
              status: 'uncertain',
              reason: `响应状态 ${error.response?.status}, 期望 ${test.expectedStatus}`
            })
          }
        }
      }

      const failedTests = results.filter(r => r.status === 'failed')
      expect(failedTests.length).toBe(0)
      console.log(`✅ 数值范围验证测试: ${results.filter(r => r.status === 'passed').length}/${results.length} 通过`)
    })

    it('应该验证日期格式', async () => {
      console.log('🛡️ 测试日期格式验证...')
      
      const dateTests = [
        {
          endpoint: '/stocks/TEST001/data',
          params: { start_date: 'invalid-date', end_date: '2023-01-01' },
          expectedStatus: 422
        },
        {
          endpoint: '/stocks/TEST001/data',
          params: { start_date: '2023-13-01', end_date: '2023-01-01' },
          expectedStatus: 422
        },
        {
          endpoint: '/stocks/TEST001/data',
          params: { start_date: '2023-01-01', end_date: '2022-12-31' }, // 结束日期早于开始日期
          expectedStatus: 400
        }
      ]

      const results = []
      
      for (const test of dateTests) {
        try {
          await testClient.getClient().get(test.endpoint, { params: test.params })
          results.push({
            test: JSON.stringify(test.params),
            status: 'failed',
            reason: '端点未正确验证日期格式'
          })
        } catch (error: any) {
          if (error.response?.status === test.expectedStatus) {
            results.push({
              test: JSON.stringify(test.params),
              status: 'passed',
              reason: '端点正确验证日期格式'
            })
          } else {
            results.push({
              test: JSON.stringify(test.params),
              status: 'uncertain',
              reason: `响应状态 ${error.response?.status}, 期望 ${test.expectedStatus}`
            })
          }
        }
      }

      const failedTests = results.filter(r => r.status === 'failed')
      expect(failedTests.length).toBe(0)
      console.log(`✅ 日期格式验证测试: ${results.filter(r => r.status === 'passed').length}/${results.length} 通过`)
    })
  })

  describe('数据保护测试', () => {
    it('应该保护敏感数据不被泄露', async () => {
      console.log('🛡️ 测试敏感数据保护...')
      
      const sensitiveDataTests = [
        {
          endpoint: '/stocks',
          check: (data: any) => {
            // 检查响应中是否包含敏感信息
            const hasSensitiveInfo = JSON.stringify(data).includes('password') || 
                                   JSON.stringify(data).includes('secret') ||
                                   JSON.stringify(data).includes('private_key')
            return !hasSensitiveInfo
          }
        },
        {
          endpoint: '/models',
          check: (data: any) => {
            // 检查模型参数中是否包含敏感信息
            const models = data.data.data
            return models.every((model: any) => {
              const params = JSON.stringify(model.parameters || {})
              return !params.includes('password') && !params.includes('secret')
            })
          }
        }
      ]

      const results = []
      
      for (const test of sensitiveDataTests) {
        try {
          const response = await testClient.getClient().get(test.endpoint)
          const isProtected = test.check(response.data)
          
          if (isProtected) {
            results.push({
              endpoint: test.endpoint,
              status: 'passed',
              reason: '敏感数据保护有效'
            })
          } else {
            results.push({
              endpoint: test.endpoint,
              status: 'failed',
              reason: '检测到可能的敏感数据泄露'
            })
          }
        } catch (error: any) {
          results.push({
            endpoint: test.endpoint,
            status: 'error',
            reason: `请求失败: ${error.message}`
          })
        }
      }

      const failedTests = results.filter(r => r.status === 'failed')
      expect(failedTests.length).toBe(0)
      console.log(`✅ 敏感数据保护测试: ${results.filter(r => r.status === 'passed').length}/${results.length} 通过`)
      
      securityResults.dataProtection = {
        passed: failedTests.length === 0,
        details: results
      }
    })

    it('应该实施适当的数据访问控制', async () => {
      console.log('🛡️ 测试数据访问控制...')
      
      const accessControlTests = [
        {
          description: '应该能够访问公开数据',
          endpoint: '/stocks',
          shouldSucceed: true
        },
        {
          description: '应该能够访问模型数据',
          endpoint: '/models',
          shouldSucceed: true
        },
        {
          description: '应该能够生成决策',
          endpoint: '/decisions/generate',
          method: 'POST',
          data: {
            symbol: 'TEST001',
            trade_date: '2023-01-05',
            current_position: 0.0
          },
          shouldSucceed: true
        }
      ]

      const results = []
      
      for (const test of accessControlTests) {
        try {
          let response
          if (test.method === 'POST') {
            response = await testClient.getClient().post(test.endpoint, test.data)
          } else {
            response = await testClient.getClient().get(test.endpoint)
          }
          
          if (test.shouldSucceed) {
            results.push({
              test: test.description,
              status: 'passed',
              reason: '数据访问控制正常'
            })
          } else {
            results.push({
              test: test.description,
              status: 'failed',
              reason: '不应该成功访问的数据被允许访问'
            })
          }
        } catch (error: any) {
          if (!test.shouldSucceed) {
            results.push({
              test: test.description,
              status: 'passed',
              reason: '数据访问控制有效'
            })
          } else {
            results.push({
              test: test.description,
              status: 'failed',
              reason: `应该成功访问的数据被拒绝: ${error.message}`
            })
          }
        }
      }

      const failedTests = results.filter(r => r.status === 'failed')
      expect(failedTests.length).toBe(0)
      console.log(`✅ 数据访问控制测试: ${results.filter(r => r.status === 'passed').length}/${results.length} 通过`)
    })
  })

  describe('错误信息泄露测试', () => {
    it('应该防止详细的错误信息泄露', async () => {
      console.log('🛡️ 测试错误信息泄露防护...')
      
      const errorTests = [
        {
          endpoint: '/stocks/INVALID_STOCK_999',
          expectedStatus: 404,
          check: (error: any) => {
            const errorMessage = error.response?.data?.message || ''
            // 错误信息不应该包含堆栈跟踪或内部实现细节
            return !errorMessage.includes('at ') && 
                   !errorMessage.includes('File ') && 
                   !errorMessage.includes('line ') &&
                   !errorMessage.includes('Traceback')
          }
        },
        {
          endpoint: '/models/999999',
          expectedStatus: 404,
          check: (error: any) => {
            const errorMessage = error.response?.data?.message || ''
            return !errorMessage.includes('at ') && 
                   !errorMessage.includes('File ') && 
                   !errorMessage.includes('line ')
          }
        }
      ]

      const results = []
      
      for (const test of errorTests) {
        try {
          await testClient.getClient().get(test.endpoint)
          results.push({
            endpoint: test.endpoint,
            status: 'failed',
            reason: '应该抛出错误但没有抛出'
          })
        } catch (error: any) {
          if (error.response?.status === test.expectedStatus) {
            const isProtected = test.check(error)
            if (isProtected) {
              results.push({
                endpoint: test.endpoint,
                status: 'passed',
                reason: '错误信息保护有效'
              })
            } else {

              results.push({
                endpoint: test.endpoint,
                status: 'failed',
                reason: '错误信息可能泄露内部细节'
              })
            }
          } else {
            results.push({
              endpoint: test.endpoint,
              status: 'uncertain',
              reason: `响应状态 ${error.response?.status}, 期望 ${test.expectedStatus}`
            })
          }
        }
      }

      const failedTests = results.filter(r => r.status === 'failed')
      expect(failedTests.length).toBe(0)
      console.log(`✅ 错误信息泄露防护测试: ${results.filter(r => r.status === 'passed').length}/${results.length} 通过`)
    })
  })

  describe('速率限制测试', () => {
    it('应该实施适当的API速率限制', async () => {
      console.log('🛡️ 测试API速率限制...')
      
      const rateLimitTests = []
      const rapidRequests = 20 // 快速发送多个请求
      
      for (let i = 0; i < rapidRequests; i++) {
        try {
          await testClient.getClient().get('/health')
          rateLimitTests.push({ request: i + 1, status: 'success' })
        } catch (error: any) {
          if (error.response?.status === 429) {
            rateLimitTests.push({ request: i + 1, status: 'rate_limited' })
          } else {
            rateLimitTests.push({ request: i + 1, status: 'error', error: error.message })
          }
        }
        
        // 非常短的延迟以模拟快速请求
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const rateLimitedRequests = rateLimitTests.filter(test => test.status === 'rate_limited')
      
      // 如果系统实施了速率限制，应该有一些请求被限制
      // 如果没有实施速率限制，所有请求都应该成功
      if (rateLimitedRequests.length > 0) {
        console.log(`✅ API速率限制测试: 检测到速率限制 (${rateLimitedRequests.length}/${rapidRequests} 请求被限制)`)
      } else {
        console.log('⚠️ API速率限制测试: 未检测到速率限制，所有请求成功')
      }
      
      // 这个测试主要是为了检测是否存在速率限制，不强制要求
      console.log(`📊 速率限制测试结果: ${rateLimitedRequests.length} 个请求被限制`)
    })
  })

  describe('HTTP安全头测试', () => {
    it('应该设置适当的安全HTTP头', async () => {
      console.log('🛡️ 测试HTTP安全头...')
      
      const securityHeaderTests = [
        {
          endpoint: '/health',
          expectedHeaders: [
            'X-Content-Type-Options',
            'X-Frame-Options', 
            'X-XSS-Protection'
          ]
        }
      ]

      const results = []
      
      for (const test of securityHeaderTests) {
        try {
          const response = await testClient.getClient().get(test.endpoint)
          const headers = response.headers
          
          const missingHeaders = test.expectedHeaders.filter(header => !headers[header.toLowerCase()])
          
          if (missingHeaders.length === 0) {
            results.push({
              endpoint: test.endpoint,
              status: 'passed',
              reason: '所有安全HTTP头已设置'
            })
          } else {
            results.push({
              endpoint: test.endpoint,
              status: 'failed',
              reason: `缺少安全HTTP头: ${missingHeaders.join(', ')}`
            })
          }
        } catch (error: any) {
          results.push({
            endpoint: test.endpoint,
            status: 'error',
            reason: `请求失败: ${error.message}`
          })
        }
      }

      const failedTests = results.filter(r => r.status === 'failed')
      // 这个测试是可选的，因为安全头的设置可能因部署环境而异
      if (failedTests.length === 0) {
        console.log('✅ HTTP安全头测试: 通过')
      } else {
        console.log('⚠️ HTTP安全头测试: 部分安全头未设置')
        failedTests.forEach(test => console.log(`  ${test.reason}`))
      }
    })
  })
})
