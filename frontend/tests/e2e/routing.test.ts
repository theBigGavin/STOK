/**
 * 路由 E2E 测试
 * 验证前端路由配置修复后的功能
 */

import { test, expect } from '@playwright/test'

test.describe('前端路由验证测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到应用首页
    await page.goto('/')
    // 等待应用加载完成
    await page.waitForLoadState('networkidle')
  })

  test('应该正确显示 Layout 组件', async ({ page }) => {
    // 验证侧边栏存在
    await expect(page.locator('.sidebar')).toBeVisible()
    
    // 验证头部存在
    await expect(page.locator('.header')).toBeVisible()
    
    // 验证主内容区域存在
    await expect(page.locator('.main-content')).toBeVisible()
    
    // 验证 Logo 显示
    await expect(page.locator('.logo')).toBeVisible()
  })

  test('应该正确显示侧边栏菜单', async ({ page }) => {
    // 验证菜单项存在
    const menuItems = [
      { name: '仪表盘', path: '/dashboard' },
      { name: '股票监控', path: '/stocks' },
      { name: '决策分析', path: '/decisions' },
      { name: '模型管理', path: '/models' },
      { name: '回测分析', path: '/backtest' }
    ]

    for (const item of menuItems) {
      const menuItem = page.locator(`.sidebar-menu a[href="${item.path}"]`)
      await expect(menuItem).toBeVisible()
      await expect(menuItem).toContainText(item.name)
    }
  })

  test('应该能够通过侧边栏导航到所有页面', async ({ page }) => {
    const pages = [
      { name: '仪表盘', path: '/dashboard', title: '仪表盘' },
      { name: '股票监控', path: '/stocks', title: '股票监控' },
      { name: '决策分析', path: '/decisions', title: '决策分析' },
      { name: '模型管理', path: '/models', title: '模型管理' },
      { name: '回测分析', path: '/backtest', title: '回测分析' }
    ]

    for (const pageInfo of pages) {
      // 点击侧边栏菜单项
      await page.click(`.sidebar-menu a[href="${pageInfo.path}"]`)
      
      // 等待页面加载
      await page.waitForLoadState('networkidle')
      
      // 验证 URL 正确
      await expect(page).toHaveURL(pageInfo.path)
      
      // 验证页面标题正确
      await expect(page.locator('h1')).toContainText(pageInfo.title)
      
      // 验证面包屑正确
      await expect(page.locator('.breadcrumb')).toContainText(pageInfo.title)
      
      // 验证 Layout 组件仍然存在
      await expect(page.locator('.sidebar')).toBeVisible()
      await expect(page.locator('.header')).toBeVisible()
      await expect(page.locator('.main-content')).toBeVisible()
    }
  })

  test('应该正确显示面包屑导航', async ({ page }) => {
    // 导航到股票页面
    await page.click('.sidebar-menu a[href="/stocks"]')
    await page.waitForLoadState('networkidle')
    
    // 验证面包屑显示
    const breadcrumb = page.locator('.breadcrumb')
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb).toContainText('首页')
    await expect(breadcrumb).toContainText('股票监控')
  })

  test('应该正确设置页面标题', async ({ page }) => {
    const pages = [
      { path: '/dashboard', title: '仪表盘' },
      { path: '/stocks', title: '股票监控' },
      { path: '/decisions', title: '决策分析' },
      { path: '/models', title: '模型管理' },
      { path: '/backtest', title: '回测分析' }
    ]

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path)
      await page.waitForLoadState('networkidle')
      
      // 验证页面标题包含应用名称
      const pageTitle = await page.title()
      expect(pageTitle).toContain(pageInfo.title)
      expect(pageTitle).toContain('STOK 股票交易决策系统')
    }
  })

  test('应该正确处理 404 页面', async ({ page }) => {
    // 导航到不存在的页面
    await page.goto('/nonexistent-page')
    await page.waitForLoadState('networkidle')
    
    // 验证显示 404 页面
    await expect(page.locator('h1')).toContainText('页面未找到')
    
    // 验证 Layout 组件仍然存在
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.header')).toBeVisible()
  })

  test('应该支持响应式设计', async ({ page }) => {
    // 测试桌面端布局
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.locator('.sidebar')).toBeVisible()
    
    // 测试移动端布局（侧边栏可能折叠）
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('.sidebar')).toBeVisible()
    
    // 测试小屏幕布局
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.sidebar')).toBeVisible()
  })

  test('应该正确切换侧边栏折叠状态', async ({ page }) => {
    // 初始状态侧边栏应该展开
    const sidebar = page.locator('.sidebar')
    await expect(sidebar).not.toHaveClass(/sidebar-collapsed/)
    
    // 点击折叠按钮
    const toggleButton = page.locator('.header-left button[icon]')
    await toggleButton.click()
    
    // 验证侧边栏折叠
    await expect(sidebar).toHaveClass(/sidebar-collapsed/)
    
    // 再次点击展开
    await toggleButton.click()
    await expect(sidebar).not.toHaveClass(/sidebar-collapsed/)
  })

  test('应该保持用户状态在页面切换时', async ({ page }) => {
    // 导航到不同页面
    await page.click('.sidebar-menu a[href="/dashboard"]')
    await page.waitForLoadState('networkidle')
    
    // 验证用户信息显示
    const userInfo = page.locator('.user-info')
    await expect(userInfo).toBeVisible()
    
    // 导航到其他页面
    await page.click('.sidebar-menu a[href="/stocks"]')
    await page.waitForLoadState('networkidle')
    
    // 验证用户信息仍然显示
    await expect(userInfo).toBeVisible()
  })

  test('应该正确处理主题切换', async ({ page }) => {
    // 验证主题切换按钮存在
    const themeButton = page.locator('.header-right button:has-text("暗色")')
    await expect(themeButton).toBeVisible()
    
    // 点击主题切换按钮
    await themeButton.click()
    
    // 验证按钮文本变化
    await expect(themeButton).toContainText('亮色')
  })
})

test.describe('路由性能测试', () => {
  test('页面切换应该在合理时间内完成', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const pages = ['/dashboard', '/stocks', '/decisions', '/models', '/backtest']
    
    for (const path of pages) {
      const startTime = Date.now()
      
      await page.click(`.sidebar-menu a[href="${path}"]`)
      await page.waitForLoadState('networkidle')
      
      const endTime = Date.now()
      const loadTime = endTime - startTime
      
      // 页面切换应该在 2 秒内完成
      expect(loadTime).toBeLessThan(2000)
    }
  })

  test('初始页面加载应该在合理时间内完成', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    // 初始加载应该在 3 秒内完成
    expect(loadTime).toBeLessThan(3000)
  })
})