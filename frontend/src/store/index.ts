import { defineStore } from 'pinia'

// 应用状态管理
export const useAppStore = defineStore('app', {
  state: () => ({
    // 侧边栏折叠状态
    sidebarCollapsed: false,
    // 主题设置
    theme: 'light',
    // 全局加载状态
    loading: false,
    // 错误信息
    error: null as string | null,
  }),
  getters: {
    // 获取侧边栏状态
    isSidebarCollapsed: (state) => state.sidebarCollapsed,
    // 获取当前主题
    currentTheme: (state) => state.theme,
    // 获取加载状态
    isLoading: (state) => state.loading,
    // 获取错误信息
    getError: (state) => state.error,
  },
  actions: {
    // 切换侧边栏状态
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    // 设置侧边栏状态
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
    },
    // 切换主题
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },
    // 设置主题
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme
    },
    // 设置加载状态
    setLoading(loading: boolean) {
      this.loading = loading
    },
    // 设置错误信息
    setError(error: string | null) {
      this.error = error
    },
    // 清除错误信息
    clearError() {
      this.error = null
    },
  },
  // 持久化存储配置
  persist: {
    key: 'stok-app-store',
    paths: ['sidebarCollapsed', 'theme'],
  },
})

// 用户状态管理
export const useUserStore = defineStore('user', {
  state: () => ({
    // 用户信息
    userInfo: null as any,
    // 权限信息
    permissions: [] as string[],
    // 登录状态
    isLoggedIn: false,
  }),
  getters: {
    // 获取用户信息
    getUserInfo: (state) => state.userInfo,
    // 获取权限列表
    getPermissions: (state) => state.permissions,
    // 获取登录状态
    isAuthenticated: (state) => state.isLoggedIn,
  },
  actions: {
    // 设置用户信息
    setUserInfo(userInfo: any) {
      this.userInfo = userInfo
      this.isLoggedIn = true
    },
    // 设置权限
    setPermissions(permissions: string[]) {
      this.permissions = permissions
    },
    // 清除用户信息
    clearUserInfo() {
      this.userInfo = null
      this.permissions = []
      this.isLoggedIn = false
    },
    // 检查权限
    hasPermission(permission: string): boolean {
      return this.permissions.includes(permission)
    },
  },
  persist: {
    key: 'stok-user-store',
    paths: ['userInfo', 'permissions', 'isLoggedIn'],
  },
})