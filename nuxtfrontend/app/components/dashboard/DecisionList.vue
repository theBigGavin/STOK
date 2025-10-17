<template>
    <UCard class="h-full">
        <template #header>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-zap" class="size-5 text-primary" />
                    <h3 class="text-lg font-semibold text-highlighted">实时决策</h3>
                </div>
                <div class="flex items-center gap-2">
                    <UBadge v-if="hasHighRiskDecisions" color="error" variant="subtle" class="text-xs">
                        高风险
                    </UBadge>
                    <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="sm" :loading="loading"
                        @click="refresh">
                        刷新
                    </UButton>
                </div>
            </div>
        </template>

        <div class="space-y-3">
            <!-- 加载状态 -->
            <div v-if="loading" class="flex justify-center py-8">
                <ULoadingIcon class="size-6 text-primary" />
            </div>

            <!-- 空状态 -->
            <div v-else-if="decisions.length === 0" class="text-center py-8">
                <UIcon name="i-lucide-clock" class="size-12 text-muted mb-4" />
                <p class="text-muted">暂无决策数据</p>
            </div>

            <!-- 决策列表 -->
            <div v-else class="space-y-3">
                <div v-for="decision in decisions" :key="`${decision.symbol}-${decision.timestamp}`"
                    class="flex items-center justify-between p-3 rounded-lg border border-default hover:bg-elevated transition-colors">
                    <div class="flex items-center gap-3">
                        <!-- 决策类型图标 -->
                        <div class="p-2 rounded-full" :class="decisionColorClasses(decision.decision)">
                            <UIcon :name="decisionIcon(decision.decision)" class="size-4"
                                :class="decisionIconColor(decision.decision)" />
                        </div>

                        <!-- 股票信息 -->
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-highlighted">
                                    {{ decision.symbol }}
                                </span>
                                <UBadge :color="riskLevelColor(decision.riskLevel)" variant="subtle" size="xs">
                                    {{ riskLevelText(decision.riskLevel) }}
                                </UBadge>
                            </div>
                            <p class="text-xs text-muted">
                                {{ formatTime(decision.timestamp) }}
                            </p>
                        </div>
                    </div>

                    <!-- 置信度和操作 -->
                    <div class="flex items-center gap-4">
                        <!-- 置信度进度条 -->
                        <div class="w-20">
                            <div class="flex justify-between text-xs text-muted mb-1">
                                <span>置信度</span>
                                <span>{{ decision.confidence.toFixed(1) }}%</span>
                            </div>
                            <UProgress :value="decision.confidence" :max="100" size="xs"
                                :color="confidenceColor(decision.confidence)" />
                        </div>

                        <!-- 查看详情按钮 -->
                        <UButton icon="i-lucide-eye" color="neutral" variant="ghost" size="sm" class="rounded-full"
                            @click="viewDecision(decision)" />
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex items-center justify-between text-xs text-muted">
                <span>最近更新: {{ formatTime(lastUpdated) }}</span>
                <span>共 {{ decisions.length }} 条决策</span>
            </div>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardData } from '~/composables/useDashboardData'

const {
    realTimeDecisions,
    loading,
    lastUpdated,
    hasHighRiskDecisions,
    refreshDashboard
} = useDashboardData()

// 计算属性
const decisions = computed(() => realTimeDecisions.value.slice(0, 8)) // 最多显示8条

// 方法
const refresh = () => {
    refreshDashboard()
}

const viewDecision = (decision: any) => {
    // 跳转到决策详情页面
    console.log('查看决策详情:', decision)
    // 这里可以添加路由跳转逻辑
}

const decisionColorClasses = (decision: string) => {
    switch (decision) {
        case 'BUY': return 'bg-success/10'
        case 'SELL': return 'bg-error/10'
        case 'HOLD': return 'bg-warning/10'
        default: return 'bg-neutral/10'
    }
}

const decisionIcon = (decision: string) => {
    switch (decision) {
        case 'BUY': return 'i-lucide-trending-up'
        case 'SELL': return 'i-lucide-trending-down'
        case 'HOLD': return 'i-lucide-minus'
        default: return 'i-lucide-help-circle'
    }
}

const decisionIconColor = (decision: string) => {
    switch (decision) {
        case 'BUY': return 'text-success'
        case 'SELL': return 'text-error'
        case 'HOLD': return 'text-warning'
        default: return 'text-neutral'
    }
}

const riskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
        case 'LOW': return 'success'
        case 'MEDIUM': return 'warning'
        case 'HIGH': return 'error'
        default: return 'neutral'
    }
}

const riskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
        case 'LOW': return '低风险'
        case 'MEDIUM': return '中风险'
        case 'HIGH': return '高风险'
        default: return '未知'
    }
}

const confidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success'
    if (confidence >= 60) return 'warning'
    return 'error'
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

// 模拟数据（用于开发阶段）
const mockDecisions = computed(() => [
    {
        symbol: 'AAPL',
        decision: 'BUY' as const,
        confidence: 85.5,
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        riskLevel: 'LOW' as const
    },
    {
        symbol: 'TSLA',
        decision: 'SELL' as const,
        confidence: 72.3,
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        riskLevel: 'HIGH' as const
    },
    {
        symbol: 'MSFT',
        decision: 'HOLD' as const,
        confidence: 68.9,
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        riskLevel: 'MEDIUM' as const
    },
    {
        symbol: 'GOOGL',
        decision: 'BUY' as const,
        confidence: 91.2,
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        riskLevel: 'LOW' as const
    }
])

// 开发阶段使用模拟数据
const displayDecisions = computed(() =>
    decisions.value.length > 0 ? decisions.value : mockDecisions.value
)
</script>