// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 运行时配置
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8099/api/v1',
      appName: process.env.NUXT_PUBLIC_APP_NAME || '股票回测决策系统',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || '1.0.0',
      chartLibrary: process.env.NUXT_PUBLIC_CHART_LIBRARY || 'unovis',
      enableAnalytics: process.env.NUXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    }
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt'
  ],

  // 构建优化配置
  build: {
    transpile: ['@unovis/vue'],
  },

  // Nitro 服务器配置
  nitro: {
    preset: 'node-server',
    compressPublicAssets: true,
  },

  // 性能优化
  experimental: {
    payloadExtraction: false,
  },

  // 开发工具
  devtools: {
    enabled: process.env.NUXT_DEVTOOLS_ENABLED === 'true' || process.env.NODE_ENV === 'development'
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // 类型检查配置
  typescript: {
    typeCheck: true,
    strict: true
  },

  // 源映射配置
  sourcemap: process.env.NODE_ENV === 'development'
})
