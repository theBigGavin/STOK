<template>
    <div>
        <!-- 错误提示 -->
        <UAlert v-if="decisionStore.error" :title="'操作失败'" :description="decisionStore.error" color="error"
            variant="solid" icon="i-lucide-alert-triangle" class="mb-4" closable @close="decisionStore.clearError()" />

        <UDashboardPage>
            <UDashboardPanel grow>
                <!-- 页面标题和操作栏 -->
                <UDashboardNavbar title="决策分析" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <!-- 批量操作按钮 -->
                        <UButton label="批量生成" color="primary" variant="solid" icon="i-lucide-play"
                            :loading="decisionStore.batchProcessing" @click="openBatchGenerateModal" />
                        <UButton label="刷新数据" color="neutral" variant="ghost" icon="i-lucide-refresh-cw"
                            :loading="decisionStore.loading" @click="refreshData" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <!-- 筛选工具栏 -->
                    <div class="mb-6">
                        <UDashboardSection title="筛选条件" description="按股票、日期和决策类型筛选">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <!-- 股票筛选 -->
                                <UFormGroup label="股票代码">
                                    <USelect v-model="filters.symbol" :options="stockOptions" placeholder="选择股票..."
                                        clearable @update:model-value="applyFilters" />
                                </UFormGroup>

                                <!-- 开始日期 -->
                                <UFormGroup label="开始日期">
                                    <UInput v-model="filters.startDate" type="date" placeholder="选择开始日期"
                                        @update:model-value="applyFilters" />
                                </UFormGroup>

                                <!-- 结束日期 -->
                                <UFormGroup label="结束日期">
                                    <UInput v-model="filters.endDate" type="date" placeholder="选择结束日期"
                                        @update:model-value="applyFilters" />
                                </UFormGroup>

                                <!-- 决策类型筛选 -->
                                <UFormGroup label="决策类型">
                                    <USelect v-model="filters.decisionType" :options="decisionTypeOptions"
                                        placeholder="选择决策类型..." clearable @update:model-value="applyFilters" />
                                </UFormGroup>
                            </div>

                            <!-- 筛选操作 -->
                            <div class="flex justify-end gap-2 mt-4">
                                <UButton label="重置筛选" color="neutral" variant="ghost" @click="resetFilters" />
                                <UButton label="导出数据" color="neutral" variant="outline" icon="i-lucide-download"
                                    @click="exportData" />
                            </div>
                        </UDashboardSection>
                    </div>

                    <!-- 主要内容区域 -->
                    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <!-- 决策列表表格 -->
                        <div class="xl:col-span-2">
                            <UDashboardSection title="决策历史" description="历史决策记录">
                                <UCard>
                                    <template #header>
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <UIcon name="i-lucide-history" class="size-5 text-primary" />
                                                <h3 class="text-lg font-semibold">决策记录</h3>
                                            </div>
                                            <div class="text-sm text-muted">
                                                共 {{ filteredDecisions.length }} 条记录
                                            </div>
                                        </div>
                                    </template>

                                    <!-- 加载状态 -->
                                    <div v-if="decisionStore.loading" class="flex justify-center py-8">
                                        <ULoadingIcon class="size-6 text-primary" />
                                        <span class="ml-2 text-muted">加载中...</span>
                                    </div>

                                    <!-- 空状态 -->
                                    <div v-else-if="filteredDecisions.length === 0" class="text-center py-12">
                                        <UIcon name="i-lucide-search" class="size-12 text-muted mb-4" />
                                        <p class="text-muted mb-4">暂无决策数据</p>
                                        <UButton label="生成决策" color="primary" @click="openGenerateModal" />
                                    </div>

                                    <!-- 决策表格 -->
                                    <div v-else class="overflow-x-auto">
                                        <UTable :rows="filteredDecisions" :columns="decisionColumns as any"
                                            :sort="{ column: 'timestamp', direction: 'desc' }"
                                            @select="(row: any) => selectDecision(row as DecisionResult)"
                                            class="min-w-full">
                                            <!-- 自定义决策类型列 -->
                                            <template #decision-data="{ row }">
                                                <div class="flex items-center gap-2">
                                                    <UBadge
                                                        :color="getDecisionColor((row as DecisionResult).finalDecision.decision)"
                                                        variant="subtle" class="capitalize">
                                                        {{ getDecisionText((row as
                                                            DecisionResult).finalDecision.decision) }}
                                                    </UBadge>
                                                </div>
                                            </template>

                                            <!-- 自定义置信度列 -->
                                            <template #confidence-data="{ row }">
                                                <div class="flex items-center gap-2">
                                                    <UProgress :value="(row as DecisionResult).finalDecision.confidence"
                                                        :max="100" size="sm"
                                                        :color="getConfidenceColor((row as DecisionResult).finalDecision.confidence)"
                                                        class="w-20" />
                                                    <span class="text-sm text-muted">
                                                        {{ (row as DecisionResult).finalDecision.confidence.toFixed(1)
                                                        }}%
                                                    </span>
                                                </div>
                                            </template>

                                            <!-- 自定义风险等级列 -->
                                            <template #risk-data="{ row }">
                                                <UBadge
                                                    :color="getRiskColor((row as DecisionResult).riskAssessment.riskLevel)"
                                                    variant="subtle">
                                                    {{ getRiskText((row as DecisionResult).riskAssessment.riskLevel) }}
                                                </UBadge>
                                            </template>

                                            <!-- 自定义操作列 -->
                                            <template #actions-data="{ row }">
                                                <div class="flex gap-2">
                                                    <UButton icon="i-lucide-eye" color="neutral" variant="ghost"
                                                        size="sm" @click="viewDecisionDetails(row as DecisionResult)" />
                                                    <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost"
                                                        size="sm" @click="recalculateDecision(row as DecisionResult)" />
                                                </div>
                                            </template>
                                        </UTable>
                                    </div>

                                    <!-- 分页 -->
                                    <template #footer>
                                        <div class="flex items-center justify-between">
                                            <div class="text-sm text-muted">
                                                显示 {{ Math.min(filteredDecisions.length, 10) }} 条记录
                                            </div>
                                            <UPagination v-model="currentPage" :page-count="pageSize"
                                                :total="filteredDecisions.length"
                                                :ui="{ root: 'flex items-center gap-1' }" />
                                        </div>
                                    </template>
                                </UCard>
                            </UDashboardSection>
                        </div>

                        <!-- 决策详情面板 -->
                        <div class="xl:col-span-1">
                            <UDashboardSection title="决策详情" description="投票分布和模型决策分析">
                                <UCard>
                                    <template #header>
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <UIcon name="i-lucide-bar-chart-3" class="size-5 text-primary" />
                                                <h3 class="text-lg font-semibold">投票详情</h3>
                                            </div>
                                            <UBadge v-if="selectedDecision"
                                                :color="getDecisionColor(selectedDecision.finalDecision.decision)"
                                                variant="subtle">
                                                {{ getDecisionText(selectedDecision.finalDecision.decision) }}
                                            </UBadge>
                                        </div>
                                    </template>

                                    <!-- 未选择决策状态 -->
                                    <div v-if="!selectedDecision" class="text-center py-12">
                                        <UIcon name="i-lucide-mouse-pointer" class="size-12 text-muted mb-4" />
                                        <p class="text-muted">请选择一条决策记录查看详情</p>
                                    </div>

                                    <!-- 决策详情内容 -->
                                    <div v-else class="space-y-6">
                                        <!-- 投票分布图 -->
                                        <div>
                                            <h4 class="text-sm font-medium text-highlighted mb-3">投票分布</h4>
                                            <div class="bg-elevated rounded-lg p-4">
                                                <!-- 这里应该使用Unovis图表库展示投票分布 -->
                                                <!-- 暂时使用模拟数据展示 -->
                                                <div class="space-y-3">
                                                    <div v-for="(count, decision) in selectedDecision.finalDecision.voteSummary"
                                                        :key="decision" class="flex items-center justify-between">
                                                        <div class="flex items-center gap-2">
                                                            <div class="w-3 h-3 rounded-full"
                                                                :class="getDecisionColorClass(decision)">
                                                            </div>
                                                            <span class="text-sm capitalize">{{
                                                                getDecisionText(decision) }}</span>
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            <span class="text-sm font-medium">{{ count }}</span>
                                                            <span class="text-xs text-muted">票</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 模型决策详情 -->
                                        <div>
                                            <h4 class="text-sm font-medium text-highlighted mb-3">模型决策详情</h4>
                                            <div class="space-y-3">
                                                <div v-for="model in selectedModelDecisions" :key="model.modelId"
                                                    class="flex items-center justify-between p-3 rounded-lg border border-default">
                                                    <div class="flex-1">
                                                        <div class="flex items-center justify-between mb-1">
                                                            <span class="text-sm font-medium">{{ model.modelName
                                                                }}</span>
                                                            <UBadge :color="getDecisionColor(model.decision)"
                                                                variant="subtle" size="xs">
                                                                {{ getDecisionText(model.decision) }}
                                                            </UBadge>
                                                        </div>
                                                        <div
                                                            class="flex items-center justify-between text-xs text-muted">
                                                            <span>置信度: {{ model.confidence.toFixed(1) }}%</span>
                                                            <span>信号强度: {{ model.signalStrength.toFixed(2) }}</span>
                                                        </div>
                                                        <div v-if="model.reasoning" class="mt-2 text-xs text-muted">
                                                            {{ model.reasoning }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 风险分析 -->
                                        <div>
                                            <h4 class="text-sm font-medium text-highlighted mb-3">风险分析</h4>
                                            <div class="space-y-2">
                                                <div class="flex justify-between">
                                                    <span class="text-sm">风险等级</span>
                                                    <UBadge
                                                        :color="getRiskColor(selectedDecision.riskAssessment.riskLevel)"
                                                        variant="subtle" size="sm">
                                                        {{ getRiskText(selectedDecision.riskAssessment.riskLevel) }}
                                                    </UBadge>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-sm">是否批准</span>
                                                    <UBadge
                                                        :color="selectedDecision.riskAssessment.isApproved ? 'success' : 'error'"
                                                        variant="subtle" size="sm">
                                                        {{ selectedDecision.riskAssessment.isApproved ? '已批准' : '未批准' }}
                                                    </UBadge>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-sm">建议仓位</span>
                                                    <span class="text-sm font-medium">
                                                        {{ selectedDecision.riskAssessment.positionSuggestion }}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </UCard>
                            </UDashboardSection>
                        </div>
                    </div>
                </UDashboardPanelContent>
            </UDashboardPanel>
        </UDashboardPage>

        <!-- 批量生成决策模态框 -->
        <UModal v-model="showBatchModal">
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">批量生成决策</h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="showBatchModal = false" />
                    </div>
                </template>

                <div class="space-y-4">
                    <UFormGroup label="交易日期">
                        <UInput v-model="batchForm.tradeDate" type="date" placeholder="选择交易日期" />
                    </UFormGroup>

                    <UFormGroup label="股票列表">
                        <UTextarea v-model="batchForm.symbols" placeholder="输入股票代码，每行一个..." :rows="6" />
                    </UFormGroup>

                    <!-- 批量处理进度 -->
                    <div v-if="decisionStore.batchProcessing" class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>处理进度</span>
                            <span>{{ decisionStore.batchProgress }}%</span>
                        </div>
                        <UProgress :value="decisionStore.batchProgress" :max="100" size="sm" />
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <UButton label="取消" color="neutral" variant="ghost" @click="showBatchModal = false" />
                        <UButton label="开始生成" color="primary" :loading="decisionStore.batchProcessing"
                            @click="generateBatchDecisions" />
                    </div>
                </template>
            </UCard>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDecisionStore } from '~/stores/decisions'
import type { DecisionResult } from '~/types/decisions'

// 使用UnoCSS UI的toast功能
const toast = useToast()

// Store实例
const decisionStore = useDecisionStore()

// 响应式数据
const currentPage = ref(1)
const pageSize = ref(10)
const showBatchModal = ref(false)
const selectedDecision = ref<DecisionResult | null>(null)

// 筛选条件
const filters = ref({
    symbol: null as string | null,
    startDate: null as string | null,
    endDate: null as string | null,
    decisionType: null as 'BUY' | 'SELL' | 'HOLD' | null
})

// 批量生成表单
const batchForm = ref({
    tradeDate: new Date().toISOString().split('T')[0],
    symbols: ''
})

// 计算属性
const filteredDecisions = computed(() => {
    // 如果Store中没有数据，使用模拟数据进行展示
    if (decisionStore.filteredDecisions.length === 0) {
        return mockDecisions
    }
    return decisionStore.filteredDecisions
})
const selectedModelDecisions = computed(() => {
    // 如果Store中没有模型决策数据，使用模拟数据
    if (decisionStore.selectedModelDecisions.length === 0 && selectedDecision.value) {
        return mockModelDecisions
    }
    return decisionStore.selectedModelDecisions
})

// 股票选项（模拟数据）
const stockOptions = computed(() => [
    { label: 'AAPL', value: 'AAPL' },
    { label: 'TSLA', value: 'TSLA' },
    { label: 'MSFT', value: 'MSFT' },
    { label: 'GOOGL', value: 'GOOGL' },
    { label: 'AMZN', value: 'AMZN' }
])

// 决策类型选项
const decisionTypeOptions = [
    { label: '买入', value: 'BUY' },
    { label: '卖出', value: 'SELL' },
    { label: '持有', value: 'HOLD' }
]

// 模拟决策数据
const mockDecisions = [
    {
        symbol: 'AAPL',
        tradeDate: '2024-01-15',
        finalDecision: {
            decision: 'BUY' as const,
            confidence: 85.5,
            voteSummary: {
                BUY: 3,
                SELL: 1,
                HOLD: 1
            },
            modelDetails: [],
            riskLevel: 'LOW' as const,
            reasoning: '技术指标显示强劲买入信号'
        },
        riskAssessment: {
            isApproved: true,
            riskLevel: 'LOW',
            warnings: [],
            adjustedDecision: 'BUY',
            positionSuggestion: 15
        },
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
        symbol: 'TSLA',
        tradeDate: '2024-01-15',
        finalDecision: {
            decision: 'SELL' as const,
            confidence: 72.3,
            voteSummary: {
                BUY: 1,
                SELL: 3,
                HOLD: 1
            },
            modelDetails: [],
            riskLevel: 'HIGH' as const,
            reasoning: '高波动性，建议减仓'
        },
        riskAssessment: {
            isApproved: false,
            riskLevel: 'HIGH',
            warnings: ['高波动性风险'],
            adjustedDecision: 'HOLD',
            positionSuggestion: 5
        },
        timestamp: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
        symbol: 'MSFT',
        tradeDate: '2024-01-15',
        finalDecision: {
            decision: 'HOLD' as const,
            confidence: 68.9,
            voteSummary: {
                BUY: 2,
                SELL: 1,
                HOLD: 2
            },
            modelDetails: [],
            riskLevel: 'MEDIUM' as const,
            reasoning: '市场观望情绪浓厚'
        },
        riskAssessment: {
            isApproved: true,
            riskLevel: 'MEDIUM',
            warnings: [],
            adjustedDecision: 'HOLD',
            positionSuggestion: 10
        },
        timestamp: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
        symbol: 'GOOGL',
        tradeDate: '2024-01-15',
        finalDecision: {
            decision: 'BUY' as const,
            confidence: 91.2,
            voteSummary: {
                BUY: 4,
                SELL: 0,
                HOLD: 1
            },
            modelDetails: [],
            riskLevel: 'LOW' as const,
            reasoning: '基本面强劲，增长潜力大'
        },
        riskAssessment: {
            isApproved: true,
            riskLevel: 'LOW',
            warnings: [],
            adjustedDecision: 'BUY',
            positionSuggestion: 20
        },
        timestamp: new Date(Date.now() - 45 * 60000).toISOString()
    }
]

// 模拟模型决策数据
const mockModelDecisions = [
    {
        modelId: 1,
        modelName: '技术分析模型',
        decision: 'BUY' as const,
        confidence: 88.5,
        signalStrength: 0.85,
        reasoning: 'RSI指标显示超卖，MACD金叉'
    },
    {
        modelId: 2,
        modelName: '基本面模型',
        decision: 'BUY' as const,
        confidence: 92.3,
        signalStrength: 0.92,
        reasoning: '市盈率合理，营收增长强劲'
    },
    {
        modelId: 3,
        modelName: '量化模型',
        decision: 'SELL' as const,
        confidence: 65.7,
        signalStrength: 0.65,
        reasoning: '动量指标转弱，短期回调风险'
    },
    {
        modelId: 4,
        modelName: '机器学习模型',
        decision: 'BUY' as const,
        confidence: 85.1,
        signalStrength: 0.81,
        reasoning: '历史模式匹配度高，上涨概率大'
    },
    {
        modelId: 5,
        modelName: '情绪分析模型',
        decision: 'HOLD' as const,
        confidence: 72.8,
        signalStrength: 0.73,
        reasoning: '市场情绪中性，建议观望'
    }
]

// 表格列定义
const decisionColumns = [
    {
        key: 'symbol',
        label: '股票代码',
        sortable: true
    },
    {
        key: 'tradeDate',
        label: '交易日期',
        sortable: true
    },
    {
        key: 'decision',
        label: '决策类型',
        sortable: true
    },
    {
        key: 'confidence',
        label: '置信度',
        sortable: true
    },
    {
        key: 'risk',
        label: '风险等级',
        sortable: true
    },
    {
        key: 'timestamp',
        label: '生成时间',
        sortable: true
    },
    {
        key: 'actions',
        label: '操作'
    }
]

// 方法
const applyFilters = () => {
    decisionStore.setFilters(filters.value)
}

const resetFilters = () => {
    filters.value = {
        symbol: null,
        startDate: null,
        endDate: null,
        decisionType: null
    }
    decisionStore.resetFilters()
}

const refreshData = async () => {
    try {
        await decisionStore.fetchDecisionStatsCached()
        // 这里可以添加其他数据刷新逻辑
    } catch (error) {
        console.error('刷新数据失败:', error)
    }
}

const selectDecision = (decision: DecisionResult) => {
    selectedDecision.value = decision
    decisionStore.selectDecision(decision)

    // 加载模型决策详情
    if (decision) {
        decisionStore.fetchModelDecisions(decision.symbol, decision.tradeDate)
    }
}

const viewDecisionDetails = (decision: DecisionResult) => {
    selectDecision(decision)
}

const recalculateDecision = async (decision: DecisionResult) => {
    try {
        await decisionStore.recalculateDecision(decision.symbol, decision.tradeDate)
        // 重新加载决策详情
        selectDecision(decision)
    } catch (error) {
        console.error('重新计算决策失败:', error)
    }
}

const openBatchGenerateModal = () => {
    showBatchModal.value = true
}

const generateBatchDecisions = async () => {
    if (!batchForm.value.tradeDate) {
        toast.add({
            title: '操作失败',
            description: '请选择交易日期',
            color: 'error',
            icon: 'i-lucide-alert-triangle'
        })
        return
    }

    const symbols = batchForm.value.symbols
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)

    if (symbols.length === 0) {
        toast.add({
            title: '操作失败',
            description: '请输入至少一个股票代码',
            color: 'error',
            icon: 'i-lucide-alert-triangle'
        })
        return
    }

    try {
        await decisionStore.generateBatchDecisions(symbols, batchForm.value.tradeDate)
        showBatchModal.value = false
        batchForm.value.symbols = ''

        // 显示成功提示
        toast.add({
            title: '操作成功',
            description: `已成功为 ${symbols.length} 只股票生成决策`,
            color: 'success',
            icon: 'i-lucide-check-circle'
        })

        // 刷新数据
        await refreshData()
    } catch (error) {
        console.error('批量生成决策失败:', error)
        toast.add({
            title: '操作失败',
            description: '批量生成决策失败，请稍后重试',
            color: 'error',
            icon: 'i-lucide-alert-triangle'
        })
    }
}

const openGenerateModal = () => {
    // 这里可以打开单个决策生成模态框
    console.log('打开单个决策生成模态框')
}

const exportData = () => {
    // 导出数据逻辑
    console.log('导出数据')
}

// 工具函数
const getDecisionColor = (decision: string) => {
    switch (decision) {
        case 'BUY': return 'success'
        case 'SELL': return 'error'
        case 'HOLD': return 'warning'
        default: return 'neutral'
    }
}

const getDecisionText = (decision: string) => {
    switch (decision) {
        case 'BUY': return '买入'
        case 'SELL': return '卖出'
        case 'HOLD': return '持有'
        default: return '未知'
    }
}

const getDecisionColorClass = (decision: string) => {
    switch (decision) {
        case 'BUY': return 'bg-success'
        case 'SELL': return 'bg-error'
        case 'HOLD': return 'bg-warning'
        default: return 'bg-neutral'
    }
}

const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success'
    if (confidence >= 60) return 'warning'
    return 'error'
}

const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
        case 'LOW': return 'success'
        case 'MEDIUM': return 'warning'
        case 'HIGH': return 'error'
        default: return 'neutral'
    }
}

const getRiskText = (riskLevel: string) => {
    switch (riskLevel) {
        case 'LOW': return '低风险'
        case 'MEDIUM': return '中风险'
        case 'HIGH': return '高风险'
        default: return '未知'
    }
}

// 生命周期
onMounted(() => {
    // 初始化加载数据
    refreshData()
})

// 页面元信息
definePageMeta({
    title: '决策分析',
    description: '决策分析和投票详情页面'
})
</script>