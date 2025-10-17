import { defineConfig } from '@playwright/test'
import { vi } from 'vitest'

/**
 * E2E 测试环境配置
 * 用于配置 Playwright 测试环境和模拟数据
 */

// E2E 测试配置
export const e2eConfig = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'firefox',
      use: { 
        browserName: 'firefox',
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'webkit',
      use: { 
        browserName: 'webkit',
        viewport: { width: 1280, height: 720 }
      }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
})

// E2E 测试数据
export const E2ETestData = {
  users: {
    admin: {
      username: 'admin',
      password: 'admin123',
      token: 'admin-token-123'
    },
    user: {
      username: 'user',
      password: 'user123',
      token: 'user-token-456'
    }
  },

  stocks: {
    popular: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        market: 'NASDAQ',
        currentPrice: 152.50,
        change: 2.5,
        volume: '1.2M'
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        market: 'NASDAQ',
        currentPrice: 2780.45,
        change: -1.2,
        volume: '850K'
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        market: 'NASDAQ',
        currentPrice: 335.67,
        change: 0.8,
        volume: '1.5M'
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        market: 'NASDAQ',
        currentPrice: 245.80,
        change: -3.2,
        volume: '2.1M'
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        market: 'NASDAQ',
        currentPrice: 3456.78,
        change: 1.5,
        volume: '980K'
      }
    ],

    searchResults: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        market: 'NASDAQ'
      },
      {
        symbol: 'APLE',
        name: 'Apple Hospitality REIT Inc.',
        market: 'NYSE'
      }
    ],

    stockDetail: {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      market: 'NASDAQ',
      industry: 'Technology',
      currentPrice: 152.50,
      change: 2.5,
      changePercent: 1.67,
      volume: '1.2M',
      marketCap: '2.4T',
      peRatio: 28.5,
      dividendYield: 0.6
    }
  },

  models: {
    list: [
      {
        id: 1,
        name: '技术分析模型',
        description: '基于技术指标的股票分析模型',
        modelType: 'technical',
        accuracy: 0.75,
        totalReturn: 0.15,
        sharpeRatio: 1.2,
        isActive: true
      },
      {
        id: 2,
        name: '基本面分析模型',
        description: '基于公司基本面的分析模型',
        modelType: 'fundamental',
        accuracy: 0.68,
        totalReturn: 0.12,
        sharpeRatio: 0.9,
        isActive: true
      },
      {
        id: 3,
        name: '机器学习模型',
        description: '使用机器学习算法的预测模型',
        modelType: 'ml',
        accuracy: 0.82,
        totalReturn: 0.18,
        sharpeRatio: 1.5,
        isActive: false
      }
    ]
  },

  decisions: {
    single: {
      symbol: 'AAPL',
      decision: 'BUY',
      confidence: 0.85,
      riskLevel: 'MEDIUM',
      reasoning: '技术指标显示强劲买入信号，RSI处于合理区间'
    },
    batch: [
      {
        symbol: 'AAPL',
        decision: 'BUY',
        confidence: 0.85
      },
      {
        symbol: 'GOOGL',
        decision: 'HOLD',
        confidence: 0.62
      },
      {
        symbol: 'MSFT',
        decision: 'BUY',
        confidence: 0.78
      }
    ]
  },

  backtest: {
    results: {
      totalReturn: 0.15,
      annualReturn: 0.18,
      volatility: 0.22,
      sharpeRatio: 1.2,
      maxDrawdown: -0.08,
      winRate: 0.65,
      totalTrades: 45,
      winningTrades: 29
    }
  }
}

// E2E 测试工具函数
export const E2ETestUtils = {
  // 页面对象模型
  PageObjects: {
    login: {
      selectors: {
        usernameInput: '[data-testid="username-input"]',
        passwordInput: '[data-testid="password-input"]',
        loginButton: '[data-testid="login-button"]',
        errorMessage: '[data-testid="error-message"]'
      }
    },

    dashboard: {
      selectors: {
        welcomeMessage: '[data-testid="welcome-message"]',
        stockSummary: '[data-testid="stock-summary"]',
        quickActions: '[data-testid="quick-actions"]'
      }
    },

    stocks: {
      selectors: {
        searchInput: '[data-testid="stock-search-input"]',
        searchButton: '[data-testid="search-button"]',
        stockTable: '[data-testid="stock-table"]',
        stockRow: '[data-testid="stock-row"]',
        viewDetailsButton: '[data-testid="view-details-button"]',
        refreshButton: '[data-testid="refresh-button"]'
      }
    },

    stockDetail: {
      selectors: {
        symbol: '[data-testid="stock-symbol"]',
        name: '[data-testid="stock-name"]',
        price: '[data-testid="current-price"]',
        change: '[data-testid="price-change"]',
        chart: '[data-testid="price-chart"]',
        analyzeButton: '[data-testid="analyze-button"]'
      }
    },

    models: {
      selectors: {
        modelList: '[data-testid="model-list"]',
        modelCard: '[data-testid="model-card"]',
        createButton: '[data-testid="create-model-button"]',
        performanceChart: '[data-testid="performance-chart"]'
      }
    },

    decisions: {
      selectors: {
        generateButton: '[data-testid="generate-decision-button"]',
        decisionCard: '[data-testid="decision-card"]',
        confidenceIndicator: '[data-testid="confidence-indicator"]',
        riskLevel: '[data-testid="risk-level"]'
      }
    },

    backtest: {
      selectors: {
        configForm: '[data-testid="backtest-config-form"]',
        runButton: '[data-testid="run-backtest-button"]',
        resultsTable: '[data-testid="backtest-results"]',
        comparisonChart: '[data-testid="comparison-chart"]'
      }
    }
  },

  // 测试辅助函数
  helpers: {
    async login(page: any, username: string, password: string) {
      await page.goto('/login')
      await page.fill(this.PageObjects.login.selectors.usernameInput, username)
      await page.fill(this.PageObjects.login.selectors.passwordInput, password)
      await page.click(this.PageObjects.login.selectors.loginButton)
      await page.waitForURL('/dashboard')
    },

    async searchStock(page: any, query: string) {
      await page.fill(this.PageObjects.stocks.selectors.searchInput, query)
      await page.click(this.PageObjects.stocks.selectors.searchButton)
      await page.waitForTimeout(1000) // 等待搜索结果加载
    },

    async navigateToStocks(page: any) {
      await page.goto('/stocks')
      await page.waitForSelector(this.PageObjects.stocks.selectors.stockTable)
    },

    async navigateToModels(page: any) {
      await page.goto('/models')
      await page.waitForSelector(this.PageObjects.models.selectors.modelList)
    },

    async navigateToDecisions(page: any) {
      await page.goto('/decisions')
      await page.waitForSelector(this.PageObjects.decisions.selectors.decisionCard)
    },

    async navigateToBacktest(page: any) {
      await page.goto('/backtest')
      await page.waitForSelector(this.PageObjects.backtest.selectors.configForm)
    },

    async waitForLoading(page: any, selector: string, timeout = 5000) {
      await page.waitForSelector(selector, { state: 'visible', timeout })
    },

    async takeScreenshot(page: any, name: string) {
      await page.screenshot({ 
        path: `test-results/screenshots/${name}-${Date.now()}.png`,
        fullPage: true 
      })
    },

    async mockApiResponse(page: any, urlPattern: string, response: any) {
      await page.route(urlPattern, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        })
      })
    },

    async mockApiError(page: any, urlPattern: string, status = 500) {
      await page.route(urlPattern, route => {
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'API Error' })
        })
      })
    }
  },

  // 断言工具
  assertions: {
    async shouldBeVisible(page: any, selector: string) {
      const element = await page.$(selector)
      expect(element).not.toBeNull()
      expect(await element.isVisible()).toBe(true)
    },

    async shouldContainText(page: any, selector: string, text: string) {
      const element = await page.$(selector)
      const elementText = await element.textContent()
      expect(elementText).toContain(text)
    },

    async shouldHaveValue(page: any, selector: string, value: string) {
      const element = await page.$(selector)
      const elementValue = await element.inputValue()
      expect(elementValue).toBe(value)
    },

    async shouldBeDisabled(page: any, selector: string) {
      const element = await page.$(selector)
      expect(await element.isDisabled()).toBe(true)
    },

    async shouldBeEnabled(page: any, selector: string) {
      const element = await page.$(selector)
      expect(await element.isDisabled()).toBe(false)
    }
  }
}

// 测试场景定义
export const E2ETestScenarios = {
  userJourneys: {
    stockAnalysis: [
      '用户登录系统',
      '导航到股票页面',
      '搜索特定股票',
      '查看股票详情',
      '分析股票信号',
      '查看历史数据'
    ],

    modelManagement: [
      '用户登录系统',
      '导航到模型页面',
      '查看模型列表',
      '创建新模型',
      '配置模型参数',
      '测试模型性能'
    ],

    decisionGeneration: [
      '用户登录系统',
      '导航到决策页面',
      '选择股票进行分析',
      '生成交易决策',
      '查看决策详情',
      '评估风险水平'
    ],

    backtestAnalysis: [
      '用户登录系统',
      '导航到回测页面',
      '配置回测参数',
      '运行回测分析',
      '查看回测结果',
      '比较模型性能'
    ]
  },

  criticalPaths: {
    authentication: '用户认证流程',
    stockSearch: '股票搜索功能',
    dataDisplay: '数据展示功能',
    modelPerformance: '模型性能评估',
    decisionAccuracy: '决策准确性验证',
    backtestReliability: '回测结果可靠性'
  }
}

// 性能测试配置
export const PerformanceTestConfig = {
  loadTest: {
    concurrentUsers: 10,
    duration: '5m',
    rampUp: '30s'
  },

  stressTest: {
    concurrentUsers: 50,
    duration: '10m',
    spikeUsers: 100
  },

  enduranceTest: {
    concurrentUsers: 5,
    duration: '1h'
  }
}

// 导出默认配置
export default {
  e2eConfig,
  E2ETestData,
  E2ETestUtils,
  E2ETestScenarios,
  PerformanceTestConfig
}