<template>
    <div class="stock-filter">
        <!-- 筛选器头部 -->
        <div class="filter-header">
            <slot name="header">
                <h3 class="text-lg font-semibold text-gray-900">股票筛选</h3>
            </slot>

            <div class="filter-actions">
                <button @click="resetFilters"
                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    重置
                </button>
                <button @click="applyFilters"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    应用筛选
                </button>
            </div>
        </div>

        <!-- 筛选条件 -->
        <div class="filter-conditions">
            <!-- 股票代码筛选 -->
            <div class="filter-group">
                <label class="block text-sm font-medium text-gray-700 mb-2">股票代码</label>
                <input v-model="filters.symbol" type="text" placeholder="输入股票代码..."
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            <!-- 股票名称筛选 -->
            <div class="filter-group">
                <label class="block text-sm font-medium text-gray-700 mb-2">股票名称</label>
                <input v-model="filters.name" type="text" placeholder="输入股票名称..."
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            <!-- 市场筛选 -->
            <div class="filter-group">
                <label class="block text-sm font-medium text-gray-700 mb-2">市场</label>
                <div class="space-y-2">
                    <label v-for="market in marketOptions" :key="market.value" class="inline-flex items-center mr-4">
                        <input v-model="filters.markets" type="checkbox" :value="market.value"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span class="ml-2 text-sm text-gray-700">{{ market.label }}</span>
                    </label>
                </div>
            </div>

            <!-- 状态筛选 -->
            <div class="filter-group">
                <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select v-model="filters.status"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="">全部</option>
                    <option value="active">活跃</option>
                    <option value="inactive">停牌</option>
                </select>
            </div>

            <!-- 创建时间范围 -->
            <div class="filter-group">
                <label class="block text-sm font-medium text-gray-700 mb-2">创建时间范围</label>
                <div class="grid grid-cols-2 gap-2">
                    <input v-model="filters.createdFrom" type="date"
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    <input v-model="filters.createdTo" type="date"
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
            </div>

            <!-- 高级筛选插槽 -->
            <slot name="advanced-filters" :filters="filters"></slot>
        </div>

        <!-- 当前筛选条件显示 -->
        <div v-if="hasActiveFilters" class="active-filters">
            <div class="flex items-center">
                <span class="text-sm text-gray-500 mr-2">当前筛选:</span>
                <div class="flex flex-wrap gap-2">
                    <span v-for="filter in activeFilterLabels" :key="filter.key"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ filter.label }}
                        <button @click="removeFilter(filter.key)"
                            class="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-blue-200 focus:outline-none">
                            <span class="sr-only">移除</span>
                            <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
                            </svg>
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface FilterParams {
    symbol?: string
    name?: string
    markets?: string[]
    status?: string
    createdFrom?: string
    createdTo?: string
}

interface Props {
    initialFilters?: FilterParams
}

interface Emits {
    (e: 'filter-change', filters: FilterParams): void
    (e: 'filter-reset'): void
}

const props = withDefaults(defineProps<Props>(), {
    initialFilters: () => ({})
})

const emit = defineEmits<Emits>()

// 市场选项
const marketOptions = [
    { value: 'SH', label: '上证' },
    { value: 'SZ', label: '深证' },
    { value: 'BJ', label: '北证' }
]

// 筛选状态
const filters = reactive<FilterParams>({
    symbol: '',
    name: '',
    markets: [],
    status: '',
    createdFrom: '',
    createdTo: '',
    ...props.initialFilters
})

// 是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
    return Object.values(filters).some(value => {
        if (Array.isArray(value)) return value.length > 0
        return value !== '' && value !== undefined && value !== null
    })
})

// 当前活跃的筛选标签
const activeFilterLabels = computed(() => {
    const labels: Array<{ key: string; label: string }> = []

    if (filters.symbol) {
        labels.push({ key: 'symbol', label: `代码: ${filters.symbol}` })
    }

    if (filters.name) {
        labels.push({ key: 'name', label: `名称: ${filters.name}` })
    }

    if (filters.markets && filters.markets.length > 0) {
        const marketLabels = filters.markets.map(market => {
            const marketOption = marketOptions.find(m => m.value === market)
            return marketOption ? marketOption.label : market
        })
        labels.push({ key: 'markets', label: `市场: ${marketLabels.join(', ')}` })
    }

    if (filters.status) {
        const statusLabel = filters.status === 'active' ? '活跃' : '停牌'
        labels.push({ key: 'status', label: `状态: ${statusLabel}` })
    }

    if (filters.createdFrom || filters.createdTo) {
        const from = filters.createdFrom || '开始'
        const to = filters.createdTo || '结束'
        labels.push({ key: 'date', label: `时间: ${from} 至 ${to}` })
    }

    return labels
})

// 应用筛选
const applyFilters = () => {
    // 清理空值
    const cleanedFilters: FilterParams = {}

    Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            if (value.length > 0) {
                cleanedFilters[key as keyof FilterParams] = value
            }
        } else if (value !== '' && value !== undefined && value !== null) {
            cleanedFilters[key as keyof FilterParams] = value
        }
    })

    emit('filter-change', cleanedFilters)
}

// 重置筛选
const resetFilters = () => {
    Object.keys(filters).forEach(key => {
        const filterKey = key as keyof FilterParams
        if (Array.isArray(filters[filterKey])) {
            filters[filterKey] = []
        } else {
            filters[filterKey] = ''
        }
    })
    emit('filter-reset')
}

// 移除单个筛选条件
const removeFilter = (filterKey: string) => {
    switch (filterKey) {
        case 'symbol':
            filters.symbol = ''
            break
        case 'name':
            filters.name = ''
            break
        case 'markets':
            filters.markets = []
            break
        case 'status':
            filters.status = ''
            break
        case 'date':
            filters.createdFrom = ''
            filters.createdTo = ''
            break
    }

    // 重新应用筛选
    applyFilters()
}

// 监听初始筛选条件变化
watch(() => props.initialFilters, (newFilters) => {
    Object.assign(filters, newFilters)
}, { deep: true })

// 防抖应用筛选
const debouncedApply = useDebounceFn(applyFilters, 500)

// 监听筛选条件变化，自动应用（可选）
watch(filters, () => {
    // 可以根据需要启用自动应用
    // debouncedApply()
}, { deep: true })
</script>

<style scoped>
.stock-filter {
    @apply bg-white shadow rounded-lg p-6;
}

.filter-header {
    @apply flex justify-between items-center mb-6 pb-4 border-b border-gray-200;
}

.filter-actions {
    @apply flex space-x-3;
}

.filter-conditions {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.filter-group {
    @apply space-y-2;
}

.active-filters {
    @apply mt-6 pt-4 border-t border-gray-200;
}
</style>