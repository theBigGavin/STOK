<!-- components/charts/VoteChart.vue -->
<template>
    <UCard>
        <template #header>
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold">模型投票分布</h3>
                <div class="flex gap-2">
                    <UButton v-for="chartType in chartTypes" :key="chartType.value"
                        :variant="selectedChartType === chartType.value ? 'solid' : 'outline'"
                        @click="selectedChartType = chartType.value">
                        {{ chartType.label }}
                    </UButton>
                </div>
            </div>
        </template>

        <div v-if="loading" class="h-80 flex items-center justify-center">
            <div class="text-center">
                <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary" />
                <p class="mt-2 text-sm text-gray-500">加载中...</p>
            </div>
        </div>

        <div v-else-if="error" class="h-80 flex items-center justify-center">
            <div class="text-center">
                <UIcon name="i-heroicons-exclamation-triangle" class="h-8 w-8 text-red-500" />
                <p class="mt-2 text-sm text-red-500">{{ error }}</p>
                <UButton class="mt-4" @click="$emit('retry')">重试</UButton>
            </div>
        </div>

        <div v-else-if="!data || data.length === 0" class="h-80 flex items-center justify-center">
            <div class="text-center">
                <UIcon name="i-heroicons-chart-bar" class="h-8 w-8 text-gray-400" />
                <p class="mt-2 text-sm text-gray-500">暂无投票数据</p>
            </div>
        </div>

        <VisPieContainer v-else-if="selectedChartType === 'pie'" :data="pieChartData" class="h-80">
            <VisPie :value="pieValue" :color="pieColor" />
            <VisTooltip :triggers="pieTooltipTriggers" />
        </VisPieContainer>

        <VisXYContainer v-else :data="barChartData" class="h-80">
            <VisBar :x="barX" :y="barY" :color="barColor" />
            <VisAxis type="x" />
            <VisAxis type="y" :tick-format="formatCount" />
            <VisTooltip :triggers="barTooltipTriggers" />
        </VisXYContainer>
    </UCard>
</template>

<script setup lang="ts">
import { VisPieContainer, VisPie, VisXYContainer, VisBar, VisAxis, VisTooltip } from '@unovis/vue'
import type { ModelDecision } from '~/types/decisions'

interface VoteData {
    decision: string
    count: number
    percentage: number
    color: string
}

interface Props {
    data: ModelDecision[]
    loading?: boolean
    error?: string
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: ''
})

const emit = defineEmits<{
    retry: []
}>()

const selectedChartType = ref<'pie' | 'bar'>('pie')

const chartTypes = [
    { label: '饼图', value: 'pie' },
    { label: '柱状图', value: 'bar' },
]

const decisionColors = {
    BUY: 'var(--color-emerald-500)',
    SELL: 'var(--color-red-500)',
    HOLD: 'var(--color-amber-500)',
}

const voteData = computed<VoteData[]>(() => {
    if (!props.data || props.data.length === 0) return []

    const decisionCounts = props.data.reduce((acc, item) => {
        acc[item.decision] = (acc[item.decision] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const total = props.data.length

    return Object.entries(decisionCounts).map(([decision, count]) => ({
        decision,
        count,
        percentage: (count / total) * 100,
        color: decisionColors[decision as keyof typeof decisionColors] || 'var(--color-gray-500)',
    }))
})

// 饼图数据
const pieChartData = computed(() => voteData.value)
const pieValue = (d: VoteData) => d.count
const pieColor = (d: VoteData) => d.color
const pieTooltipTriggers = {
    [VisTooltip.selectors.pie]: (d: VoteData) =>
        `${d.decision}: ${d.count}票 (${d.percentage.toFixed(1)}%)`,
}

// 柱状图数据
const barChartData = computed(() => voteData.value)
const barX = (d: VoteData) => d.decision
const barY = (d: VoteData) => d.count
const barColor = (d: VoteData) => d.color
const barTooltipTriggers = {
    [VisTooltip.selectors.bar]: (d: VoteData) =>
        `${d.decision}: ${d.count}票 (${d.percentage.toFixed(1)}%)`,
}

const formatCount = (count: number) => `${count}票`
</script>

<style scoped>
:deep(.vis-tooltip) {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 12px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    font-size: 14px;
}
</style>