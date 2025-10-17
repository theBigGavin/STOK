<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[{
  label: '仪表盘',
  icon: 'i-lucide-chart-bar',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: '股票监控',
  icon: 'i-lucide-trending-up',
  to: '/stocks',
  onSelect: () => {
    open.value = false
  }
}, {
  label: '决策分析',
  icon: 'i-lucide-target',
  to: '/decisions',
  onSelect: () => {
    open.value = false
  }
}, {
  label: '模型管理',
  icon: 'i-lucide-brain',
  to: '/models',
  onSelect: () => {
    open.value = false
  }
}, {
  label: '回测分析',
  icon: 'i-lucide-test-tube',
  to: '/backtest',
  onSelect: () => {
    open.value = false
  }
}], [{
  label: '系统帮助',
  icon: 'i-lucide-help-circle',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}, {
  label: '反馈建议',
  icon: 'i-lucide-message-square',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: '快速导航',
  items: links.flat()
}, {
  id: 'shortcuts',
  label: '快捷键',
  items: [{
    id: 'dashboard',
    label: '仪表盘 (g d)',
    icon: 'i-lucide-chart-bar',
    to: '/',
    shortcuts: ['g', 'd']
  }, {
    id: 'stocks',
    label: '股票监控 (g s)',
    icon: 'i-lucide-trending-up',
    to: '/stocks',
    shortcuts: ['g', 's']
  }, {
    id: 'decisions',
    label: '决策分析 (g c)',
    icon: 'i-lucide-target',
    to: '/decisions',
    shortcuts: ['g', 'c']
  }, {
    id: 'models',
    label: '模型管理 (g m)',
    icon: 'i-lucide-brain',
    to: '/models',
    shortcuts: ['g', 'm']
  }, {
    id: 'backtest',
    label: '回测分析 (g b)',
    icon: 'i-lucide-test-tube',
    to: '/backtest',
    shortcuts: ['g', 'b']
  }]
}, {
  id: 'code',
  label: '开发资源',
  items: [{
    id: 'source',
    label: '查看页面源码',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar id="default" v-model:open="open" collapsible resizable class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }">
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip popover />

        <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
