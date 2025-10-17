<template>
    <div class="model-card">
        <!-- 卡片头部 -->
        <div class="card-header">
            <slot name="header">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="model-main">
                            <h3 class="text-lg font-semibold text-gray-900">{{ model.name }}</h3>
                            <p class="text-sm text-gray-500">{{ model.description }}</p>
                        </div>
                        <span class="model-type-badge" :class="modelTypeClass">
                            {{ modelTypeLabel }}
                        </span>
                    </div>

                    <div class="flex items-center space-x-2">
                        <span class="weight-badge" :class="weightClass">
                            权重: {{ model.weight }}
                        </span>
                        <span class="status-badge" :class="statusClass">
                            {{ statusLabel }}
                        </span>
                        <slot name="header-actions" :model="model"></slot>
                    </div>
                </div>
            </slot>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
            <slot name="content">
                <!-- 基本信息 -->
                <div class="basic-info">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">模型ID</span>
                            <span class="info-value">{{ model.modelId }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">模型类型</span>
                            <span class="info-value">{{ modelTypeLabel }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">投票权重</span>
                            <span class="info-value">{{ model.weight }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">状态</span>
                            <span class="info-value">{{ statusLabel }}</span>
                        </div>
                    </div>
                </div>

                <!-- 性能指标 -->
                <div v-if="model.performanceMetrics" class="performance-metrics">
                    <h4 class="text-sm font-medium text-gray-700 mb-3">性能指标</h4>
                    <div class="metrics-grid">
                        <div class="metric-item" v-if="model.performanceMetrics.accuracy !== undefined">
                            <span class="metric-label">准确率</span>
                            <div class="metric-value">
                                <span class="value">{{ (model.performanceMetrics.accuracy * 100).toFixed(1) }}%</span>
                                <div class="metric-bar">
                                    <div class="metric-progress"
                                        :style="{ width: `${model.performanceMetrics.accuracy * 100}%` }"></div>
                                </div>
                            </div>
                        </div>
                        <div class="metric-item" v-if="model.performanceMetrics.totalReturn !== undefined">
                            <span class="metric-label">总收益</span>
                            <div class="metric-value">
                                <span class="value"
                                    :class="model.performanceMetrics.totalReturn >= 0 ? 'positive' : 'negative'">
                                    {{ (model.performanceMetrics.totalReturn * 100).toFixed(1) }}%
                                </span>
                            </div>
                        </div>
                        <div class="metric-item" v-if="model.performanceMetrics.sharpeRatio !== undefined">
                            <span class="metric-label">夏普比率</span>
                            <div class="metric-value">
                                <span class="value">{{ model.performanceMetrics.sharpeRatio.toFixed(2) }}</span>
                            </div>
                        </div>
                        <div class="metric-item" v-if="model.performanceMetrics.maxDrawdown !== undefined">
                            <span class="metric-label">最大回撤</span>
                            <div class="metric-value">
                                <span class="value negative">{{ (model.performanceMetrics.maxDrawdown * 100).toFixed(1)
                                    }}%</span>
                            </div>
                        </div>
                        <div class="metric-item" v-if="model.performanceMetrics.winRate !== undefined">
                            <span class="metric-label">胜率</span>
                            <div class="metric-value">
                                <span class="value">{{ (model.performanceMetrics.winRate * 100).toFixed(1) }}%</span>
                                <div class="metric-bar">
                                    <div class="metric-progress"
                                        :style="{ width: `${model.performanceMetrics.winRate * 100}%` }"></div>
                                </div>
                            </div>
                        </div>
                        <div class="metric-item" v-if="model.performanceMetrics.precision !== undefined">
                            <span class="metric-label">精确率</span>
                            <div class="metric-value">
                                <span class="value">{{ (model.performanceMetrics.precision * 100).toFixed(1) }}%</span>
                                <div class="metric-bar">
                                    <div class="metric-progress"
                                        :style="{ width: `${model.performanceMetrics.precision * 100}%` }"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 模型参数 -->
                <div v-if="model.parameters && Object.keys(model.parameters).length > 0" class="model-parameters">
                    <h4 class="text-sm font-medium text-gray-700 mb-3">模型参数</h4>
                    <div class="parameters-list">
                        <div v-for="(value, key) in model.parameters" :key="key" class="parameter-item">
                            <span class="parameter-key">{{ key }}</span>
                            <span class="parameter-value">{{ formatParameterValue(value) }}</span>
                        </div>
                    </div>
                </div>

                <!-- 自定义内容插槽 -->
                <slot name="custom-content" :model="model"></slot>
            </slot>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
            <slot name="footer" :model="model">
                <div class="footer-actions">
                    <button @click="$emit('view-details', model)"
                        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        查看详情
                    </button>
                    <button @click="$emit('edit-model', model)"
                        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        编辑配置
                    </button>
                    <button @click="$emit('toggle-status', model)" :class="statusButtonClass">
                        {{ statusButtonLabel }}
                    </button>
                    <slot name="extra-actions" :model="model"></slot>
                </div>
            </slot>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner">
                <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
                <span class="ml-2 text-sm text-gray-600">加载中...</span>
            </div>
        </div>

        <!-- 错误状态 -->
        <div v-if="error" class="error-overlay">
            <div class="error-message">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd" />
                </svg>
                <span class="ml-2 text-sm text-red-600">{{ error }}</span>
                <button @click="$emit('retry', model)"
                    class="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    重试
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ModelInfo } from '~/types/models'

interface Props {
    model: ModelInfo
    loading?: boolean
    error?: string
    showPerformance?: boolean
    showParameters?: boolean
}

interface Emits {
    (e: 'view-details', model: ModelInfo): void
    (e: 'edit-model', model: ModelInfo): void
    (e: 'toggle-status', model: ModelInfo): void
    (e: 'retry', model: ModelInfo): void
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: '',
    showPerformance: true,
    showParameters: true
})

const emit = defineEmits<Emits>()

// 模型类型标签和样式
const modelTypeLabel = computed(() => {
    const typeMap: Record<string, string> = {
        'technical': '技术指标',
        'ml': '机器学习',
        'dl': '深度学习'
    }
    return typeMap[props.model.modelType] || props.model.modelType
})

const modelTypeClass = computed(() => {
    const classMap: Record<string, string> = {
        'technical': 'bg-blue-100 text-blue-800',
        'ml': 'bg-purple-100 text-purple-800',
        'dl': 'bg-indigo-100 text-indigo-800'
    }
    return classMap[props.model.modelType] || 'bg-gray-100 text-gray-800'
})

// 状态标签和样式
const statusLabel = computed(() => {
    return props.model.isActive ? '活跃' : '停用'
})

const statusClass = computed(() => {
    return props.model.isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
})

// 权重样式
const weightClass = computed(() => {
    if (props.model.weight >= 0.8) return 'weight-high'
    if (props.model.weight >= 0.5) return 'weight-medium'
    return 'weight-low'
})

// 状态按钮
const statusButtonLabel = computed(() => {
    return props.model.isActive ? '停用模型' : '启用模型'
})

const statusButtonClass = computed(() => {
    const baseClass = 'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2'
    return props.model.isActive
        ? `${baseClass} text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500`
        : `${baseClass} text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`
})

// 格式化参数值
const formatParameterValue = (value: any) => {
    if (typeof value === 'number') {
        return value.toFixed(4)
    }
    if (typeof value === 'boolean') {
        return value ? '是' : '否'
    }
    if (Array.isArray(value)) {
        return value.join(', ')
    }
    return String(value)
}
</script>

<style scoped>
.model-card {
    @apply bg-white shadow rounded-lg p-6 relative;
    min-height: 300px;
}

.card-header {
    @apply mb-6 pb-4 border-b border-gray-200;
}

.card-content {
    @apply mb-6 space-y-6;
}

.card-footer {
    @apply pt-4 border-t border-gray-200;
}

.model-main h3 {
    @apply text-lg font-semibold text-gray-900;
}

.model-main p {
    @apply text-sm text-gray-500;
}

.model-type-badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.weight-badge {
    @apply inline-flex items-center px-2 py-1 rounded text-xs font-medium;
}

.weight-high {
    @apply bg-green-100 text-green-800;
}

.weight-medium {
    @apply bg-yellow-100 text-yellow-800;
}

.weight-low {
    @apply bg-red-100 text-red-800;
}

.status-badge {
    @apply inline-flex items-center px-2 py-1 rounded text-xs font-medium;
}

/* 基本信息样式 */
.basic-info {
    @apply space-y-3;
}

.info-grid {
    @apply grid grid-cols-2 gap-4;
}

.info-item {
    @apply flex flex-col;
}

.info-label {
    @apply text-xs text-gray-500 mb-1;
}

.info-value {
    @apply text-sm font-medium text-gray-900;
}

/* 性能指标样式 */
.performance-metrics {
    @apply space-y-3;
}

.metrics-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.metric-item {
    @apply flex justify-between items-center;
}

.metric-label {
    @apply text-sm text-gray-600;
}

.metric-value {
    @apply flex items-center space-x-2;
}

.metric-value .value {
    @apply text-sm font-medium;
}

.metric-value .positive {
    @apply text-green-600;
}

.metric-value .negative {
    @apply text-red-600;
}

.metric-bar {
    @apply w-16 bg-gray-200 rounded-full h-2;
}

.metric-progress {
    @apply h-2 rounded-full bg-blue-500 transition-all duration-500;
}

/* 模型参数样式 */
.model-parameters {
    @apply space-y-3;
}

.parameters-list {
    @apply space-y-2;
}

.parameter-item {
    @apply flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0;
}

.parameter-key {
    @apply text-sm text-gray-600;
}

.parameter-value {
    @apply text-sm font-mono text-gray-800;
}

/* 底部操作按钮 */
.footer-actions {
    @apply flex space-x-3;
}

/* 加载和错误状态 */
.loading-overlay {
    @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg;
}

.loading-spinner {
    @apply flex items-center;
}

.error-overlay {
    @apply absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg;
}

.error-message {
    @apply flex items-center;
}

/* 响应式设计 */
@media (max-width: 640px) {
    .card-header .flex.items-center.justify-between {
        @apply flex-col items-start space-y-3;
    }

    .info-grid {
        @apply grid-cols-1 gap-3;
    }

    .metrics-grid {
        @apply grid-cols-1 gap-3;
    }

    .metric-item {
        @apply flex-col items-start space-y-2;
    }

    .metric-value {
        @apply w-full justify-between;
    }

    .footer-actions {
        @apply flex-col space-x-0 space-y-2;
    }

    .footer-actions button {
        @apply w-full justify-center;
    }
}
</style>