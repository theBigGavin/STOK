import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    name: 'integration',
    root: './tests/integration',
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    testTimeout: 120000,
    hookTimeout: 120000,
    teardownTimeout: 30000,
    
    // 报告配置
    reporters: [
      'verbose',
      'html',
      'json'
    ],
    
    // 输出配置
    outputFile: {
      html: './test-results/integration-report.html',
      json: './test-results/integration-results.json'
    },
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './test-results/coverage',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/main.ts',
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts'
      ]
    },
    
    // 重试配置
    retry: 3,
    
    // 序列化配置
    sequence: {
      shuffle: false
    },
    
    // 类型检查
    typecheck: {
      checker: 'tsc',
      include: ['**/*.test.ts']
    },
    
    // 别名配置
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './tests')
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './tests')
    }
  }
})