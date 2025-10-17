<template>
    <div class="backtest-config">
        <!-- 配置头部 -->
        <div class="config-header">
            <slot name="header">
                <h3 class="text-lg font-semibold text-gray-900">回测配置</h3>
            </slot>

            <!-- 配置操作 -->
            <div class="config-actions">
                <slot name="actions">
                    <div class="flex items-center space-x-3">
                        <button @click="resetConfig"
                            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            重置
                        </button>
                        <button @click="startBacktest" :disabled="!isFormValid || running"
                            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            <svg v-if="running" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                            {{ running ? '运行中...' : '开始回测' }}
                        </button>
                    </div>
                </slot>
            </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
            <div class="animate-pulse space-y-4">
                <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                <div class="h-10 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded w-1/3"></div>
                <div class="h-10 bg-gray-200 rounded"></div>
            </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">加载失败</h3>
                        <p class="text-sm text-red-700 mt-1">{{ error }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 配置表单 -->
        <div v-else class="config-form">
            <form @submit.prevent="startBacktest">
                <!-- 基本配置 -->
                <div class="config-section">
                    <h4 class="text-md font-medium text-gray-900 mb-4">基本配置</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- 股票代码 -->
                        <div class="form-group">
                            <label for="symbol" class="block text-sm font-medium text-gray-700 mb-2">
                                股票代码 <span class="text-red-500">*</span>
                            </label>
                            <input id="symbol" v-model="config.symbol" type="text" required placeholder="例如: 000001"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                :class="{ 'border-red-300': errors.symbol }" />
                            <p v-if="errors.symbol" class="mt-1 text-sm text-red-600">{{ errors.symbol }}</p>
                        </div>

                        <!-- 初始资金 -->
                        <div class="form-group">
                            <label for="initialCapital" class="block text-sm font-medium text-gray-700 mb-2">
                                初始资金 (元) <span class="text-red-500">*</span>
                            </label>
                            <input id="initialCapital" v-model.number="config.initialCapital" type="number" min="1000"
                                step="1000" required
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                :class="{ 'border-red-300': errors.initialCapital }" />
                            <p v-if="errors.initialCapital" class="mt-1 text-sm text-red-600">{{ errors.initialCapital
                            }}</p>
                        </div>

                        <!-- 开始日期 -->
                        <div class="form-group">
                            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
                                开始日期 <span class="text-red-500">*</span>
                            </label>
                            <input id="startDate" v-model="config.startDate" type="date" required
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                :class="{ 'border-red-300': errors.startDate }" />
                            <p v-if="errors.startDate" class="mt-1 text-sm text-red-600">{{ errors.startDate }}</p>
                        </div>

                        <!-- 结束日期 -->
                        <div class="form-group">
                            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
                                结束日期 <span class="text-red-500">*</span>
                            </label>
                            <input id="endDate" v-model="config.endDate" type="date" required
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                :class="{ 'border-red-300': errors.endDate }" />
                            <p v-if="errors.endDate" class="mt-1 text-sm text-red-600">{{ errors.endDate }}</p>
                        </div>
                    </div>
                </div>

                <!-- 模型选择 -->
                <div class="config-section">
                    <h4 class="text-md font-medium text-gray-900 mb-4">模型选择</h4>
                    <div class="form-group">
                        <label class="block text-sm font-medium text-gray-700 mb-3">选择参与回测的模型</label>
                        <div class="space-y-2">
                            <label v-for="model in availableModels" :key="model.modelId"
                                class="inline-flex items-center mr-4 mb-2">
                                <input v-model="config.modelIds" type="checkbox" :value="model.modelId"
                                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <span class="ml-2 text-sm text-gray-700">
                                    {{ model.name }}
                                    <span class="text-xs text-gray-500 ml-1">(权重: {{ model.weight }})</span>
                                </span>
                            </label>
                        </div>
                        <p v-if="errors.modelIds" class="mt-1 text-sm text-red-600">{{ errors.modelIds }}</p>
                        <p class="mt-2 text-sm text-gray-500">
                            至少选择一个模型参与回测，系统将使用投票机制进行决策
                        </p>
                    </div>
                </div>

                <!-- 策略配置 -->
                <div class="config-section">
                    <h4 class="text-md font-medium text-gray-900 mb-4">策略配置</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- 交易策略 -->
                        <div class="form-group">
                            <label for="strategy" class="block text-sm font-medium text-gray-700 mb-2">
                                交易策略
                            </label>
                            <select id="strategy" v-model="config.strategy"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                <option value="default">默认策略</option>
                                <option value="momentum">动量策略</option>
                                <option value="mean_reversion">均值回归</option>
                                <option value="breakout">突破策略</option>
                            </select>
                        </div>

                        <!-- 仓位管理 -->
                        <div class="form-group">
                            <label for="positionSize" class="block text-sm font-medium text-gray-700 mb-2">
                                单次仓位 (%)
                            </label>
                            <input id="positionSize" v-model.number="config.parameters.positionSize" type="number"
                                min="1" max="100" step="1"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p class="mt-1 text-sm text-gray-500">每次交易使用的资金比例</p>
                        </div>

                        <!-- 止损比例 -->
                        <div class="form-group">
                            <label for="stopLoss" class="block text-sm font-medium text-gray-700 mb-2">
                                止损比例 (%)
                            </label>
                            <input id="stopLoss" v-model.number="config.parameters.stopLoss" type="number" min="0"
                                max="50" step="0.5"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p class="mt-1 text-sm text-gray-500">最大亏损比例，达到时自动平仓</p>
                        </div>

                        <!-- 止盈比例 -->
                        <div class="form-group">
                            <label for="takeProfit" class="block text-sm font-medium text-gray-700 mb-2">
                                止盈比例 (%)
                            </label>
                            <input id="takeProfit" v-model.number="config.parameters.takeProfit" type="number" min="0"
                                max="100" step="0.5"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p class="mt-1 text-sm text-gray-500">目标盈利比例，达到时自动平仓</p>
                        </div>
                    </div>
                </div>

                <!-- 高级配置 -->
                <div class="config-section">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-md font-medium text-gray-900">高级配置</h4>
                        <button type="button" @click="showAdvanced = !showAdvanced"
                            class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            {{ showAdvanced ? '隐藏' : '显示' }}高级选项
                        </button>
                    </div>

                    <div v-if="showAdvanced" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- 交易费用 -->
                        <div class="form-group">
                            <label for="transactionFee" class="block text-sm font-medium text-gray-700 mb-2">
                                交易费率 (%)
                            </label>
                            <input id="transactionFee" v-model.number="config.parameters.transactionFee" type="number"
                                min="0" max="1" step="0.01"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p class="mt-1 text-sm text-gray-500">每次交易的费率，包含佣金和印花税</p>
                        </div>

                        <!-- 滑点 -->
                        <div class="form-group">
                            <label for="slippage" class="block text-sm font-medium text-gray-700 mb-2">
                                滑点 (%)
                            </label>
                            <input id="slippage" v-model.number="config.parameters.slippage" type="number" min="0"
                                max="5" step="0.01"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p class="mt-1 text-sm text-gray-500">交易执行时的价格偏差</p>
                        </div>

                        <!-- 最小持仓时间 -->
                        <div class="form-group">
                            <label for="minHoldDays" class="block text-sm font-medium text-gray-700 mb-2">
                                最小持仓天数
                            </label>
                            <input id="minHoldDays" v-model.number="config.parameters.minHoldDays" type="number" min="0"
                                max="30" step="1"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p class="mt-1 text-sm text-gray-500">买入后最小持有天数，避免频繁交易</p>
                        </div>

                        <!-- 最大持仓比例 -->
                        <div class="form-group">
                            <label for="maxPositionRatio" class="block text-sm font-medium text-gray-700 mb-2">
                                最大持仓比例 (%)
                            </label>
                            <input id="maxPositionRatio" v-model.number="config.parameters.maxPositionRatio"
                                type="number" min="0" max="100" step="1"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p class="mt-1 text-sm text-gray-500">单只股票最大持仓比例</p>
                        </div>
                    </div>
                </div>

                <!-- 自定义配置插槽 -->
                <slot name="custom-config" :config="config" :errors="errors"></slot>
            </form>
        </div>

        <!-- 运行状态 -->
        <div v-if="running" class="running-state">
            <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-blue-800">回测运行中</h3>
                        <p class="text-sm text-blue-700 mt-1">正在执行回测分析，请稍候...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BacktestRequest } from '~/types/backtest'
import type { ModelInfo } from '~/types/models'

interface Props {
    availableModels: ModelInfo[]
    loading?: boolean
    error?: string
    running?: boolean
    initialConfig?: Partial<BacktestRequest>
}

interface Emits {
    (e: 'backtest-start', config: BacktestRequest): void
    (e: 'config-reset'): void
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: '',
    running: false,
    initialConfig: () => ({})
})

const emit = defineEmits<Emits>()

// 默认配置
const defaultConfig: BacktestRequest = {
    symbol: '',
    startDate: '',
    endDate: '',
    initialCapital: 100000,
    modelIds: [],
    strategy: 'default',
    parameters: {
        positionSize: 20,
        stopLoss: 10,
        takeProfit: 20,
        transactionFee: 0.1,
        slippage: 0.1,
        minHoldDays: 1,
        maxPositionRatio: 50
    }
}

// 配置状态
const config = reactive<BacktestRequest>({ ...defaultConfig, ...props.initialConfig })

// 错误状态
const errors = reactive<Record<string, string>>({})

// 高级配置显示状态
const showAdvanced = ref(false)

// 表单验证
const isFormValid = computed(() => {
    return config.symbol.trim() !== '' &&
        config.startDate !== '' &&
        config.endDate !== '' &&
        config.initialCapital > 0 &&
        config.modelIds.length > 0 &&
        new Date(config.startDate) < new Date(config.endDate)
})

// 重置配置
const resetConfig = () => {
    Object.assign(config, { ...defaultConfig, ...props.initialConfig })
    Object.keys(errors).forEach(key => delete errors[key])
    showAdvanced.value = false
    emit('config-reset')
}

// 开始回测
const startBacktest = () => {
    // 验证表单
    errors.symbol = config.symbol.trim() === '' ? '股票代码不能为空' : ''
    errors.startDate = config.startDate === '' ? '请选择开始日期' : ''
    errors.endDate = config.endDate === '' ? '请选择结束日期' : ''
    errors.initialCapital = config.initialCapital <= 0 ? '初始资金必须大于0' : ''
    errors.modelIds = config.modelIds.length === 0 ? '请至少选择一个模型' : ''

    // 验证日期范围
    if (config.startDate && config.endDate) {
        const start = new Date(config.startDate)
        const end = new Date(config.endDate)
        if (start >= end) {
            errors.endDate = '结束日期必须晚于开始日期'
        }
    }

    // 如果有错误，不提交
    if (Object.values(errors).some(error => error !== '')) {
        return
    }

    emit('backtest-start', { ...config })
}

// 监听模型变化
watch(() => props.initialConfig, (newConfig) => {
    if (newConfig) {
        Object.assign(config, { ...defaultConfig, ...newConfig })
    }
}, { immediate: true, deep: true })

// 监听可用模型变化，设置默认选择
watch(() => props.availableModels, (models) => {
    if (models.length > 0 && config.modelIds.length === 0) {
        // 默认选择所有活跃模型
        config.modelIds = models
            .filter(model => model.isActive)
            .map(model => model.modelId)
    }
}, { immediate: true })
</script>

<style scoped>
.backtest-config {
    @apply bg-white shadow rounded-lg p-6;
}

.config-header {
    @apply flex justify-between items-center mb-6 pb-4 border-b border-gray-200;
}

.config-actions {
    @apply flex items-center space-x-3;
}

.loading-state {
    @apply space-y-4;
}

.error-state {
    @apply mb-6;
}

.config-form {
    @apply space-y-6;
}

.config-section {
    @apply p-4 border border-gray-200 rounded-lg;
}

.form-group {
    @apply space-y-2;
}

.running-state {
    @apply mt-6;
}

/* 响应式设计 */
@media (max-width: 640px) {
    .config-header {
        @apply flex-col items-start space-y-4;
    }

    .config-actions {
        @apply w-full justify-start;
    }

    .config-section .grid {
        @apply grid-cols-1 gap-4;
    }
}
</style>