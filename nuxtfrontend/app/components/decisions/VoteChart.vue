<template>
    <div class="vote-chart">
        <!-- 图表头部 -->
        <div class="chart-header">
            <slot name="header">
                <h3 class="text-lg font-semibold text-gray-900">投票分布</h3>
            </slot>

            <!-- 图表类型切换 -->
            <div class="chart-controls">
                <slot name="controls">
                    <div class="flex items-center space-x-4">
                        <select v-model="chartType"
                            class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="pie">饼图</option>
                            <option value="bar">柱状图</option>
                            <option value="doughnut">环形图</option>
                        </select>
                    </div>
                </slot>
            </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
            <div class="flex items-center justify-center h-64">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-2 text-gray-600">加载中...</span>
            </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
            <div class="flex items-center justify-center h-64">
                <div class="text-center">
                    <svg class="mx-auto h-12 w-12 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">图表加载失败</h3>
                    <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
                    <button @click="$emit('retry')"
                        class="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        重试
                    </button>
                </div>
            </div>
        </div>

        <!-- 图表容器 -->
        <div v-else class="chart-container">
            <div class="chart-wrapper">
                <canvas ref="chartCanvas" class="chart-canvas"></canvas>
            </div>

            <!-- 图例 -->
            <div class="chart-legend">
                <div v-for="(item, index) in chartData" :key="item.label" class="legend-item"
                    @click="toggleDataset(index)">
                    <div class="legend-color" :style="{ backgroundColor: item.backgroundColor }"></div>
                    <span class="legend-label">{{ item.label }}</span>
                    <span class="legend-value">{{ item.value }} ({{ item.percentage }}%)</span>
                </div>
            </div>

            <!-- 统计信息 -->
            <div class="chart-stats">
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">总票数</span>
                        <span class="stat-value">{{ totalVotes }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最高票</span>
                        <span class="stat-value" :class="maxVoteClass">
                            {{ maxVoteLabel }}
                        </span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">一致性</span>
                        <span class="stat-value">{{ consensusLevel }}%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && !error && totalVotes === 0" class="empty-state">
            <div class="flex items-center justify-center h-64">
                <div class="text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">暂无投票数据</h3>
                    <p class="mt-1 text-sm text-gray-500">没有可显示的投票分布信息。</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Chart, ChartConfiguration } from 'chart.js/auto'

interface VoteSummary {
    BUY: number
    SELL: number
    HOLD: number
}

interface Props {
    voteSummary: VoteSummary
    loading?: boolean
    error?: string
    chartType?: 'pie' | 'bar' | 'doughnut'
    showStats?: boolean
}

interface Emits {
    (e: 'chart-click', label: string, value: number): void
    (e: 'retry'): void
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: '',
    chartType: 'pie',
    showStats: true
})

const emit = defineEmits<Emits>()

// Chart.js 实例
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

// 图表类型
const chartType = ref(props.chartType)

// 图表数据计算
const chartData = computed(() => {
    const { BUY, SELL, HOLD } = props.voteSummary
    const total = BUY + SELL + HOLD

    return [
        {
            label: '买入',
            value: BUY,
            percentage: total > 0 ? Math.round((BUY / total) * 100) : 0,
            backgroundColor: '#10B981',
            borderColor: '#059669'
        },
        {
            label: '卖出',
            value: SELL,
            percentage: total > 0 ? Math.round((SELL / total) * 100) : 0,
            backgroundColor: '#EF4444',
            borderColor: '#DC2626'
        },
        {
            label: '持有',
            value: HOLD,
            percentage: total > 0 ? Math.round((HOLD / total) * 100) : 0,
            backgroundColor: '#6B7280',
            borderColor: '#4B5563'
        }
    ]
})

// 统计信息
const totalVotes = computed(() => {
    return props.voteSummary.BUY + props.voteSummary.SELL + props.voteSummary.HOLD
})

const maxVoteLabel = computed(() => {
    const { BUY, SELL, HOLD } = props.voteSummary
    if (BUY >= SELL && BUY >= HOLD) return '买入'
    if (SELL >= BUY && SELL >= HOLD) return '卖出'
    return '持有'
})

const maxVoteClass = computed(() => {
    switch (maxVoteLabel.value) {
        case '买入': return 'text-green-600'
        case '卖出': return 'text-red-600'
        case '持有': return 'text-gray-600'
        default: return 'text-gray-600'
    }
})

const consensusLevel = computed(() => {
    if (totalVotes.value === 0) return 0
    const maxVotes = Math.max(
        props.voteSummary.BUY,
        props.voteSummary.SELL,
        props.voteSummary.HOLD
    )
    return Math.round((maxVotes / totalVotes.value) * 100)
})

// 初始化图表
const initChart = () => {
    if (!chartCanvas.value) return

    // 销毁现有图表
    if (chartInstance) {
        chartInstance.destroy()
    }

    const ctx = chartCanvas.value.getContext('2d')
    if (!ctx) return

    const config: ChartConfiguration = {
        type: chartType.value,
        data: {
            labels: chartData.value.map(item => item.label),
            datasets: [
                {
                    data: chartData.value.map(item => item.value),
                    backgroundColor: chartData.value.map(item => item.backgroundColor),
                    borderColor: chartData.value.map(item => item.borderColor),
                    borderWidth: 2,
                    hoverOffset: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || ''
                            const value = context.parsed
                            const percentage = chartData.value[context.dataIndex].percentage
                            return `${label}: ${value}票 (${percentage}%)`
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index
                    const label = chartData.value[index].label
                    const value = chartData.value[index].value
                    emit('chart-click', label, value)
                }
            }
        }
    }

    chartInstance = new Chart(ctx, config)
}

// 切换数据集显示
const toggleDataset = (index: number) => {
    if (chartInstance) {
        const meta = chartInstance.getDatasetMeta(0)
        if (meta.data[index]) {
            const hidden = meta.data[index].hidden
            chartInstance.setDatasetVisibility(0, !hidden, index)
            chartInstance.update()
        }
    }
}

// 监听数据变化
watch([() => props.voteSummary, chartType], () => {
    initChart()
}, { deep: true })

// 生命周期
onMounted(() => {
    initChart()
})

onUnmounted(() => {
    if (chartInstance) {
        chartInstance.destroy()
    }
})

// 监听props变化
watch(() => props.chartType, (newVal) => {
    chartType.value = newVal
})
</script>

<style scoped>
.vote-chart {
    @apply bg-white shadow rounded-lg p-6;
}

.chart-header {
    @apply flex justify-between items-center mb-6;
}

.chart-controls {
    @apply flex items-center space-x-4;
}

.loading-state {
    @apply flex items-center justify-center h-64;
}

.error-state {
    @apply flex items-center justify-center h-64;
}

.chart-container {
    @apply space-y-6;
}

.chart-wrapper {
    @apply h-64 relative;
}

.chart-canvas {
    @apply w-full h-full;
}

.chart-legend {
    @apply flex flex-wrap justify-center gap-4;
}

.legend-item {
    @apply flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors;
}

.legend-color {
    @apply w-4 h-4 rounded-full;
}

.legend-label {
    @apply text-sm font-medium text-gray-700;
}

.legend-value {
    @apply text-sm text-gray-500;
}

.chart-stats {
    @apply border-t border-gray-200 pt-4;
}

.stats-grid {
    @apply grid grid-cols-3 gap-4;
}

.stat-item {
    @apply text-center;
}

.stat-label {
    @apply block text-xs text-gray-500 mb-1;
}

.stat-value {
    @apply block text-lg font-semibold text-gray-900;
}

.empty-state {
    @apply flex items-center justify-center h-64;
}

/* 响应式设计 */
@media (max-width: 640px) {
    .chart-header {
        @apply flex-col items-start space-y-4;
    }

    .chart-controls {
        @apply w-full justify-start;
    }

    .chart-legend {
        @apply flex-col items-start;
    }

    .stats-grid {
        @apply grid-cols-1 gap-2;
    }
}
</style>