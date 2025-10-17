import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/Layout.vue'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '仪表盘',
          icon: 'DataBoard',
        },
      },
      {
        path: '/stocks',
        name: 'Stocks',
        component: () => import('@/views/Stocks.vue'),
        meta: {
          title: '股票监控',
          icon: 'TrendCharts',
        },
      },
      {
        path: '/decisions',
        name: 'Decisions',
        component: () => import('@/views/Decisions.vue'),
        meta: {
          title: '决策分析',
          icon: 'DataAnalysis',
        },
      },
      {
        path: '/models',
        name: 'Models',
        component: () => import('@/views/Models.vue'),
        meta: {
          title: '模型管理',
          icon: 'Management',
        },
      },
      {
        path: '/backtest',
        name: 'Backtest',
        component: () => import('@/views/Backtest.vue'),
        meta: {
          title: '回测分析',
          icon: 'Histogram',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - STOK 股票交易决策系统`
  }
  next()
})

export default router