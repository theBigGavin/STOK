<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

// const route = useRoute();
const toast = useToast();

const open = ref(false);

// 响应式断点
const { sm, md, lg } = useBreakpoints({
  sm: 640,
  md: 768,
  lg: 1024,
});

const links = [
  {
    label: '驾驶舱',
    icon: 'i-lucide-chart-bar',
    to: '/',
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: '股票监控',
    icon: 'i-lucide-trending-up',
    to: '/stocks',
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: '决策分析',
    icon: 'i-lucide-target',
    to: '/decisions',
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: '模型管理',
    icon: 'i-lucide-brain',
    to: '/models',
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: '回测分析',
    icon: 'i-lucide-test-tube',
    to: '/backtest',
    onSelect: () => {
      open.value = false;
    },
  },
] satisfies NavigationMenuItem[];

const groups = computed(() => [
  {
    id: 'links',
    label: '快速导航',
    items: links,
  },
  {
    id: 'shortcuts',
    label: '快捷键',
    items: [
      {
        id: 'dashboard',
        label: '仪表盘 (g d)',
        icon: 'i-lucide-chart-bar',
        to: '/',
        shortcuts: ['g', 'd'],
      },
      {
        id: 'stocks',
        label: '股票监控 (g s)',
        icon: 'i-lucide-trending-up',
        to: '/stocks',
        shortcuts: ['g', 's'],
      },
      {
        id: 'decisions',
        label: '决策分析 (g c)',
        icon: 'i-lucide-target',
        to: '/decisions',
        shortcuts: ['g', 'c'],
      },
      {
        id: 'models',
        label: '模型管理 (g m)',
        icon: 'i-lucide-brain',
        to: '/models',
        shortcuts: ['g', 'm'],
      },
      {
        id: 'backtest',
        label: '回测分析 (g b)',
        icon: 'i-lucide-test-tube',
        to: '/backtest',
        shortcuts: ['g', 'b'],
      },
    ],
  },
]);

onMounted(async () => {
  const cookie = useCookie('cookie-consent');
  if (cookie.value === 'accepted') {
    return;
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          cookie.value = 'accepted';
        },
      },
      {
        label: 'Opt out',
        color: 'neutral',
        variant: 'ghost',
      },
    ],
  });
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <!-- 移动端导航栏 -->
    <UDashboardNavbar v-if="!lg" class="border-b border-default/75 bg-background/75 backdrop-blur-md">
      <template #left>
        <UDashboardSidebarToggle class="lg:hidden" @click="open = !open" />
        <h1 class="text-lg font-semibold text-foreground">
          STOK 交易决策系统
        </h1>
      </template>

      <template #right>
        <UDashboardSearchButton class="bg-transparent ring-default" />
      </template>
    </UDashboardNavbar>

    <!-- 侧边栏 -->
    <UDashboardSidebar id="default" v-model:open="open" collapsible resizable :resizable-breakpoint="lg"
      class="bg-elevated/25" :ui="{
        footer: 'lg:border-t lg:border-default',
        base: 'lg:flex lg:flex-col lg:w-64',
        overlay: 'lg:hidden',
        content: 'flex-1 flex flex-col',
      }">
      <template #header>
        <div class="flex items-center gap-3 px-4 py-4">
          <div class="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UIcon name="i-lucide-chart-bar" class="size-5" />
          </div>
          <div class="flex flex-col">
            <h1 class="text-lg font-semibold text-foreground">
              STOK
            </h1>
            <p class="text-xs text-muted-foreground">
              交易决策系统
            </p>
          </div>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default mx-4 mb-4" />

        <UNavigationMenu :collapsed="collapsed" :items="links" orientation="vertical" :tooltip="collapsed"
          class="px-2" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- 桌面端工具栏 -->
      <UDashboardToolbar v-if="lg" class="border-b border-default/75 bg-background/75 backdrop-blur-md">
        <template #left>
          <h1 class="text-lg font-semibold text-foreground">
            STOK 交易决策系统
          </h1>
        </template>

        <template #right>
          <UDashboardSearchButton class="bg-transparent ring-default" />
        </template>
      </UDashboardToolbar>

      <!-- 页面内容 -->
      <main class="flex-1 overflow-auto p-4 lg:p-6">
        <slot />
      </main>
    </div>

    <UDashboardSearch :groups="groups" />
  </UDashboardGroup>
</template>
