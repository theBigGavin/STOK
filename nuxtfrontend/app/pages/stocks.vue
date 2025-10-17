<template>
    <div>
        <UDashboardPage>
            <UDashboardPanel grow>
                <UDashboardNavbar title="股票监控" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <UButton label="刷新数据" color="primary" variant="solid" icon="i-lucide-refresh-cw"
                            :loading="loading" @click="refreshAllData" />
                        <UButton label="批量刷新" color="neutral" variant="outline" icon="i-lucide-download"
                            @click="showBatchRefreshModal = true" />
                        <UButton label="导出数据" color="neutral" variant="outline" icon="i-lucide-file-text"
                            @click="exportData" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <!-- 筛选工具栏 -->
                    <UDashboardSection title="筛选条件" description="按市场、状态和关键词筛选股票">
                        <div class="bg-white rounded-lg border border-gray-200 p-4">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <!-- 市场筛选 -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">市场</label>
                                    <USelect v-model="filters.market" :options="marketOptions" placeholder="全部市场"
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
                                    <UInput v-model="filters.searchQuery" placeholder="输入股票代码或名称..."
                                        icon="i-lucide-search" :loading="loading" />
                                </div>
                            </div>

                            <!-- 筛选操作 -->
                            <div class="flex justify-between items-center mt-4">
                                <div class="text-sm text-gray-500">
                                    共 {{ filteredStocks.length }} 只股票
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
                        <!-- 股票列表区域 -->
                        <div class="xl:col-span-2">
                            <UDashboardSection title="股票列表" description="活跃股票列表，支持排序和筛选">
                                <div class="bg-white rounded-lg border border-gray-200">
                                    <!-- 加载状态 -->
                                    <div v-if="loading" class="flex justify-center py-8">
                                        <ULoadingIcon class="size-6 text-primary" />
                                        <span class="ml-2 text-gray-500">加载中...</span>
                                    </div>

                                    <!-- 错误状态 -->
                                    <div v-else-if="error" class="text-center py-8 text-red-500">
                                        <UIcon name="i-lucide-alert-circle" class="size-8 mb-2" />
                                        <p>{{ error }}</p>
                                        <UButton label="重试" color="primary" variant="solid" class="mt-4"
                                            @click="fetchStocks" />
                                    </div>

                                    <!-- 空状态 -->
                                    <div v-else-if="filteredStocks.length === 0" class="text-center py-8">
                                        <UIcon name="i-lucide-search" class="size-12 text-gray-400 mb-4" />
                                        <p class="text-gray-500">未找到匹配的股票</p>
                                        <UButton label="重置筛选" color="primary" variant="solid" class="mt-4"
                                            @click="resetFilters" />
                                    </div>

                                    <!-- 股票表格 -->
                                    <div v-else class="overflow-x-auto">
                                        <table class="min-w-full divide-y divide-gray-200">
                                            <thead class="bg-gray-50">
                                                <tr>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        股票代码
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        股票名称
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        市场
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        状态
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        创建时间
                                                    </th>
                                                    <th
                                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        操作
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-gray-200">
                                                <tr v-for="stock in filteredStocks" :key="stock.id"
                                                    class="hover:bg-gray-50">
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center gap-2">
                                                            <span class="font-mono font-semibold text-highlighted">
                                                                {{ stock.symbol }}
                                                            </span>
                                                            <UBadge v-if="stock.isActive" color="success"
                                                                variant="subtle" size="xs">
                                                                活跃
                                                            </UBadge>
                                                            <UBadge v-else color="neutral" variant="subtle" size="xs">
                                                                停用
                                                            </UBadge>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {{ stock.name }}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <UBadge :color="getMarketColor(stock.market)" variant="subtle">
                                                            {{ getMarketText(stock.market) }}
                                                        </UBadge>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {{ stock.isActive ? '活跃' : '停用' }}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {{ formatDate(stock.createdAt) }}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div class="flex gap-1">
                                                            <UButton icon="i-lucide-eye" color="neutral" variant="ghost"
                                                                size="sm" @click="selectStock(stock)" title="查看详情" />
                                                            <UButton icon="i-lucide-refresh-cw" color="neutral"
                                                                variant="ghost" size="sm"
                                                                @click="refreshStockData(stock.symbol)" title="刷新数据" />
                                                            <UButton icon="i-lucide-chart-line" color="primary"
                                                                variant="ghost" size="sm" @click="showChart(stock)"
                                                                title="查看图表" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <!-- 分页 -->
                                        <div v-if="pagination.total > pagination.limit"
                                            class="flex justify-between items-center p-4 border-t border-gray-200">
                                            <div class="text-sm text-gray-500">
                                                显示 {{ Math.min(pagination.skip + 1, pagination.total) }} - {{
                                                    Math.min(pagination.skip + pagination.limit, pagination.total) }} 条，共 {{
                                                    pagination.total }} 条
                                            </div>
                                            <UPagination v-model="pagination.currentPage" :page-count="pagination.limit"
                                                :total="pagination.total" @update:model-value="handlePageChange" />
                                        </div>
                                    </div>
                                </div>
                            </UDashboardSection>
                        </div>

                        <!-- 股票详情区域 -->
                        <div class="xl:col-span-1">
                            <UDashboardSection title="股票详情" description="选中股票的详细信息">
                                <div class="bg-white rounded-lg border border-gray-200 p-4">
                                    <div v-if="selectedStock" class="space-y-4">
                                        <!-- 股票基本信息 -->
                                        <div class="text-center">
                                            <h3 class="text-lg font-semibold text-highlighted">
                                                {{ selectedStock.symbol }}
                                            </h3>
                                            <p class="text-sm text-gray-500">{{ selectedStock.name }}</p>
                                        </div>

                                        <!-- 市场信息 -->
                                        <div class="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span class="text-gray-500">市场:</span>
                                                <UBadge :color="getMarketColor(selectedStock.market)" variant="subtle"
                                                    class="ml-2">
                                                    {{ getMarketText(selectedStock.market) }}
                                                </UBadge>
                                            </div>
                                            <div>
                                                <span class="text-gray-500">状态:</span>
                                                <UBadge :color="selectedStock.isActive ? 'success' : 'neutral'"
                                                    variant="subtle" class="ml-2">
                                                    {{ selectedStock.isActive ? '活跃' : '停用' }}
                                                </UBadge>
                                            </div>
                                        </div>

                                        <!-- 数据统计 -->
                                        <div class="border-t border-gray-200 pt-4">
                                            <h4 class="text-sm font-medium text-gray-700 mb-2">数据统计</h4>
                                            <div class="grid grid-cols-2 gap-3 text-sm">
                                                <div class="text-center p-2 bg-gray-50 rounded">
                                                    <div class="text-lg font-semibold text-highlighted">
                                                        {{ stockData.length }}
                                                    </div>
                                                    <div class="text-xs text-gray-500">数据记录</div>
                                                </div>
                                                <div class="text-center p-2 bg-gray-50 rounded">
                                                    <div class="text-lg font-semibold text-highlighted">
                                                        {{ latestPrice ? `¥${latestPrice.toFixed(2)}` : '--' }}
                                                    </div>
                                                    <div class="text-xs text-gray-500">最新价格</div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 操作按钮 -->
                                        <div class="flex gap-2">
                                            <UButton label="查看图表" color="primary" variant="solid" block
                                                @click="showChart(selectedStock)" />
                                            <UButton label="刷新数据" color="neutral" variant="outline" block
                                                @click="refreshStockData(selectedStock.symbol)" />
                                        </div>
                                    </div>

                                    <!-- 未选择股票时的提示 -->
                                    <div v-else class="text-center py-8">
                                        <UIcon name="i-lucide-info" class="size-12 text-gray-400 mb-4" />
                                        <p class="text-gray-500">请选择一只股票查看详情</p>
                                    </div>
                                </div>
                            </UDashboardSection>

                            <!-- 价格走势图 -->
                            <UDashboardSection title="价格走势" description="股票价格历史走势">
                                <div class="bg-white rounded-lg border border-gray-200 p-4">
                                    <div v-if="selectedStock && stockData.length > 0" class="h-64">
                                        <!-- 图表容器 -->
                                        <div class="w-full h-full">
                                            <StockPriceChart :data="stockData" :symbol="selectedStock.symbol" />
                                        </div>

                                        <!-- 时间范围选择 -->
                                        <div class="flex justify-center gap-2 mt-4">
                                            <UButton v-for="period in timePeriods" :key="period.value"
                                                :label="period.label"
                                                :color="selectedPeriod === period.value ? 'primary' : 'neutral'"
                                                variant="outline" size="sm" @click="changeTimePeriod(period.value)" />
                                        </div>
                                    </div>

                                    <div v-else class="text-center py-8">
                                        <UIcon name="i-lucide-chart-line" class="size-12 text-gray-400 mb-4" />
                                        <p class="text-gray-500">选择股票查看价格走势</p>
                                    </div>
                                </div>
                            </UDashboardSection>
                        </div>
                    </div>
                </UDashboardPanelContent>
            </UDashboardPanel>
        </UDashboardPage>

        <!-- 批量刷新模态框 -->
        <UModal v-model="showBatchRefreshModal">
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">批量刷新股票数据</h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost"
                            @click="showBatchRefreshModal = false" />
                    </div>
                </template>

                <div class="space-y-4">
                    <p class="text-sm text-gray-500">
                        选择要刷新数据的股票范围
                    </p>

                    <div class="grid grid-cols-2 gap-4">
                        <UButton label="刷新所有活跃股票" color="primary" variant="outline" @click="batchRefresh('active')" />
                        <UButton label="刷新选中股票" color="neutral" variant="outline" :disabled="!selectedStock"
                            @click="batchRefresh('selected')" />
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <UButton label="取消" color="neutral" variant="ghost" @click="showBatchRefreshModal = false" />
                        <UButton label="开始刷新" color="primary" variant="solid" :loading="batchLoading"
                            @click="startBatchRefresh" />
                    </div>
                </template>
            </UCard>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useStockStore } from '~/stores/stocks'
import type { StockInfo, StockDailyData } from '~/types/stocks'

// 组件定义
definePageMeta({
    title: '股票监控',
    description: '股票数据监控和管理页面'
})

// Store
const stockStore = useStockStore()

// 响应式数据
const loading = ref(false)
const error = ref<string | null>(null)
const selectedStock = ref<StockInfo | null>(null)
const stockData = ref<StockDailyData[]>([])
const showBatchRefreshModal = ref(false)
const batchLoading = ref(false)
const selectedPeriod = ref('1m')

// 筛选条件
const filters = ref({
    market: null as string | null,
    status: null as string | null,
    searchQuery: ''
})

// 分页配置
const pagination = ref({
    currentPage: 1,
    total: 0,
    skip: 0,
    limit: 50,
    hasMore: false
})

// 选项配置
const marketOptions = [
    { value: 'SH', label: '上海证券交易所' },
    { value: 'SZ', label: '深圳证券交易所' },
    { value: 'BJ', label: '北京证券交易所' },
    { value: 'HK', label: '香港交易所' }
]

const statusOptions = [
    { value: 'active', label: '活跃' },
    { value: 'inactive', label: '停用' }
]

const timePeriods = [
    { value: '1w', label: '1周' },
    { value: '1m', label: '1月' },
    { value: '3m', label: '3月' },
    { value: '1y', label: '1年' }
]

// 计算属性
const filteredStocks = computed(() => {
    return stockStore.filteredStocks
})

const latestPrice = computed(() => {
    if (stockData.value.length === 0) return null
    const latest = stockData.value[stockData.value.length - 1]
    return latest?.closePrice || null
})

// 方法
const fetchStocks = async () => {
    loading.value = true
    error.value = null
    try {
        await stockStore.fetchStocksCached({
            skip: pagination.value.skip,
            limit: pagination.value.limit,
            market: filters.value.market || undefined,
            activeOnly: filters.value.status === 'active'
        })
        pagination.value.total = stockStore.pagination.total
        pagination.value.hasMore = stockStore.pagination.hasMore
    } catch (err: any) {
        error.value = err.message || '加载股票列表失败'
    } finally {
        loading.value = false
    }
}

const selectStock = async (stock: StockInfo) => {
    selectedStock.value = stock
    await fetchStockData(stock.symbol)
}

const fetchStockData = async (symbol: string) => {
    try {
        const endDate = new Date().toISOString().split('T')[0] || ''
        let startDate = new Date()

        switch (selectedPeriod.value) {
            case '1w':
                startDate.setDate(startDate.getDate() - 7)
                break
            case '1m':
                startDate.setMonth(startDate.getMonth() - 1)
                break
            case '3m':
                startDate.setMonth(startDate.getMonth() - 3)
                break
            case '1y':
                startDate.setFullYear(startDate.getFullYear() - 1)
                break
        }

        const startDateStr = startDate.toISOString().split('T')[0] || ''
        const data = await stockStore.fetchStockDataCached(symbol, startDateStr, endDate)
        stockData.value = data || []
    } catch (err: any) {
        console.error('获取股票数据失败:', err)
    }
}

const refreshAllData = async () => {
    loading.value = true
    try {
        await stockStore.clearStockDataCache()
        await fetchStocks()
        if (selectedStock.value) {
            await fetchStockData(selectedStock.value.symbol)
        }
    } catch (err: any) {
        error.value = err.message || '刷新数据失败'
    } finally {
        loading.value = false
    }
}

const refreshStockData = async (symbol: string) => {
    try {
        await stockStore.refreshStockData(symbol)
        if (selectedStock.value?.symbol === symbol) {
            await fetchStockData(symbol)
        }
    } catch (err: any) {
        error.value = err.message || '刷新股票数据失败'
    }
}

const showChart = (stock: StockInfo) => {
    selectedStock.value = stock
    fetchStockData(stock.symbol)
}

const changeTimePeriod = (period: string) => {
    selectedPeriod.value = period
    if (selectedStock.value) {
        fetchStockData(selectedStock.value.symbol)
    }
}

const handlePageChange = (page: number) => {
    pagination.value.currentPage = page
    pagination.value.skip = (page - 1) * pagination.value.limit
    fetchStocks()
}

const resetFilters = () => {
    filters.value = {
        market: null,
        status: null,
        searchQuery: ''
    }
    stockStore.resetFilters()
    fetchStocks()
}

const applyFilters = () => {
    stockStore.setFilters({
        market: filters.value.market,
        activeOnly: filters.value.status === 'active',
        searchQuery: filters.value.searchQuery
    })
}

const getMarketColor = (market: string) => {
    switch (market) {
        case 'SH': return 'primary'
        case 'SZ': return 'success'
        case 'BJ': return 'warning'
        case 'HK': return 'error'
        default: return 'neutral'
    }
}

const getMarketText = (market: string) => {
    switch (market) {
        case 'SH': return '上证'
        case 'SZ': return '深证'
        case 'BJ': return '北证'
        case 'HK': return '港股'
        default: return market
    }
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
}

const batchRefresh = (type: 'active' | 'selected') => {
    console.log('批量刷新类型:', type)
    // 这里可以实现批量刷新逻辑
}

const startBatchRefresh = async () => {
    batchLoading.value = true
    try {
        // 实现批量刷新逻辑
        await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟延迟
        showBatchRefreshModal.value = false
    } catch (err: any) {
        error.value = err.message || '批量刷新失败'
    } finally {
        batchLoading.value = false
    }
}

const exportData = () => {
    // 实现数据导出逻辑
    console.log('导出数据')
}

// 生命周期
onMounted(() => {
    stockStore.initialize()
    fetchStocks()
})

// 监听筛选条件变化
watch(
    () => filters.value.searchQuery,
    () => {
        if (filters.value.searchQuery) {
            applyFilters()
        }
    }
)
</script>