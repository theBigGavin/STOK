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
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              square
              :loading="loading"
              @click="refreshDashboard"
            />
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
      <UAlert
        v-else-if="error"
        :title="error"
        color="error"
        variant="solid"
        icon="i-lucide-alert-triangle"
        class="mb-6"
      >
        <template #description> 请检查网络连接或稍后重试 </template>
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
          <!-- 左侧列：实时决策 -->
          <div class="space-y-6">
            <!-- 实时决策 -->
            <DecisionList />
          </div>

          <!-- 中间列：模型性能 -->
          <div class="space-y-6">
            <!-- 模型性能图表 -->
            <ModelPerformance />
          </div>

          <!-- 右侧列：快速操作 -->
          <div class="space-y-6">
            <!-- 快速操作 -->
            <QuickActions />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <UDrawer v-model:open="showSystemStatus" direction="right" inset>
    <template #content>
      <!-- 系统状态面板 -->
      <SystemStatus />
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useDashboardData } from '~/composables/useDashboardData';
import { useDashboard } from '~/composables/useDashboard';

// 组件导入
import DashboardStats from '~/components/dashboard/DashboardStats.vue';
import DecisionList from '~/components/dashboard/DecisionList.vue';
import ModelPerformance from '~/components/dashboard/ModelPerformance.vue';
import SystemStatus from '~/components/dashboard/SystemStatus.vue';
import QuickActions from '~/components/dashboard/QuickActions.vue';

// 组合式函数
const { isNotificationsSlideoverOpen } = useDashboard();
const {
  loading,
  error,
  lastUpdated,
  autoRefresh,
  systemStatusColor,
  startAutoRefresh,
  stopAutoRefresh,
  loadDashboardData,
  refreshDashboard,
} = useDashboardData();

// 状态
const showSystemStatus = ref(false);

// 快速操作菜单项
const quickActionItems = [
  [
    {
      label: '生成决策',
      icon: 'i-lucide-play',
      click: () => console.log('生成决策'),
    },
    {
      label: '批量决策',
      icon: 'i-lucide-layers',
      click: () => console.log('批量决策'),
    },
    {
      label: '刷新数据',
      icon: 'i-lucide-refresh-cw',
      click: () => refreshDashboard(),
    },
  ],
];

// 计算属性

// 方法
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 自动刷新逻辑
watch(autoRefresh, newValue => {
  if (newValue) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

// 生命周期
onMounted(async () => {
  // 初始化加载数据
  await loadDashboardData();
});

// 错误处理
watch(error, newError => {
  if (newError) {
    // 可以在这里添加错误上报逻辑
    console.error('仪表盘错误:', newError);
  }
});

// 键盘快捷键
defineShortcuts({
  r: () => refreshDashboard(),
  s: () => (showSystemStatus.value = !showSystemStatus.value),
  n: () => (isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value),
});
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
