import { test as setup } from '@playwright/test'
import { E2ETestData } from './setup'

/**
 * E2E 测试全局设置
 * 在所有测试运行之前执行
 */

setup('全局设置', async ({ page }) => {
  console.log('开始 E2E 测试全局设置...')

  // 设置测试环境变量
  process.env.TEST_ENV = 'e2e'
  process.env.API_BASE_URL = 'http://localhost:8099'

  // 模拟登录状态
  await page.context().addInitScript((userData) => {
    window.localStorage.setItem('auth_token', userData.token)
    window.localStorage.setItem('user_info', JSON.stringify({
      username: userData.username,
      role: 'user'
    }))
  }, E2ETestData.users.user)

  // 模拟 API 响应
  await page.route('**/api/v1/stocks', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: E2ETestData.stocks.popular,
        total: E2ETestData.stocks.popular.length,
        skip: 0,
        limit: 20
      })
    })
  })

  await page.route('**/api/v1/stocks/search**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(E2ETestData.stocks.searchResults)
    })
  })

  await page.route('**/api/v1/stocks/AAPL', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(E2ETestData.stocks.stockDetail)
    })
  })

  await page.route('**/api/v1/models', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: E2ETestData.models.list,
        total: E2ETestData.models.list.length,
        skip: 0,
        limit: 20
      })
    })
  })

  await page.route('**/api/v1/decisions/generate', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(E2ETestData.decisions.single)
    })
  })

  await page.route('**/api/v1/backtest/run', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(E2ETestData.backtest.results)
    })
  })

  console.log('E2E 测试全局设置完成')
})

export default setup