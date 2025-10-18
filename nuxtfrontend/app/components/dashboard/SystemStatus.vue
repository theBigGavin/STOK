<template>
  <UCard class="h-full">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-server" class="size-5 text-primary" />
          <h3 class="text-lg font-semibold text-highlighted">系统状态</h3>
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="systemStatusColor" variant="subtle" class="text-xs">
            {{ systemStatusText }}
          </UBadge>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="loading"
            @click="refresh"
          >
            刷新
          </UButton>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path-20-solid" class="size-6 text-primary animate-spin" />
      </div>

      <!-- 系统概览 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 运行时间 -->
        <div class="text-center p-4 rounded-lg border border-default bg-elevated/50">
          <UIcon name="i-lucide-clock" class="size-8 text-primary mb-2" />
          <div class="text-2xl font-semibold text-highlighted">
            {{ systemUptime }}
          </div>
          <div class="text-xs text-muted">运行时间</div>
        </div>

        <!-- 内存使用 -->
        <div class="text-center p-4 rounded-lg border border-default bg-elevated/50">
          <UIcon name="i-lucide-memory-stick" class="size-8 text-warning mb-2" />
          <div class="text-2xl font-semibold text-highlighted">{{ memoryUsage }}%</div>
          <div class="text-xs text-muted">内存使用</div>
        </div>

        <!-- CPU使用 -->
        <div class="text-center p-4 rounded-lg border border-default bg-elevated/50">
          <UIcon name="i-lucide-cpu" class="size-8 text-success mb-2" />
          <div class="text-2xl font-semibold text-highlighted">{{ cpuUsage }}%</div>
          <div class="text-xs text-muted">CPU使用</div>
        </div>

        <!-- 磁盘使用 -->
        <div class="text-center p-4 rounded-lg border border-default bg-elevated/50">
          <UIcon name="i-lucide-hard-drive" class="size-8 text-neutral mb-2" />
          <div class="text-2xl font-semibold text-highlighted">{{ diskUsage }}%</div>
          <div class="text-xs text-muted">磁盘使用</div>
        </div>
      </div>

      <!-- 服务状态 -->
      <div>
        <h4 class="text-sm font-medium text-highlighted mb-4">服务状态</h4>
        <div class="space-y-3">
          <div
            v-for="service in serviceStatus"
            :key="service.name"
            class="flex items-center justify-between p-3 rounded-lg border border-default hover:bg-elevated transition-colors"
          >
            <div class="flex items-center gap-3">
              <UIcon
                :name="service.icon"
                class="size-5"
                :class="serviceStatusColor(service.status)"
              />
              <div>
                <div class="font-medium text-highlighted">
                  {{ service.name }}
                </div>
                <div class="text-xs text-muted">
                  {{ service.description }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-muted">
                {{ service.responseTime }}
              </span>
              <UBadge :color="serviceStatusColor(service.status)" variant="subtle" size="xs">
                {{ serviceStatusText(service.status) }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- 性能指标 -->
      <div>
        <h4 class="text-sm font-medium text-highlighted mb-4">性能指标</h4>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- 请求统计 -->
          <div class="p-4 rounded-lg border border-default bg-elevated/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-highlighted">请求统计</span>
              <UIcon name="i-lucide-bar-chart-3" class="size-4 text-muted" />
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted">总请求数</span>
                <span class="font-medium">{{ performanceStats.totalRequests }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">错误率</span>
                <span class="font-medium" :class="errorRateColor">
                  {{ performanceStats.errorRate }}%
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">平均响应时间</span>
                <span class="font-medium">{{ performanceStats.avgResponseTime }}ms</span>
              </div>
            </div>
          </div>

          <!-- 连接统计 -->
          <div class="p-4 rounded-lg border border-default bg-elevated/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-highlighted">连接统计</span>
              <UIcon name="i-lucide-users" class="size-4 text-muted" />
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted">活跃连接</span>
                <span class="font-medium">{{ performanceStats.activeConnections }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">数据库连接</span>
                <span class="font-medium" :class="dbConnectionColor">
                  {{ performanceStats.dbConnections }}
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">缓存命中率</span>
                <span class="font-medium">{{ performanceStats.cacheHitRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between text-xs text-muted">
        <span>最后检查: {{ formatTime(lastUpdated) }}</span>
        <div class="flex items-center gap-2">
          <UCheckbox v-model="autoRefresh" label="自动刷新" />
          <span>每30秒</span>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDashboardData } from '~/composables/useDashboardData';

const {
  systemHealth,
  loading,
  lastUpdated,
  systemStatusColor,
  startAutoRefresh,
  stopAutoRefresh,
  refreshDashboard,
} = useDashboardData();

// 状态
const autoRefresh = ref(false);

// 计算属性
const systemStatusText = computed(() => {
  const status = systemHealth.value?.status || 'healthy';
  switch (status) {
    case 'healthy':
      return '健康';
    case 'degraded':
      return '降级';
    case 'unhealthy':
      return '异常';
    default:
      return '未知';
  }
});

const systemUptime = computed(() => {
  const uptime = systemHealth.value?.system.uptime || 0;
  if (uptime < 3600) return `${Math.floor(uptime / 60)}分钟`;
  if (uptime < 86400) return `${Math.floor(uptime / 3600)}小时`;
  return `${Math.floor(uptime / 86400)}天`;
});

const memoryUsage = computed(() => {
  return systemHealth.value?.system.memoryUsage || 0;
});

const cpuUsage = computed(() => {
  return systemHealth.value?.system.cpuUsage || 0;
});

const diskUsage = computed(() => {
  return systemHealth.value?.system.diskUsage || 0;
});

const serviceStatus = computed(() => [
  {
    name: 'API服务',
    description: '后端API接口',
    status: systemHealth.value?.services.api?.status || 'healthy',
    responseTime: `${systemHealth.value?.services.api?.responseTime || 0}ms`,
    icon: 'i-lucide-server',
  },
  {
    name: '数据库',
    description: 'PostgreSQL数据库',
    status: systemHealth.value?.services.database?.status || 'healthy',
    responseTime: `${systemHealth.value?.services.database?.responseTime || 0}ms`,
    icon: 'i-lucide-database',
  },
  {
    name: 'Redis缓存',
    description: '内存缓存服务',
    status: systemHealth.value?.services.redis?.status || 'healthy',
    responseTime: `${systemHealth.value?.services.redis?.responseTime || 0}ms`,
    icon: 'i-lucide-memory-stick',
  },
  {
    name: '模型服务',
    description: '机器学习模型',
    status: systemHealth.value?.services.models?.status || 'healthy',
    responseTime: `${systemHealth.value?.services.models?.responseTime || 0}ms`,
    icon: 'i-lucide-brain',
  },
]);

const performanceStats = computed(() => ({
  totalRequests: 12478,
  errorRate: 0.8,
  avgResponseTime: 45,
  activeConnections: 23,
  dbConnections: '正常',
  cacheHitRate: 92.5,
}));

const errorRateColor = computed(() => {
  const rate = performanceStats.value.errorRate;
  if (rate < 1) return 'text-success';
  if (rate < 5) return 'text-warning';
  return 'text-error';
});

const dbConnectionColor = computed(() => {
  return performanceStats.value.dbConnections === '正常' ? 'text-success' : 'text-error';
});

// 方法
const refresh = () => {
  refreshDashboard();
};

const serviceStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'unhealthy':
      return 'error';
    default:
      return 'neutral';
  }
};

const serviceStatusText = (status: string) => {
  switch (status) {
    case 'healthy':
      return '正常';
    case 'degraded':
      return '降级';
    case 'unhealthy':
      return '异常';
    default:
      return '未知';
  }
};

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

</script>
