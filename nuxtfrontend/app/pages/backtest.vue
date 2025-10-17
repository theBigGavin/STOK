<template>
    <div>
        <UDashboardPage>
            <UDashboardPanel grow>
                <UDashboardNavbar title="回测分析" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <UButton label="开始回测" color="primary" variant="solid" icon="i-lucide-play"
                            :loading="backtestStore.loading" :disabled="!isFormValid" @click="runBacktest" />
                        <UButton label="重置" color="neutral" variant="ghost" icon="i-lucide-refresh-cw"
                            @click="resetForm" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <!-- 错误提示 -->
                    <UAlert v-if="backtestStore.error" :title="backtestStore.error" color="red" variant="solid"
                        icon="i-lucide-alert-triangle" class="mb-6" @close="backtestStore.clearError()" />

                    <!-- 回测进度 -->
                    <UCard v-if="backtestStore.isBacktestRunning" class="mb-6">
                        <template #header>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-clock" class="size-5 text-primary" />
                                <h3 class="text-lg font-semibold text-highlighted">回测进度</h3>
                            </div>
                        </template>
                        <div class="space-y-4">
                            <div class="flex justify-between text-sm">
                                <span class="text-muted">{{ backtestStore.backtestProgress.currentStep || '正在执行回测...'
                                }}</span>
                                <span class="text-highlighted">{{ backtestStore.backtestProgress.progress }}%</span>
                            </div>
                            <UProgress :value="backtestStore.backtestProgress.progress" :max="100" size="lg"
                                color="primary" />
                            <div v-if="backtestStore.backtestProgress.message" class="text-sm text-muted">
                                {{ backtestStore.backtestProgress.message }}
                            </div>
                        </div>
                    </UCard>

                    <div class="space-y-6">
                        <!-- 回测配置区域 -->
                        <UDashboardSection title="回测配置" description="设置回测参数和模型选择">
                            <UCard>
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-settings" class="size-5 text-primary" />
                                        <h3 class="text-lg font-semibold text-highlighted">回测参数配置</h3>
                                    </div>
                                </template>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- 基本参数 -->
                                    <div class="space-y-4">
                                        <h4 class="text-sm font-medium text-highlighted">基本参数</h4>

                                        <UFormGroup label="股票代码" name="symbol" required>
                                            <UInput v-model="backtestConfig.symbol" placeholder="例如: AAPL, 000001.SZ"
                                                icon="i-lucide-search" :disabled="backtestStore.loading" />
                                        </UFormGroup>

                                        <div class="grid grid-cols-2 gap-4">
                                            <UFormGroup label="开始日期" name="startDate" required>
                                                <UInput v-model="backtestConfig.startDate" type="date"
                                                    :disabled="backtestStore.loading" />
                                            </UFormGroup>
                                            <UFormGroup label="结束日期" name="endDate" required>
                                                <UInput v-model="backtestConfig.endDate" type="date"
                                                    :disabled="backtestStore.loading" />
                                            </UFormGroup>
                                        </div>

                                        <UFormGroup label="初始资金" name="initialCapital" required>
                                            <UInput v-model.number="backtestConfig.initialCapital" type="number"
                                                placeholder="100000" :disabled="backtestStore.loading">
                                                <template #trailing>
                                                    <span class="text-gray-500 dark:text-gray-400 text-xs">元</span>
                                                </template>
                                            </UInput>
                                        </UFormGroup>
                                    </div>

                                    <!-- 模型选择 -->
                                    <div class="space-y-4">
                                        <h4 class="text-sm font-medium text-highlighted">模型选择</h4>

                                        <UFormGroup label="选择模型" name="modelIds">
                                            <USelectMenu v-model="backtestConfig.modelIds" :options="modelOptions"
                                                multiple placeholder="选择要使用的模型"
                                                :disabled="backtestStore.loading || modelStore.loading">
                                                <template #label>
                                                    <span v-if="backtestConfig.modelIds.length > 0">
                                                        已选择 {{ backtestConfig.modelIds.length }} 个模型
                                                    </span>
                                                </template>
                                            </USelectMenu>
                                        </UFormGroup>

                                        <UFormGroup label="策略类型" name="strategy">
                                            <USelect v-model="backtestConfig.strategy" :options="strategyOptions"
                                                placeholder="选择交易策略" :disabled="backtestStore.loading" />
                                        </UFormGroup>

                                        <!-- 选中的模型列表 -->
                                        <div v-if="backtestConfig.modelIds.length > 0" class="space-y-2">
                                            <h5 class="text-xs font-medium text-muted">已选模型</h5>
                                            <div class="flex flex-wrap gap-2">
                                                <UBadge v-for="modelId in backtestConfig.modelIds" :key="modelId"
                                                    color="primary" variant="subtle" class="text-xs">
                                                    {{ getModelName(modelId) }}
                                                </UBadge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 高级参数 -->
                                <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <UButton variant="ghost" size="sm" @click="showAdvanced = !showAdvanced">
                                        <UIcon :name="showAdvanced ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                                            class="size-4" />
                                        <span>高级参数</span>
                                    </UButton>

                                    <div v-if="showAdvanced" class="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <UFormGroup label="交易手续费" name="commission">
                                            <UInput v-model.number="backtestConfig.parameters.commission" type="number"
                                                step="0.0001" placeholder="0.0003" :disabled="backtestStore.loading">
                                                <template #trailing>
                                                    <span class="text-gray-500 dark:text-gray-400 text-xs">%</span>
                                                </template>
                                            </UInput>
                                        </UFormGroup>

                                        <UFormGroup label="滑点" name="slippage">
                                            <UInput v-model.number="backtestConfig.parameters.slippage" type="number"
                                                step="0.0001" placeholder="0.0001" :disabled="backtestStore.loading">
                                                <template #trailing>
                                                    <span class="text-gray-500 dark:text-gray-400 text-xs">%</span>
                                                </template>
                                            </UInput>
                                        </UFormGroup>

                                        <UFormGroup label="持仓限制" name="positionLimit">
                                            <UInput v-model.number="backtestConfig.parameters.positionLimit"
                                                type="number" placeholder="10" :disabled="backtestStore.loading">
                                                <template #trailing>
                                                    <span class="text-gray-500 dark:text-gray-400 text-xs">只</span>
                                                </template>
                                            </UInput>
                                        </UFormGroup>
                                    </div>
                                </div>
                            </UCard>
                        </UDashboardSection>

                        <!-- 结果展示区域 -->
                        <UDashboardSection v-if="backtestStore.currentBacktest" title="结果展示" description="回测性能指标和交易记录">
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- 性能指标 -->
                                <UCard class="lg:col-span-1">
                                    <template #header>
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-lucide-bar-chart-3" class="size-5 text-primary" />
                                            <h3 class="text-lg font-semibold text-highlighted">性能指标</h3>
                                        </div>
                                    </template>

                                    <div class="space-y-4">
                                        <div v-for="metric in performanceMetrics" :key="metric.name"
                                            class="flex justify-between items-center p-3 rounded-lg border border-default bg-elevated/50">
                                            <div class="flex items-center gap-2">
                                                <UIcon :name="metric.icon" class="size-4" :class="metric.color" />
                                                <span class="text-sm text-muted">{{ metric.label }}</span>
                                            </div>
                                            <span class="text-lg font-semibold text-highlighted" :class="metric.color">
                                                {{ metric.value }}
                                            </span>
                                        </div>
                                    </div>
                                </UCard>

                                <!-- 回测结果图表 -->
                                <UCard class="lg:col-span-2">
                                    <template #header>
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-lucide-trending-up" class="size-5 text-primary" />
                                            <h3 class="text-lg font-semibold text-highlighted">净值曲线</h3>
                                        </div>
                                    </template>

                                    <div class="h-64 flex items-center justify-center text-muted">
                                        <div class="text-center">
                                            <UIcon name="i-lucide-bar-chart-3" class="size-16 mb-2" />
                                            <p>净值曲线图表开发中...</p>
                                            <p class="text-xs">将使用Unovis图表库展示回测结果</p>
                                        </div>
                                    </div>
                                </UCard>
                            </div>

                            <!-- 交易记录 -->
                            <UCard class="mt-6">
                                <template #header>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-lucide-list" class="size-5 text-primary" />
                                            <h3 class="text-lg font-semibold text-highlighted">交易记录</h3>
                                        </div>
                                        <UButton label="导出记录" color="neutral" variant="ghost" size="sm"
                                            icon="i-lucide-download" @click="exportTrades" />
                                    </div>
                                </template>

                                <UTable :rows="tradeRecords" :columns="tradeColumns" :loading="backtestStore.loading">
                                    <template #type-data="{ row }">
                                        <UBadge :color="row.type === 'BUY' ? 'green' : 'red'" variant="subtle">
                                            {{ row.type === 'BUY' ? '买入' : '卖出' }}
                                        </UBadge>
                                    </template>

                                    <template #profit-data="{ row }">
                                        <span :class="row.profit && row.profit > 0 ? 'text-green-600' : 'text-red-600'">
                                            {{ row.profit ? `${(row.profit).toFixed(2)}` : '-' }}
                                        </span>
                                    </template>
                                </UTable>
                            </UCard>
                        </UDashboardSection>

                        <!-- 对比分析区域 -->
                        <UDashboardSection v-if="backtestStore.backtestResults.length > 1" title="对比分析"
                            description="多模型回测结果对比">
                            <UCard>
                                <template #header>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-lucide-compare" class="size-5 text-primary" />
                                            <h3 class="text-lg font-semibold text-highlighted">模型对比分析</h3>
                                        </div>
                                        <UButton label="添加对比" color="primary" variant="ghost" size="sm"
                                            icon="i-lucide-plus" @click="showComparisonModal = true" />
                                    </div>
                                </template>

                                <div class="h-64 flex items-center justify-center text-muted">
                                    <div class="text-center">
                                        <UIcon name="i-lucide-bar-chart-horizontal" class="size-16 mb-2" />
                                        <p>对比分析图表开发中...</p>
                                        <p class="text-xs">将展示多模型回测结果的性能对比</p>
                                    </div>
                                </div>
                            </UCard>
                        </UDashboardSection>

                        <!-- 组合回测区域 -->
                        <UDashboardSection title="组合回测" description="投资组合分析功能">
                            <UCard>
                                <template #header>
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-pie-chart" class="size-5 text-primary" />
                                        <h3 class="text-lg font-semibold text-highlighted">投资组合分析</h3>
                                    </div>
                                </template>

                                <div class="h-48 flex items-center justify-center text-muted">
                                    <div class="text-center">
                                        <UIcon name="i-lucide-pie-chart" class="size-16 mb-2" />
                                        <p>组合回测功能开发中...</p>
                                        <p class="text-xs">将支持多股票投资组合的回测分析</p>
                                    </div>
                                </div>
                            </UCard>
                        </UDashboardSection>
                    </div>
                </UDashboardPanelContent>
            </UDashboardPanel>
        </UDashboardPage>

        <!-- 对比选择模态框 -->
        <UModal v-model="showComparisonModal">
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-highlighted">选择对比回测</h3>
                        <UButton color="neutral" variant="ghost" icon="i-lucide-x"
                            @click="showComparisonModal = false" />
                    </div>
                </template>

                <div class="space-y-4">
                    <p class="text-sm text-muted">选择要对比的回测结果</p>

                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        <div v-for="result in backtestStore.backtestResults" :key="generateBacktestId(result)"
                            class="flex items-center justify-between p-3 border border-default rounded-lg">
                            <div>
                                <p class="text-sm font-medium text-highlighted">
                                    {{ result.trades[0]?.symbol || '未知股票' }} -
                                    {{ formatDate(result.trades[0]?.date) }} 至 {{
                                        formatDate(result.trades[result.trades.length - 1]?.date) }}
                                </p>
                                <p class="text-xs text-muted">
                                    总回报: {{ (result.totalReturn * 100).toFixed(2) }}%
                                </p>
                            </div>
                            <UCheckbox :model-value="comparisonSelection.includes(generateBacktestId(result))"
                                @update:model-value="toggleComparisonSelection(generateBacktestId(result))" />
                        </div>
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton label="取消" color="neutral" variant="ghost" @click="showComparisonModal = false" />
                        <UButton label="确认对比" color="primary" :disabled="comparisonSelection.length < 2"
                            @click="confirmComparison" />
                    </div>
                </template>
            </UCard>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useBacktestStore } from '~/stores/backtest'
import { useModelStore } from '~/stores/models'
import type { BacktestRequest } from '~/types/backtest'

// Store
const backtestStore = useBacktestStore()
const modelStore = useModelStore()

// 状态
const showAdvanced = ref(false)
const showComparisonModal = ref(false)
const comparisonSelection = ref<string[]>([])

// 回测配置
const backtestConfig = ref<BacktestRequest>({
    symbol: '',
    startDate: '',
    endDate: '',
    initialCapital: 100000,
    modelIds: [],
    strategy: 'momentum',
    parameters: {
        commission: 0.0003,
        slippage: 0.0001,
        positionLimit: 10
    }
})

// 策略选项
const strategyOptions = [
    { value: 'momentum', label: '动量策略' },
    { value: 'mean_reversion', label: '均值回归' },
    { value: 'breakout', label: '突破策略' },
    { value: 'technical', label: '技术分析' }
]

// 表单验证
const isFormValid = computed(() => {
    return backtestConfig.value.symbol &&
        backtestConfig.value.startDate &&
        backtestConfig.value.endDate &&
        backtestConfig.value.modelIds && backtestConfig.value.modelIds.length > 0
})

// 模型选项
const modelOptions = computed(() => {
    return modelStore.models.map(model => ({
        value: model.modelId,
        label: model.name
    }))
})

// 性能指标计算
const performanceMetrics = computed(() => {
    if (!backtestStore.currentBacktest) return []

    const result = backtestStore.currentBacktest
    return [
        {
            name: 'totalReturn',
            label: '总回报率',
            value: `${(result.totalReturn * 100).toFixed(2)}%`,
            icon: 'i-lucide-trending-up',
            color: result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
        },
        {
            name: 'annualReturn',
            label: '年化回报',
            value: `${(result.annualReturn * 100).toFixed(2)}%`,
            icon: 'i-lucide-calendar',
            color: result.annualReturn >= 0 ? 'text-green-600' : 'text-red-600'
        },
        {
            name: 'sharpeRatio',
            label: '夏普比率',
            value: result.sharpeRatio.toFixed(2),
            icon: 'i-lucide-chart-line',
            color: result.sharpeRatio >= 1 ? 'text-green-600' : 'text-yellow-600'
        },
        {
            name: 'maxDrawdown',
            label: '最大回撤',
            value: `${(result.maxDrawdown * 100).toFixed(2)}%`,
            icon: 'i-lucide-arrow-down',
            color: 'text-red-600'
        },
        {
            name: 'winRate',
            label: '胜率',
            value: `${(result.winRate * 100).toFixed(2)}%`,
            icon: 'i-lucide-target',
            color: result.winRate >= 0.6 ? 'text-green-600' : 'text-yellow-600'
        },
        {
            name: 'profitFactor',
            label: '盈利因子',
            value: result.profitFactor.toFixed(2),
            icon: 'i-lucide-dollar-sign',
            color: result.profitFactor >= 1.5 ? 'text-green-600' : 'text-yellow-600'
        }
    ]
})

// 交易记录
const tradeRecords = computed(() => {
    return backtestStore.currentBacktest?.trades || []
})

// 交易记录表格列定义
const tradeColumns = [
    {
        key: 'date',
        label: '日期'
    },
    {
        key: 'type',
        label: '类型'
    },
    {
        key: 'symbol',
        label: '股票'
    },
    {
        key: 'price',
        label: '价格'
    },
    {
        key: 'shares',
        label: '数量'
    },
    {
        key: 'value',
        label: '金额'
    },
    {
        key: 'profit',
        label: '盈亏'
    },
    {
        key: 'reason',
        label: '原因'
    }
]

// 方法
const getModelName = (modelId: number) => {
    const model = modelStore.models.find(m => m.modelId === modelId)
    return model?.name || `模型 ${modelId}`
}

const runBacktest = async () => {
    try {
        await backtestStore.runBacktest(backtestConfig.value)
    } catch (error) {
        // 错误已在store中处理
        console.error('回测执行失败:', error)
    }
}

const resetForm = () => {
    backtestConfig.value = {
        symbol: '',
        startDate: '',
        endDate: '',
        initialCapital: 100000,
        modelIds: [],
        strategy: 'momentum',
        parameters: {
            commission: 0.0003,
            slippage: 0.0001,
            positionLimit: 10
        }
    }
    backtestStore.setCurrentBacktest(null)
}

const exportTrades = async () => {
    if (!backtestStore.currentBacktest) return

    try {
        const blob = await backtestStore.exportBacktestResult(
            generateBacktestId(backtestStore.currentBacktest),
            'csv'
        )
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `trades_${backtestConfig.value.symbol}_${backtestConfig.value.startDate}_${backtestConfig.value.endDate}.csv`
        link.click()
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error('导出失败:', error)
    }
}

const toggleComparisonSelection = (backtestId: string) => {
    const index = comparisonSelection.value.indexOf(backtestId)
    if (index > -1) {
        comparisonSelection.value.splice(index, 1)
    } else {
        comparisonSelection.value.push(backtestId)
    }
}

const confirmComparison = async () => {
    try {
        await backtestStore.compareBacktests(comparisonSelection.value)
        showComparisonModal.value = false
    } catch (error) {
        console.error('对比分析失败:', error)
    }
}

const generateBacktestId = (result: any) => {
    return `${result.trades[0]?.symbol}_${result.trades[0]?.date}_${result.trades[result.trades.length - 1]?.date}`
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(async () => {
    try {
        await modelStore.fetchModels()
        await backtestStore.fetchBacktestHistory()
    } catch (error) {
        console.error('初始化数据失败:', error)
    }
})

definePageMeta({
    title: '回测分析',
    description: '回测分析和性能对比页面'
})
</script>
