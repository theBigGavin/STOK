// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 运行时配置
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt', '@pinia/nuxt'],

  // 开发工具
  devtools: {
    enabled: process.env.NUXT_DEVTOOLS_ENABLED === 'true' || process.env.NODE_ENV === 'development',
  },

  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8099/api/v1',
      appName: process.env.NUXT_PUBLIC_APP_NAME || '股票回测决策系统',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || '1.0.0',
      chartLibrary: process.env.NUXT_PUBLIC_CHART_LIBRARY || 'ant-design-charts',
      enableAnalytics: process.env.NUXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    },
  },

  // 构建优化配置
  build: {
    transpile: ['@ant-design/charts'],
  },

  // 路由规则和缓存策略
  routeRules: {
    '/api/**': {
      cors: true,
    },
    // 静态资源缓存
    '/_nuxt/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    // 图标缓存
    '/favicon.ico': {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    },
    // 首页缓存策略
    '/': {
      prerender: true,
      swr: 3600, // 1小时缓存
    },
    // 静态页面缓存
    '/stocks': {
      swr: 1800, // 30分钟缓存
    },
    '/decisions': {
      swr: 1800,
    },
    '/models': {
      swr: 1800,
    },
    '/backtest': {
      swr: 1800,
    },
  },

  // 源映射配置
  sourcemap: process.env.NODE_ENV === 'development',

  // 性能优化
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
  },

  compatibilityDate: '2024-07-11',

  // Nitro 服务器配置
  nitro: {
    preset: 'node-server',
    compressPublicAssets: true,
    minify: true,
    esbuild: {
      options: {
        target: 'es2022',
      },
    },
    // 静态资源服务优化
    static: true,
    // 服务端渲染优化
    prerender: {
      crawlLinks: false,
      routes: ['/'],
    },
  },

  // 类型检查配置
  typescript: {
    typeCheck: process.env.NODE_ENV === 'development',
    strict: true,
    tsConfig: {
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        moduleResolution: 'bundler',
        target: 'ES2022',
        useDefineForClassFields: true,
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
      },
    },
  },

  // Vue 配置
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith('U-') || tag.startsWith('ant-'),
    },
  },

  // 应用配置
  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-CN',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
        // 性能优化相关meta
        { name: 'theme-color', content: '#ffffff' },
        { name: 'color-scheme', content: 'light dark' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8099' },
      ],
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },

  // 开发服务器配置
  devServer: {
    port: 3000,
    host: 'localhost',
  },
});
