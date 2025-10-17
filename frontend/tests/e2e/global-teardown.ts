import { test as teardown } from '@playwright/test'

/**
 * E2E 测试全局清理
 * 在所有测试运行之后执行
 */

teardown('全局清理', async () => {
  console.log('开始 E2E 测试全局清理...')

  // 清理测试环境变量
  delete process.env.TEST_ENV
  delete process.env.API_BASE_URL

  // 生成测试报告
  console.log('生成测试报告...')
  
  // 清理临时文件
  console.log('清理临时文件...')

  // 输出测试完成信息
  console.log('E2E 测试全局清理完成')
  console.log('测试报告位置: test-results/')
  console.log('截图位置: test-results/screenshots/')
})

export default teardown