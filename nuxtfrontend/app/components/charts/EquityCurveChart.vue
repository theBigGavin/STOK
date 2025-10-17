<!-- components/charts/EquityCurveChart.vue -->
<template>
    <UCard>
        <template #header>
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold">净值曲线</h3>
                <div class="flex gap-2">
                    <USelect v-model="selectedComparison" :options="comparisonOptions" class="w-40" />
                    <UButton v-for="period in periods" :key="period.value"
                        :variant="selectedPeriod === period.value ? 'solid' : 'outline'"
                        @click="handlePeriodChange(period.value)">
                        {{ period.label }}
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
                <UIcon name="i-heroicons-chart-line" class="h-8 w-8 text-gray-400" />
                <p class="mt-2 text-sm text-gray-500">暂无净值数据</p>
            </div>
        </div>

        <VisXYContainer v-else :data="chartData" class="h-80">
            <template v-for="curve in visibleCurves" :key="curve.name">
                <VisLine :x="x" :y="(d: EquityData) => getCurveValue(d, curve.name)" :color="curve.color"
                    :width="curve.name === '基准' ? 1 : 2" />
                <VisArea v-if="curve.name !== '基准'" :x="x" :y="(d: EquityData) => getCurveValue(d, curve.name)"
                    :color="curve.color" :opacity="0.1" />
            </template>
            <VisAxis type="x" :tick-format="formatDate" />
            <VisAxis type="y" :tick-format="formatEquity" />
            <VisCrosshair :template="tooltipTemplate" />
            <VisTooltip />
            <VisLegend :items="legendItems" />
        </VisXYContainer>
    </UCard>
</template>

<script setup lang="ts">
import { VisXYContainer, VisLine, VisArea, VisAxis, VisCrosshair, VisTooltip, VisLegend } from '@unovis/vue'
import type { EquityPoint } from '~/types/backtest'

interface EquityData {
    date: Date
    [curveName: string]: any
}

interface EquityCurve {
    name: string
    data: EquityPoint[]
    color: string
}

interface Props {
    curves: EquityCurve[]
    loading?: boolean
    error?: string
    selectedPeriod?: string
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: '',
    selectedPeriod: '1Y'
})

const emit = defineEmits<{
    retry: []
    periodChange: [period: string]
    comparisonChange: [comparison: string]
}>()

const selectedPeriod = ref(props.selectedPeriod)
const selectedComparison = ref('all')

const periods = [
    { label: '1月', value: '1M' },
    { label: '3月', value: '3M' },
    { label: '6月', value: '6M' },
    { label: '1年', value: '1Y' },
    { label: '全部', value: 'all' },
]

const comparisonOptions = [
    { label: '所有曲线', value: 'all' },
    { label: '仅策略', value: 'strategy' },
    { label: '策略vs基准', value: 'vsBenchmark' },
]

const curveColors = {
    '策略净值': 'var(--color-primary-500)',
    '基准净值': 'var(--color-gray-400)',
    '模型A': 'var(--color-emerald-500)',
    '模型B': 'var(--color-amber-500)',
    '模型C': 'var(--color-red-500)',
    '模型D': 'var(--color-purple-500)',
}

// 获取可见曲线
const visibleCurves = computed(() => {
    if (!props.curves) return []

    switch (selectedComparison.value) {
        case 'strategy':
            return props.curves.filter(curve => curve.name !== '基准净值')
        case 'vsBenchmark':
            return props.curves.filter(curve =>
                curve.name === '策略净值' || curve.name === '基准净值'
            )
        default:
            return props.curves
    }
})

// 转换数据格式
const chartData = computed<EquityData[]>(() => {
    if (!props.curves || props.curves.length === 0) return []

    // 获取所有日期点
    const allDates = new Set<string>()
    props.curves.forEach(curve => {
        curve.data.forEach(point => {
            allDates.add(point.date)
        })
    })

    // 创建合并的数据结构
    const dateMap = new Map<string, EquityData>()

    Array.from(allDates).sort().forEach(dateStr => {
        const date = new Date(dateStr)
        const dataPoint: EquityData = { date }

        props.curves.forEach(curve => {
            const point = curve.data.find(p => p.date === dateStr)
            dataPoint[curve.name] = point ? point.value : null
        })

        dateMap.set(dateStr, dataPoint)
    })

    return Array.from(dateMap.values())
})

// 获取曲线值
const getCurveValue = (d: EquityData, curveName: string) => {
    return d[curveName] || 0
}

const x = (d: EquityData) => d.date

const formatDate = (date: Date) =>
    date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })

const formatEquity = (value: number) => {
    if (value >= 1000) {
        return `¥${(value / 1000).toFixed(1)}k`
    }
    return `¥${value.toFixed(0)}`
}

const tooltipTemplate = (d: EquityData) => {
    const date = d.date.toLocaleDateString('zh-CN')
    const lines = visibleCurves.value.map(curve => {
        const value = d[curve.name]
        if (value === null || value === undefined) return null
        const formattedValue = formatEquity(value)
        return `<span style="color:${curve.color}">●</span> ${curve.name}: ${formattedValue}`
    }).filter(Boolean)

    return [`<strong>${date}</strong>`, ...lines].join('<br>')
}

// 图例项
const legendItems = computed(() =>
    visibleCurves.value.map(curve => ({
        name: curve.name,
        color: curve.color,
    }))
)

const handlePeriodChange = (period: string) => {
    selectedPeriod.value = period
    emit('periodChange', period)
}

// 监听比较模式变化
watch(selectedComparison, (newComparison) => {
    emit('comparisonChange', newComparison)
})
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

:deep(.vis-legend) {
    position: absolute;
    top: 10px;
    right: 10px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 12px;
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}
</style>