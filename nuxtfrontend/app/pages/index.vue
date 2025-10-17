<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="股票回测决策系统" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <!-- 全局加载状态指示器 -->
          <UTooltip text="系统状态" :shortcuts="['S']">
            <UButton color="neutral" variant="ghost" square @click="showSystemStatus = true">
              <UChip :color="systemStatusColor" inset>
                <UIcon name="i-lucide-server" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <!-- 刷新按钮 -->
          <UTooltip text="刷新数据" :shortcuts="['R']">
            <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" square :loading="loading"
              @click="refreshDashboard" />
          </UTooltip>

          <!-- 通知按钮 -->
          <UTooltip text="通知" :shortcuts="['N']">
            <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <!-- 快速操作菜单 -->
          <UDropdownMenu :items="quickActionItems">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <!-- 工具栏 -->
      <UDashboardToolbar>
        <template #left>
          <!-- 数据更新时间 -->
          <div class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="i-lucide-clock" class="size-4" />
            <span>最后更新: {{ formatTime(lastUpdated) }}</span>
          </div>
        </template>

        <template #right>
          <!-- 自动刷新开关 -->
          <div class="flex items-center gap-2">
            <UCheckbox v-model="autoRefresh" label="自动刷新" />
            <span class="text-xs text-muted">每30秒</span>
          </div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- 加载状态 -->
      <div v-if="loading" class="mb-6">
        <DashboardLoading />
      </div>

      <!-- 错误提示 -->
      <UAlert v-else-if="error" :title="error" color="error" variant="solid" icon="i-lucide-alert-triangle"
        class="mb-6">
        <template #description>
          请检查网络连接或稍后重试
        </template>
        <template #actions>
          <UButton color="neutral" variant="solid" label="重试" @click="refreshDashboard" />
        </template>
      </UAlert>

      <!-- 主要内容 -->
      <div v-else>
        <!-- 系统概览统计卡片 -->
        <div class="mb-6">
          <DashboardStats />
        </div>

        <!-- 主要内容区域 -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <!-- 左侧列：实时决策和快速操作 -->
          <div class="space-y-6">
            <!-- 实时决策 -->
            <DecisionList />

            <!-- 快速操作 -->
            <QuickActions />
          </div>

          <!-- 中间列：模型性能 -->
          <div class="space-y-6">
            <!-- 模型性能图表 -->
            <ModelPerformance />
          </div>

          <!-- 右侧列：系统状态 -->
          <div class="space-y-6">
            <!-- 系统状态面板 -->
            <SystemStatus />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- 系统状态模态框 -->
  <UModal v-model="showSystemStatus">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">系统状态详情</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="showSystemStatus = false" />
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 rounded-lg border border-default">
            <div class="text-2xl font-semibold text-highlighted">
              {{ systemUptime }}
            </div>
            <div class="text-sm text-muted">运行时间</div>
          </div>
          <div class="text-center p-4 rounded-lg border border-default">
            <div class="text-2xl font-semibold text-highlighted">
              {{ memoryUsage }}%
            </div>
            <div class="text-sm text-muted">内存使用</div>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="font-medium">服务状态</h4>
          <div class="space-y-2">
            <div v-for="service in serviceStatus" :key="service.name"
              class="flex items-center justify-between p-2 rounded border border-default">
              <span class="text-sm">{{ service.name }}</span>
              <UBadge :color="serviceStatusColor(service.status)" variant="subtle" size="xs">
                {{ serviceStatusText(service.status) }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDashboardData } from '~/composables/useDashboardData'
import { useDashboard } from '~/composables/useDashboard'

// 组件导入
import DashboardStats from '~/components/dashboard/DashboardStats.vue'
import DecisionList from '~/components/dashboard/DecisionList.vue'
import ModelPerformance from '~/components/dashboard/ModelPerformance.vue'
import SystemStatus from '~/components/dashboard/SystemStatus.vue'
import QuickActions from '~/components/dashboard/QuickActions.vue'

// 组合式函数
const { isNotificationsSlideoverOpen } = useDashboard()
const {
  loading,
  error,
  lastUpdated,
  autoRefresh,
  systemHealth,
  systemStatusColor,
  startAutoRefresh,
  stopAutoRefresh,
  loadDashboardData,
  refreshDashboard,
  clearError
} = useDashboardData()

// 状态
const showSystemStatus = ref(false)

// 快速操作菜单项
const quickActionItems = [[
  {
    label: '生成决策',
    icon: 'i-lucide-play',
    click: () => console.log('生成决策')
  },
  {
    label: '批量决策',
    icon: 'i-lucide-layers',
    click: () => console.log('批量决策')
  },
  {
    label: '刷新数据',
    icon: 'i-lucide-refresh-cw',
    click: () => refreshDashboard()
  }
]]

// 计算属性
const systemUptime = computed(() => {
  const uptime = systemHealth.value?.system.uptime || 0
  if (uptime < 3600) return `${Math.floor(uptime / 60)}分钟`
  if (uptime < 86400) return `${Math.floor(uptime / 3600)}小时`
  return `${Math.floor(uptime / 86400)}天`
})

const memoryUsage = computed(() => {
  return systemHealth.value?.system.memoryUsage || 0
})

const serviceStatus = computed(() => [
  {
    name: 'API服务',
    status: systemHealth.value?.services.api?.status || 'healthy'
  },
  {
    name: '数据库',
    status: systemHealth.value?.services.database?.status || 'healthy'
  },
  {
    name: 'Redis缓存',
    status: systemHealth.value?.services.redis?.status || 'healthy'
  },
  {
    name: '模型服务',
    status: systemHealth.value?.services.models?.status || 'healthy'
  }
])

// 方法
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const serviceStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'success'
    case 'degraded': return 'warning'
    case 'unhealthy': return 'error'
    default: return 'neutral'
  }
}

const serviceStatusText = (status: string) => {
  switch (status) {
    case 'healthy': return '正常'
    case 'degraded': return '降级'
    case 'unhealthy': return '异常'
    default: return '未知'
  }
}

// 自动刷新逻辑
watch(autoRefresh, (newValue) => {
  if (newValue) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// 生命周期
onMounted(async () => {
  // 初始化加载数据
  await loadDashboardData()
})

// 错误处理
watch(error, (newError) => {
  if (newError) {
    // 可以在这里添加错误上报逻辑
    console.error('仪表盘错误:', newError)
  }
})

// 键盘快捷键
defineShortcuts({
  'r': () => refreshDashboard(),
  's': () => showSystemStatus.value = !showSystemStatus.value,
  'n': () => isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
})
</script>

<style scoped>
/* 自定义样式 */
.dashboard-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* 加载动画 */
.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-grid {
    gap: 1rem;
  }
}
</style>
