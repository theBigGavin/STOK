<template>
    <UCard>
        <template #header>
            <div class="flex items-center gap-2">
                <UIcon name="i-lucide-zap" class="size-5 text-primary" />
                <h3 class="text-lg font-semibold text-highlighted">快速操作</h3>
            </div>
        </template>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- 生成决策 -->
            <div class="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center p-6 text-center rounded-lg border border-default bg-elevated/50"
                @click="generateDecision">
                <UIcon name="i-lucide-play" class="size-8 text-primary mb-3" />
                <div class="font-medium text-highlighted mb-1">生成决策</div>
                <div class="text-xs text-muted">快速生成交易决策</div>
            </div>

            <!-- 批量决策 -->
            <div class="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center p-6 text-center rounded-lg border border-default bg-elevated/50"
                @click="batchDecisions">
                <UIcon name="i-lucide-layers" class="size-8 text-success mb-3" />
                <div class="font-medium text-highlighted mb-1">批量决策</div>
                <div class="text-xs text-muted">多股票批量分析</div>
            </div>

            <!-- 刷新数据 -->
            <div class="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center p-6 text-center rounded-lg border border-default bg-elevated/50"
                @click="refreshData">
                <UIcon name="i-lucide-refresh-cw" class="size-8 text-warning mb-3" />
                <div class="font-medium text-highlighted mb-1">刷新数据</div>
                <div class="text-xs text-muted">更新股票数据</div>
            </div>

            <!-- 系统设置 -->
            <div class="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center p-6 text-center rounded-lg border border-default bg-elevated/50"
                @click="openSettings">
                <UIcon name="i-lucide-settings" class="size-8 text-neutral mb-3" />
                <div class="font-medium text-highlighted mb-1">系统设置</div>
                <div class="text-xs text-muted">配置系统参数</div>
            </div>
        </div>

        <!-- 更多操作 -->
        <div class="mt-6 pt-6 border-t border-default">
            <h4 class="text-sm font-medium text-highlighted mb-4">更多操作</h4>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <UButton icon="i-lucide-chart-bar" color="neutral" variant="outline" size="sm" class="justify-start"
                    @click="viewAnalytics">
                    查看分析报告
                </UButton>
                <UButton icon="i-lucide-download" color="neutral" variant="outline" size="sm" class="justify-start"
                    @click="exportData">
                    导出数据
                </UButton>
                <UButton icon="i-lucide-history" color="neutral" variant="outline" size="sm" class="justify-start"
                    @click="viewHistory">
                    决策历史
                </UButton>
                <UButton icon="i-lucide-help-circle" color="neutral" variant="outline" size="sm" class="justify-start"
                    @click="showHelp">
                    使用帮助
                </UButton>
            </div>
        </div>

        <!-- 最近操作 -->
        <div class="mt-6 pt-6 border-t border-default">
            <h4 class="text-sm font-medium text-highlighted mb-4">最近操作</h4>
            <div class="space-y-3">
                <div v-for="action in recentActions" :key="action.id" class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2">
                        <UIcon :name="action.icon" class="size-4" :class="actionColor(action.type)" />
                        <span class="text-highlighted">{{ action.description }}</span>
                    </div>
                    <span class="text-xs text-muted">{{ formatTime(action.timestamp) }}</span>
                </div>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 状态
const recentActions = ref([
    {
        id: 1,
        type: 'decision',
        description: '生成了 AAPL 决策',
        icon: 'i-lucide-play',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
        id: 2,
        type: 'refresh',
        description: '刷新了股票数据',
        icon: 'i-lucide-refresh-cw',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
        id: 3,
        type: 'batch',
        description: '执行了批量分析',
        icon: 'i-lucide-layers',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
        id: 4,
        type: 'export',
        description: '导出了决策报告',
        icon: 'i-lucide-download',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString()
    }
])

// 方法
const generateDecision = () => {
    console.log('生成决策')
    // 这里可以添加生成决策的逻辑
    addRecentAction('decision', '生成了新的决策')
}

const batchDecisions = () => {
    console.log('批量决策')
    // 这里可以添加批量决策的逻辑
    addRecentAction('batch', '执行了批量决策')
}

const refreshData = () => {
    console.log('刷新数据')
    // 这里可以添加刷新数据的逻辑
    addRecentAction('refresh', '刷新了系统数据')
}

const openSettings = () => {
    console.log('打开设置')
    // 这里可以添加打开设置的逻辑
    addRecentAction('settings', '打开了系统设置')
}

const viewAnalytics = () => {
    console.log('查看分析报告')
    // 这里可以添加查看分析报告的逻辑
    addRecentAction('analytics', '查看了分析报告')
}

const exportData = () => {
    console.log('导出数据')
    // 这里可以添加导出数据的逻辑
    addRecentAction('export', '导出了数据')
}

const viewHistory = () => {
    console.log('查看历史')
    // 这里可以添加查看历史的逻辑
    addRecentAction('history', '查看了决策历史')
}

const showHelp = () => {
    console.log('显示帮助')
    // 这里可以添加显示帮助的逻辑
    addRecentAction('help', '查看了使用帮助')
}

const addRecentAction = (type: string, description: string) => {
    recentActions.value.unshift({
        id: Date.now(),
        type,
        description,
        icon: getActionIcon(type),
        timestamp: new Date().toISOString()
    })

    // 限制最近操作数量
    if (recentActions.value.length > 5) {
        recentActions.value = recentActions.value.slice(0, 5)
    }
}

const getActionIcon = (type: string) => {
    switch (type) {
        case 'decision': return 'i-lucide-play'
        case 'batch': return 'i-lucide-layers'
        case 'refresh': return 'i-lucide-refresh-cw'
        case 'settings': return 'i-lucide-settings'
        case 'analytics': return 'i-lucide-chart-bar'
        case 'export': return 'i-lucide-download'
        case 'history': return 'i-lucide-history'
        case 'help': return 'i-lucide-help-circle'
        default: return 'i-lucide-circle'
    }
}

const actionColor = (type: string) => {
    switch (type) {
        case 'decision': return 'text-primary'
        case 'batch': return 'text-success'
        case 'refresh': return 'text-warning'
        case 'settings': return 'text-neutral'
        case 'analytics': return 'text-info'
        case 'export': return 'text-secondary'
        case 'history': return 'text-muted'
        case 'help': return 'text-muted'
        default: return 'text-default'
    }
}

const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`
    return date.toLocaleDateString('zh-CN')
}
</script>