<template>
    <div>
        <!-- 错误提示 -->
        <UAlert v-if="modelStore.error" :title="'操作失败'" :description="modelStore.error" color="error" variant="solid"
            icon="i-lucide-alert-triangle" class="mb-4" closable @close="modelStore.clearError()" />

        <UDashboardPage>
            <UDashboardPanel grow>
                <!-- 页面标题和操作栏 -->
                <UDashboardNavbar title="模型管理" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <!-- 操作按钮 -->
                        <UButton label="训练新模型" color="primary" variant="solid" icon="i-lucide-plus"
                            @click="showTrainModelModal = true" />
                        <UButton label="刷新数据" color="neutral" variant="ghost" icon="i-lucide-refresh-cw"
                            :loading="modelStore.loading" @click="refreshData" />
                        <UButton label="批量评估" color="neutral" variant="outline" icon="i-lucide-play"
                            @click="batchEvaluateModels" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <!-- 筛选工具栏 -->
                    <UDashboardSection title="筛选条件" description="按模型类型、状态和关键词筛选">
                        <div class="bg-white rounded-lg border border-gray-200 p-4">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <!-- 模型类型筛选 -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">模型类型</label>
                                    <USelect v-model="filters.modelType" :options="modelTypeOptions" placeholder="全部类型"
                                        clearable />
                                </div>

                                <!-- 状态筛选 -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
                                    <USelect v-model="filters.status" :options="statusOptions" placeholder="全部状态"
                                        clearable />
                                </div>

                                <!-- 关键词搜索 -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">搜索</label>
                                    <UInput v-model="filters.searchQuery" placeholder="输入模型名称或描述..."
                                        icon="i-lucide-search" :loading="modelStore.loading" />
                                </div>
                            </div>

                            <!-- 筛选操作 -->
                            <div class="flex justify-between items-center mt-4">
                                <div class="text-sm text-gray-500">
                                    共 {{ filteredModels.length }} 个模型
                                </div>
                                <div class="flex gap-2">
                                    <UButton label="重置筛选" color="neutral" variant="ghost" size="sm"
                                        @click="resetFilters" />
                                    <UButton label="应用筛选" color="primary" variant="solid" size="sm"
                                        @click="applyFilters" />
                                </div>
                            </div>
                        </div>
                    </UDashboardSection>

                    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <!-- 模型列表区域 -->
                        <div class="xl:col-span-2">
                            <UDashboardSection title="模型列表" description="活跃模型列表，支持排序和筛选">
                                <div class="bg-white rounded-lg border border-gray-200">
                                    <!-- 加载状态 -->
                                    <div v-if="modelStore.loading" class="flex justify-center py-8">
                                        <ULoadingIcon class="size-6 text-primary" />
                                        <span class="ml-2 text-gray-500">加载中...</span>
                                    </div>

                                    <!-- 错误状态 -->
                                    <div v-else-if="modelStore.error" class="text-center py-8 text-red-500">
                                        <UIcon name="i-lucide-alert-circle" class="size-8 mb-2" />
                                        <p>{{ modelStore.error }}</p>
                                        <UButton label="重试" color="primary" variant="solid" class="mt-4"
                                            @click="fetchModels" />
                                    </div>

                                    <!-- 空状态 -->
                                    <div v-else-if="filteredModels.length === 0" class="text-center py-8">
                                        <UIcon name="i-lucide-search" class="size-12 text-gray-400 mb-4" />
                                        <p class="text-gray-500">未找到匹配的模型</p>
                                        <UButton label="重置筛选" color="primary" variant="solid" class="mt-4"
                                            @click="resetFilters" />
                                    </div>

                                    <!-- 模型表格 -->
                                    <div v-else class="overflow-x-auto">
                                        <table class="min-w-full divide-y divide-gray-200">
                                            <thead class="bg-gray-50">
                                                <tr>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        模型名称
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        类型
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        权重
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        状态
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        准确率
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        操作
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-gray-200">
                                                <tr v-for="model in filteredModels" :key="model.modelId"
                                                    class="hover:bg-gray-50 cursor-pointer" @click="selectModel(model)">
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center gap-2">
                                                            <span class="font-semibold text-highlighted">
                                                                {{ model.name }}
                                                            </span>
                                                            <UBadge v-if="model.isActive" color="success"
                                                                variant="subtle" size="xs">
                                                                活跃
                                                            </UBadge>
                                                            <UBadge v-else color="neutral" variant="subtle" size="xs">
                                                                停用
                                                            </UBadge>
                                                        </div>
                                                        <div v-if="model.description"
                                                            class="text-xs text-gray-500 mt-1">
                                                            {{ model.description }}
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <UBadge :color="getModelTypeColor(model.modelType)"
                                                            variant="subtle">
                                                            {{ getModelTypeText(model.modelType) }}
                                                        </UBadge>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center gap-2">
                                                            <UProgress :value="model.weight * 100" :max="100" size="sm"
                                                                :color="getWeightColor(model.weight)" class="w-20" />
                                                            <span class="text-sm text-gray-500">
                                                                {{ (model.weight * 100).toFixed(1) }}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {{ model.isActive ? '活跃' : '停用' }}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center gap-2">
                                                            <span class="text-sm font-medium text-highlighted">
                                                                {{ (model.performanceMetrics?.accuracy || 0).toFixed(1)
                                                                }}%
                                                            </span>
                                                            <UIcon
                                                                v-if="model.performanceMetrics?.accuracy && model.performanceMetrics.accuracy > 80"
                                                                name="i-lucide-trending-up"
                                                                class="size-4 text-success" />
                                                            <UIcon
                                                                v-else-if="model.performanceMetrics?.accuracy && model.performanceMetrics.accuracy > 60"
                                                                name="i-lucide-minus" class="size-4 text-warning" />
                                                            <UIcon v-else name="i-lucide-trending-down"
                                                                class="size-4 text-error" />
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div class="flex gap-1">
                                                            <UButton icon="i-lucide-eye" color="neutral" variant="ghost"
                                                                size="sm" @click.stop="selectModel(model)"
                                                                title="查看详情" />
                                                            <UButton icon="i-lucide-settings" color="neutral"
                                                                variant="ghost" size="sm"
                                                                @click.stop="showConfigModal(model)" title="配置参数" />
                                                            <UButton icon="i-lucide-refresh-cw" color="neutral"
                                                                variant="ghost" size="sm"
                                                                @click.stop="evaluateModel(model.modelId)"
                                                                title="性能评估" />
                                                            <UButton
                                                                :icon="model.isActive ? 'i-lucide-pause' : 'i-lucide-play'"
                                                                :color="model.isActive ? 'warning' : 'success'"
                                                                variant="ghost" size="sm"
                                                                @click.stop="toggleModelActive(model)"
                                                                :title="model.isActive ? '停用模型' : '启用模型'" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </UDashboardSection>

                            <!-- 性能监控区域 -->
                            <UDashboardSection title="性能监控" description="模型性能指标监控和趋势分析">
                                <div class="bg-white rounded-lg border border-gray-200 p-4">
                                    <div v-if="selectedModel">
                                        <!-- 性能指标卡片 -->
                                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            <div v-for="metric in performanceMetrics" :key="metric.name"
                                                class="p-4 rounded-lg border border-gray-200 bg-gray-50">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="text-sm text-gray-500">{{ metric.label }}</span>
                                                    <UIcon :name="metric.icon" class="size-4" :class="metric.color" />
                                                </div>
                                                <div class="text-2xl font-semibold text-highlighted">
                                                    {{ metric.value }}
                                                </div>
                                                <div class="text-xs text-gray-500 mt-1">
                                                    {{ metric.description }}
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 性能趋势图表 -->
                                        <div class="h-64 bg-gray-50 rounded-lg p-4">
                                            <h4 class="text-sm font-medium text-highlighted mb-4">
                                                性能趋势 - {{ selectedModel.name }}
                                            </h4>
                                            <!-- 这里应该使用Unovis图表库展示性能趋势 -->
                                            <div class="flex items-center justify-center h-full text-gray-500">
                                                <div class="text-center">
                                                    <UIcon name="i-lucide-bar-chart-3" class="size-12 mb-2" />
                                                    <p>性能趋势图表</p>
                                                    <p class="text-sm">使用Unovis图表库实现</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="text-center py-8">
                                        <UIcon name="i-lucide-bar-chart-3" class="size-12 text-gray-400 mb-4" />
                                        <p class="text-gray-500">请选择一个模型查看性能监控</p>
                                    </div>
                                </div>
                            </UDashboardSection>
                        </div>

                        <!-- 模型详情和配置区域 -->
                        <div class="xl:col-span-1">
                            <!-- 模型详情面板 -->
                            <UDashboardSection title="模型详情" description="选中模型的详细信息">
                                <div class="bg-white rounded-lg border border-gray-200 p-4">
                                    <div v-if="selectedModel" class="space-y-4">
                                        <!-- 模型基本信息 -->
                                        <div class="text-center">
                                            <h3 class="text-lg font-semibold text-highlighted">
                                                {{ selectedModel.name }}
                                            </h3>
                                            <p class="text-sm text-gray-500">{{ selectedModel.description }}</p>
                                        </div>

                                        <!-- 模型信息 -->
                                        <div class="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span class="text-gray-500">类型:</span>
                                                <UBadge :color="getModelTypeColor(selectedModel.modelType)"
                                                    variant="subtle" class="ml-2">
                                                    {{ getModelTypeText(selectedModel.modelType) }}
                                                </UBadge>
                                            </div>
                                            <div>
                                                <span class="text-gray-500">状态:</span>
                                                <UBadge :color="selectedModel.isActive ? 'success' : 'neutral'"
                                                    variant="subtle" class="ml-2">
                                                    {{ selectedModel.isActive ? '活跃' : '停用' }}
                                                </UBadge>
                                            </div>
                                        </div>

                                        <!-- 性能指标 -->
                                        <div class="border-t border-gray-200 pt-4">
                                            <h4 class="text-sm font-medium text-gray-700 mb-2">性能指标</h4>
                                            <div class="space-y-2 text-sm">
                                                <div class="flex justify-between">
                                                    <span class="text-gray-500">准确率:</span>
                                                    <span class="font-medium">{{
                                                        (selectedModel.performanceMetrics?.accuracy || 0).toFixed(1)
                                                    }}%</span>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-gray-500">总回报:</span>
                                                    <span class="font-medium">{{
                                                        (selectedModel.performanceMetrics?.totalReturn || 0).toFixed(1)
                                                    }}%</span>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-gray-500">夏普比率:</span>
                                                    <span class="font-medium">{{
                                                        (selectedModel.performanceMetrics?.sharpeRatio || 0).toFixed(2)
                                                    }}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 操作按钮 -->
                                        <div class="flex gap-2">
                                            <UButton label="配置权重" color="primary" variant="solid" block
                                                @click="showWeightConfigModal(selectedModel)" />
                                            <UButton label="重新评估" color="neutral" variant="outline" block
                                                @click="evaluateModel(selectedModel.modelId)" />
                                        </div>
                                    </div>

                                    <!-- 未选择模型时的提示 -->
                                    <div v-else class="text-center py-8">
                                        <UIcon name="i-lucide-info" class="size-12 text-gray-400 mb-4" />
                                        <p class="text-gray-500">请选择一个模型查看详情</p>
                                    </div>
                                </div>
                            </UDashboardSection>

                            <!-- 参数配置区域 -->
                            <UDashboardSection title="参数配置" description="模型参数调整和权重设置">
                                <div class="bg-white rounded-lg border border-gray-200 p-4">
                                    <div v-if="selectedModel" class="space-y-4">
                                        <!-- 权重配置 -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                模型权重 ({{ (selectedModel.weight * 100).toFixed(1) }}%)
                                            </label>
                                            <UInput v-model="weightInput" type="number" min="0" max="100" step="0.1"
                                                placeholder="输入权重百分比" />
                                            <div class="flex gap-2 mt-2">
                                                <UButton label="应用权重" color="primary" variant="solid" size="sm"
                                                    @click="updateModelWeight" />
                                                <UButton label="重置" color="neutral" variant="ghost" size="sm"
                                                    @click="resetWeight" />
                                            </div>
                                        </div>

                                        <!-- 参数配置 -->
                                        <div class="border-t border-gray-200 pt-4">
                                            <h4 class="text-sm font-medium text-gray-700 mb-2">模型参数</h4>
                                            <div class="space-y-2 text-sm">
                                                <div v-for="(value, key) in selectedModel.parameters" :key="key"
                                                    class="flex justify-between">
                                                    <span class="text-gray-500">{{ key }}:</span>
                                                    <span class="font-medium">{{ value }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="text-center py-8">
                                        <UIcon name="i-lucide-settings" class="size-12 text-gray-400 mb-4" />
                                        <p class="text-gray-500">请选择一个模型进行参数配置</p>
                                    </div>
                                </div>
                            </UDashboardSection>

                            <!-- 回测分析区域 -->
                            <UDashboardSection title="回测分析" description="模型回测结果对比">
                                <div class="bg-white rounded-lg border border-gray-200 p-4">
                                    <div v-if="selectedModel" class="space-y-4">
                                        <!-- 回测结果摘要 -->
                                        <div class="text-center">
                                            <h4 class="text-sm font-medium text-gray-700 mb-2">回测结果</h4>
                                            <div class="grid grid-cols-2 gap-3 text-sm">
                                                <div class="text-center p-2 bg-gray-50 rounded">
                                                    <div class="text-lg font-semibold text-highlighted">
                                                        {{ (selectedModel.performanceMetrics?.totalReturn ||
                                                            0).toFixed(1) }}%
                                                    </div>
                                                    <div class="text-xs text-gray-500">总回报</div>
                                                </div>
                                                <div class="text-center p-2 bg-gray-50 rounded">
                                                    <div class="text-lg font-semibold text-highlighted">
                                                        {{ (selectedModel.performanceMetrics?.maxDrawdown ||
                                                        0).toFixed(1) }}%
                                                    </div>
                                                    <div class="text-xs text-gray-500">最大回撤</div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 回测对比图表 -->
                                        <div class="h-48 bg-gray-50 rounded-lg p-4">
                                            <h4 class="text-sm font-medium text-highlighted mb-4">
                                                回测对比
                                            </h4>
                                            <!-- 这里应该使用Unovis图表库展示回测对比 -->
                                            <div class="flex items-center justify-center h-full text-gray-500">
                                                <div class="text-center">
                                                    <UIcon name="i-lucide-line-chart" class="size-12 mb-2" />
                                                    <p>回测对比图表</p>
                                                    <p class="text-sm">使用Unovis图表库实现</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="text-center py-8">
                                        <UIcon name="i-lucide-line-chart" class="size-12 text-gray-400 mb-4" />
                                        <p class="text-gray-500">请选择一个模型查看回测分析</p>
                                    </div>
                                </div>
                            </UDashboardSection>
                        </div>
                    </div>
                </UDashboardPanelContent>
            </UDashboardPanel>
        </UDashboardPage>

        <!-- 训练新模型模态框 -->
        <UModal v-model="showTrainModelModal">
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">训练新模型</h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost"
                            @click="showTrainModelModal = false" />
                    </div>
                </template>

                <div class="space-y-4">
                    <UFormGroup label="模型类型">
                        <USelect v-model="trainForm.modelType" :options="modelTypeOptions" placeholder="选择模型类型" />
                    </UFormGroup>

                    <UFormGroup label="模型名称">
                        <UInput v-model="trainForm.name" placeholder="输入模型名称" />
                    </UFormGroup>

                    <UFormGroup label="模型描述">
                        <UTextarea v-model="trainForm.description" placeholder="输入模型描述" />
                    </UFormGroup>

                    <UFormGroup label="训练数据范围">
                        <div class="grid grid-cols-2 gap-4">
                            <UInput v-model="trainForm.startDate" type="date" placeholder="开始日期" />
                            <UInput v-model="trainForm.endDate" type="date" placeholder="结束日期" />
                        </div>
                    </UFormGroup>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <UButton label="取消" color="neutral" variant="ghost" @click="showTrainModelModal = false" />
                        <UButton label="开始训练" color="primary" :loading="trainingLoading" @click="trainModel" />
                    </div>
                </template>
            </UCard>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useModelStore } from '~/stores/models'
import type { ModelInfo } from '~/types/models'

// 组件定义
definePageMeta({
    title: '模型管理',
    description: '模型管理和性能监控页面'
})

// Store
const modelStore = useModelStore()

// 响应式数据
const selectedModel = ref<ModelInfo | null>(null)
const showTrainModelModal = ref(false)
const trainingLoading = ref(false)
const weightInput = ref('')

// 筛选条件
const filters = ref({
    modelType: null as string | null,
    status: null as string | null,
    searchQuery: ''
})

// 训练表单
const trainForm = ref({
    modelType: '',
    name: '',
    description: '',
    startDate: '',
    endDate: ''
})

// 选项配置
const modelTypeOptions = [
    { value: 'technical', label: '技术分析模型' },
    { value: 'ml', label: '机器学习模型' },
    { value: 'dl', label: '深度学习模型' }
]

const statusOptions = [
    { value: 'active', label: '活跃' },
    { value: 'inactive', label: '停用' }
]

// 计算属性
const filteredModels = computed(() => {
    return modelStore.filteredModels
})

const performanceMetrics = computed(() => {
    if (!selectedModel.value) return []

    const metrics = selectedModel.value.performanceMetrics || {}
    return [
        {
            name: 'accuracy',
            label: '准确率',
            value: `${(metrics.accuracy || 0).toFixed(1)}%`,
            icon: 'i-lucide-target',
            color: 'text-success',
            description: '预测准确率'
        },
        {
            name: 'totalReturn',
            label: '总回报',
            value: `${(metrics.totalReturn || 0).toFixed(1)}%`,
            icon: 'i-lucide-trending-up',
            color: 'text-primary',
            description: '累计回报率'
        },
        {
            name: 'sharpeRatio',
            label: '夏普比率',
            value: (metrics.sharpeRatio || 0).toFixed(2),
            icon: 'i-lucide-chart-line',
            color: 'text-warning',
            description: '风险调整收益'
        },
        {
            name: 'maxDrawdown',
            label: '最大回撤',
            value: `${(metrics.maxDrawdown || 0).toFixed(1)}%`,
            icon: 'i-lucide-trending-down',
            color: 'text-error',
            description: '最大亏损幅度'
        }
    ]
})

// 方法
const fetchModels = async () => {
    await modelStore.fetchModelsCached()
}

const selectModel = (model: ModelInfo) => {
    selectedModel.value = model
    weightInput.value = (model.weight * 100).toFixed(1)
}

const refreshData = async () => {
    await modelStore.clearModelCache()
    await fetchModels()
}

const resetFilters = () => {
    filters.value = {
        modelType: null,
        status: null,
        searchQuery: ''
    }
    modelStore.resetFilters()
}

const applyFilters = () => {
    modelStore.setFilters({
        modelType: filters.value.modelType,
        activeOnly: filters.value.status === 'active',
        searchQuery: filters.value.searchQuery
    })
}

const getModelTypeColor = (type: string) => {
    switch (type) {
        case 'technical': return 'primary'
        case 'ml': return 'success'
        case 'dl': return 'warning'
        default: return 'neutral'
    }
}

const getModelTypeText = (type: string) => {
    switch (type) {
        case 'technical': return '技术分析'
        case 'ml': return '机器学习'
        case 'dl': return '深度学习'
        default: return type
    }
}

const getWeightColor = (weight: number) => {
    if (weight >= 0.3) return 'success'
    if (weight >= 0.1) return 'warning'
    return 'error'
}

const showConfigModal = (model: ModelInfo) => {
    selectModel(model)
    // 这里可以打开更详细的配置模态框
}

const evaluateModel = async (modelId: number) => {
    try {
        await modelStore.reevaluateModel(modelId)
        // 显示成功提示
    } catch (error) {
        // 错误已经在store中处理
    }
}

const toggleModelActive = async (model: ModelInfo) => {
    try {
        await modelStore.toggleModelActive(model.modelId, !model.isActive)
        // 显示成功提示
    } catch (error) {
        // 错误已经在store中处理
    }
}

const updateModelWeight = async () => {
    if (!selectedModel.value) return

    const weight = parseFloat(weightInput.value) / 100
    if (isNaN(weight) || weight < 0 || weight > 1) {
        // 显示错误提示
        return
    }

    try {
        await modelStore.updateModelWeight(selectedModel.value.modelId, weight)
        // 显示成功提示
    } catch (error) {
        // 错误已经在store中处理
    }
}

const resetWeight = () => {
    if (selectedModel.value) {
        weightInput.value = (selectedModel.value.weight * 100).toFixed(1)
    }
}

const showWeightConfigModal = (model: ModelInfo) => {
    selectModel(model)
    // 这里可以打开权重配置模态框
}

const batchEvaluateModels = async () => {
    // 实现批量评估逻辑
}

const trainModel = async () => {
    trainingLoading.value = true
    try {
        // 调用训练API
        showTrainModelModal.value = false
        // 显示成功提示
    } catch (error) {
        // 错误处理
    } finally {
        trainingLoading.value = false
    }
}

// 生命周期
onMounted(() => {
    fetchModels()
})

// 监听筛选条件变化
watch(filters, () => {
    applyFilters()
}, { deep: true })
</script>
