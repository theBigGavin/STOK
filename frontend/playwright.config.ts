import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  
  // 测试目录
  testDir: './tests/e2e',

  // 每个测试的最大时间
  timeout: 30000,

  // 期望断言超时时间
  expect: {
    timeout: 5000
  },

  // 并行运行测试
  fullyParallel: true,

  // 在 CI 环境中禁止 only 标记
  forbidOnly: !!process.env.CI,

  // 重试次数
  retries: process.env.CI ? 2 : 0,

  // 工作进程数
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],

  // 共享配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 收集跟踪信息
    trace: 'on-first-retry',

    // 截图配置
    screenshot: 'only-on-failure',

    // 视频录制配置
    video: 'retain-on-failure',

    // 上下文选项
    contextOptions: {
      ignoreHTTPSErrors: true,
    },

    // 视口大小
    viewport: { width: 1280, height: 720 },
  },

  // 配置项目
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    // 移动端测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // 无头浏览器测试
    {
      name: 'chromium-headless',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],

  // Web 服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // 输出目录
  outputDir: 'test-results/',

  // 全局设置 - 暂时禁用有问题的全局设置
  // globalSetup: './tests/e2e/global-setup.ts',
  // globalTeardown: './tests/e2e/global-teardown.ts',
})