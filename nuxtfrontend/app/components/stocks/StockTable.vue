<template>
    <div class="stock-table">
        <!-- 表格头部 -->
        <div class="table-header">
            <slot name="header">
                <h3 class="text-lg font-semibold text-gray-900">股票数据</h3>
            </slot>

            <!-- 排序和筛选控制 -->
            <div class="controls">
                <slot name="controls">
                    <div class="flex items-center space-x-4">
                        <select v-model="sortBy"
                            class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="symbol">代码排序</option>
                            <option value="name">名称排序</option>
                            <option value="market">市场排序</option>
                        </select>

                        <select v-model="sortDirection"
                            class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="asc">升序</option>
                            <option value="desc">降序</option>
                        </select>
                    </div>
                </slot>
            </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
            <div class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded mb-3" v-for="n in 5" :key="n"></div>
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

        <!-- 数据表格 -->
        <div v-else class="table-container">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th v-for="column in columns" :key="column.key"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            @click="handleSort(column.key)">
                            <div class="flex items-center">
                                {{ column.label }}
                                <span v-if="sortBy === column.key" class="ml-1">
                                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                                </span>
                            </div>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="stock in sortedStocks" :key="stock.id"
                        class="hover:bg-gray-50 transition-colors duration-150">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {{ stock.symbol }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ stock.name }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                :class="stock.market === 'SH' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'">
                                {{ stock.market === 'SH' ? '上证' : stock.market === 'SZ' ? '深证' : stock.market }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                :class="stock.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                {{ stock.isActive ? '活跃' : '停牌' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ formatDate(stock.createdAt) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <slot name="actions" :stock="stock">
                                <button @click="$emit('stock-select', stock)"
                                    class="text-blue-600 hover:text-blue-900 mr-3">
                                    查看
                                </button>
                                <button @click="$emit('stock-analyze', stock)"
                                    class="text-green-600 hover:text-green-900">
                                    分析
                                </button>
                            </slot>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- 空状态 -->
            <div v-if="sortedStocks.length === 0" class="empty-state">
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
                    <p class="mt-1 text-sm text-gray-500">没有找到符合条件的股票数据。</p>
                </div>
            </div>
        </div>

        <!-- 分页 -->
        <div v-if="showPagination" class="pagination">
            <slot name="pagination">
                <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                    <div class="flex justify-between flex-1 sm:hidden">
                        <button
                            class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            上一页
                        </button>
                        <button
                            class="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            下一页
                        </button>
                    </div>
                </div>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { StockInfo } from '~/types/stocks'

interface Props {
    stocks: StockInfo[]
    loading?: boolean
    error?: string
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
    showPagination?: boolean
}

interface Emits {
    (e: 'sort-change', sortBy: string, sortDirection: 'asc' | 'desc'): void
    (e: 'stock-select', stock: StockInfo): void
    (e: 'stock-analyze', stock: StockInfo): void
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: '',
    sortBy: 'symbol',
    sortDirection: 'asc',
    showPagination: false
})

const emit = defineEmits<Emits>()

// 表格列配置
const columns = [
    { key: 'symbol', label: '股票代码' },
    { key: 'name', label: '股票名称' },
    { key: 'market', label: '市场' },
    { key: 'isActive', label: '状态' },
    { key: 'createdAt', label: '创建时间' }
]

// 排序状态
const sortBy = ref(props.sortBy)
const sortDirection = ref(props.sortDirection)

// 排序后的股票数据
const sortedStocks = computed(() => {
    const stocks = [...props.stocks]

    return stocks.sort((a, b) => {
        let aValue = a[sortBy.value as keyof StockInfo]
        let bValue = b[sortBy.value as keyof StockInfo]

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
        return 0
    })
})

// 处理排序
const handleSort = (columnKey: string) => {
    if (sortBy.value === columnKey) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortBy.value = columnKey
        sortDirection.value = 'asc'
    }

    emit('sort-change', sortBy.value, sortDirection.value)
}

// 日期格式化
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
}

// 监听props变化
watch(() => props.sortBy, (newVal) => {
    sortBy.value = newVal
})

watch(() => props.sortDirection, (newVal) => {
    sortDirection.value = newVal
})
</script>

<style scoped>
.stock-table {
    @apply bg-white shadow overflow-hidden sm:rounded-lg;
}

.table-header {
    @apply px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200;
}

.controls {
    @apply flex items-center space-x-4;
}

.loading-state {
    @apply p-8;
}

.error-state {
    @apply m-4;
}

.table-container {
    @apply overflow-x-auto;
}

.empty-state {
    @apply border-t border-gray-200;
}

.pagination {
    @apply border-t border-gray-200;
}
</style>