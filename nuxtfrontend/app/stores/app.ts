/**
 * 应用全局状态管理Store
 * 管理应用级别的全局状态，包括用户偏好、主题设置、通知等
 */

import { defineStore } from 'pinia'
import type { StockInfo } from '~/types/stocks'
import type { DecisionResult } from '~/types/decisions'
import type { ModelInfo } from '~/types/models'
import type { BacktestResult } from '~/types/backtest'

// Nuxt运行时配置
const isClient = typeof window !== 'undefined'

// 应用主题类型
type AppTheme = 'light' | 'dark' | 'auto'

// 应用配置接口
interface AppConfig {
  theme: AppTheme
  language: string
  notifications: boolean
  autoRefresh: boolean
  refreshInterval: number
  chartTheme: string
}

// 应用状态接口
interface AppState {
  // 全局加载状态
  loading: boolean
  // 全局错误信息
  error: string | null
  // 应用配置
  config: AppConfig
  // 选中的股票
  selectedStock: StockInfo | null
  // 最近访问的股票
  recentStocks: StockInfo[]
  // 应用通知
  notifications: any[]
  // 未读通知数量
  unreadNotifications: number
  // 侧边栏状态
  sidebarCollapsed: boolean
  // 移动端菜单状态
  mobileMenuOpen: boolean
}

/**
 * 应用全局状态管理Store
 */
export const useAppStore = defineStore('app', () => {
  // 状态定义
  const state = reactive<AppState>({
    loading: false,
    error: null,
    config: {
      theme: 'auto',
      language: 'zh-CN',
      notifications: true,
      autoRefresh: false,
      refreshInterval: 30000, // 30秒
      chartTheme: 'default'
    },
    selectedStock: null,
    recentStocks: [],
    notifications: [],
    unreadNotifications: 0,
    sidebarCollapsed: false,
    mobileMenuOpen: false
  })

  // 计算属性
  const computedState = {
    // 当前主题（考虑自动模式）
    currentTheme: computed(() => {
      if (state.config.theme === 'auto') {
        // 根据系统偏好自动选择
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return state.config.theme
    }),

    // 是否在移动设备上
    isMobile: computed(() => {
      if (isClient) {
        return window.innerWidth < 768
      }
      return false
    }),

    // 最近访问的活跃股票
    recentActiveStocks: computed(() => 
      state.recentStocks.filter(stock => stock.isActive)
    ),

    // 是否有未读通知
    hasUnreadNotifications: computed(() => state.unreadNotifications > 0),

    // 重要通知
    importantNotifications: computed(() => 
      state.notifications.filter(notification => notification.important)
    )
  }

  // Actions
  const actions = {
    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      state.loading = loading
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      state.error = error
    },

    /**
     * 清除错误信息
     */
    clearError() {
      state.error = null
    },

    /**
     * 更新应用配置
     */
    updateConfig(config: Partial<AppConfig>) {
      state.config = { ...state.config, ...config }
      // 保存到本地存储
      if (isClient) {
        localStorage.setItem('app-config', JSON.stringify(state.config))
      }
    },

    /**
     * 加载应用配置
     */
    loadConfig() {
      if (isClient) {
        const savedConfig = localStorage.getItem('app-config')
        if (savedConfig) {
          try {
            state.config = { ...state.config, ...JSON.parse(savedConfig) }
          } catch (error) {
            console.error('加载应用配置失败:', error)
          }
        }
      }
    },

    /**
     * 选择股票
     */
    selectStock(stock: StockInfo | null) {
      state.selectedStock = stock
      if (stock) {
        // 添加到最近访问列表
        this.addToRecentStocks(stock)
      }
    },

    /**
     * 添加到最近访问股票
     */
    addToRecentStocks(stock: StockInfo) {
      // 移除重复项
      state.recentStocks = state.recentStocks.filter(s => s.id !== stock.id)
      // 添加到开头
      state.recentStocks.unshift(stock)
      // 限制数量
      if (state.recentStocks.length > 10) {
        state.recentStocks = state.recentStocks.slice(0, 10)
      }
      // 保存到本地存储
      if (isClient) {
        localStorage.setItem('recent-stocks', JSON.stringify(state.recentStocks))
      }
    },

    /**
     * 加载最近访问股票
     */
    loadRecentStocks() {
      if (isClient) {
        const savedStocks = localStorage.getItem('recent-stocks')
        if (savedStocks) {
          try {
            state.recentStocks = JSON.parse(savedStocks)
          } catch (error) {
            console.error('加载最近访问股票失败:', error)
          }
        }
      }
    },

    /**
     * 添加通知
     */
    addNotification(notification: any) {
      state.notifications.unshift(notification)
      if (!notification.read) {
        state.unreadNotifications++
      }
      // 限制通知数量
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
    },

    /**
     * 标记通知为已读
     */
    markNotificationAsRead(id: string) {
      const notification = state.notifications.find(n => n.id === id)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1)
      }
    },

    /**
     * 标记所有通知为已读
     */
    markAllNotificationsAsRead() {
      state.notifications.forEach(notification => {
        notification.read = true
      })
      state.unreadNotifications = 0
    },

    /**
     * 清除所有通知
     */
    clearNotifications() {
      state.notifications = []
      state.unreadNotifications = 0
    },

    /**
     * 切换侧边栏状态
     */
    toggleSidebar() {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },

    /**
     * 切换移动端菜单状态
     */
    toggleMobileMenu() {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },

    /**
     * 关闭移动端菜单
     */
    closeMobileMenu() {
      state.mobileMenuOpen = false
    },

    /**
     * 重置应用状态
     */
    reset() {
      state.loading = false
      state.error = null
      state.selectedStock = null
      state.notifications = []
      state.unreadNotifications = 0
      state.sidebarCollapsed = false
      state.mobileMenuOpen = false
    },

    /**
     * 初始化应用状态
     */
    initialize() {
      this.loadConfig()
      this.loadRecentStocks()
    }
  }

  // 返回Store内容
  return {
    // 状态
    ...toRefs(state),
    // 计算属性
    ...computedState,
    // Actions
    ...actions
  }
})

// 导出Store类型
export type AppStore = ReturnType<typeof useAppStore>