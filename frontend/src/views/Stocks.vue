<template>
    <div class="stocks">
        <div class="page-header">
            <h1>股票监控</h1>
            <p>实时监控股票价格和交易信号</p>
        </div>

        <!-- 搜索组件 -->
        <el-card class="search-card">
            <template #header>
                <div class="card-header">
                    <span>股票搜索</span>
                </div>
            </template>

            <StockSearch v-model="filterForm.symbol" :placeholder="'输入股票代码或名称搜索...'" :show-history="true"
                :show-hot="true" @select="handleStockSelect" @search="handleStockSearch" @change="handleSearch" />
        </el-card>

        <!-- 筛选条件 -->
        <el-card class="filter-card">
            <el-form :model="filterForm" inline>
                <el-form-item label="行业">
                    <el-select v-model="filterForm.industry" placeholder="选择行业" clearable>
                        <el-option label="科技" value="tech" />
                        <el-option label="金融" value="finance" />
                        <el-option label="医疗" value="healthcare" />
                        <el-option label="消费" value="consumer" />
                        <el-option label="能源" value="energy" />
                    </el-select>
                </el-form-item>
                <el-form-item label="信号类型">
                    <el-select v-model="filterForm.signal" placeholder="选择信号" clearable>
                        <el-option label="买入" value="BUY" />
                        <el-option label="卖出" value="SELL" />
                        <el-option label="持有" value="HOLD" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 股票列表表格 -->
        <StockTable :stocks="tableData" :loading="loading" title="股票列表" :show-toolbar="true" :show-pagination="true"
            :selectable="true" :current-page="pagination.current" :page-size="pagination.size" :total="pagination.total"
            @refresh="refreshData" @export="handleExport" @view="viewDetails" @analyze="analyzeStock"
            @refresh-stock="refreshStock" @selection-change="handleSelectionChange" @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { useStocksStore } from '@/store/stocks'
import StockSearch from '@/components/stocks/StockSearch.vue'
import StockTable from '@/components/stocks/StockTable.vue'
import type { Stock, StockDailyData } from '@/types/api'

const stocksStore = useStocksStore()

// 筛选表单
const filterForm = reactive({
    symbol: '',
    industry: '',
    signal: '',
})

// 分页配置
const pagination = reactive({
    current: 1,
    size: 20,
    total: 0,
})

// 加载状态
const loading = ref(false)

// 选中的股票
const selectedStocks = ref<StockDailyData[]>([])

// 计算属性 - 转换股票数据为表格格式
const tableData = computed(() => {
    return stocksStore.stockList.map(stock => ({
        ...stock,
        close_price: 0, // 这里需要从API获取实时价格
        change_percent: 0, // 这里需要计算涨跌幅
        volume: 0, // 这里需要从API获取成交量
        signal: 'HOLD', // 这里需要从决策引擎获取信号
        confidence: 0 // 这里需要从决策引擎获取置信度
    }))
})

// 搜索处理
const handleSearch = async () => {
    loading.value = true
    try {
        await stocksStore.fetchStocks({
            skip: (pagination.current - 1) * pagination.size,
            limit: pagination.size
        })
        pagination.total = stocksStore.getPagination.total
    } catch (error) {
        console.error('搜索股票失败:', error)
    } finally {
        loading.value = false
    }
}

// 重置搜索
const handleReset = () => {
    Object.assign(filterForm, {
        symbol: '',
        industry: '',
        signal: '',
    })
    stocksStore.updateFilters({
        symbol: '',
        market: '',
        industry: '',
        activeOnly: true
    })
    handleSearch()
}

// 刷新数据
const refreshData = async () => {
    loading.value = true
    try {
        await stocksStore.fetchStocks({
            skip: (pagination.current - 1) * pagination.size,
            limit: pagination.size
        })
    } catch (error) {
        console.error('刷新数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 查看详情
const viewDetails = (stock: StockDailyData) => {
    console.log('查看股票详情:', stock)
    // 这里可以跳转到详情页面或打开弹窗
    // 例如: router.push(`/stocks/${stock.symbol}`)
}

// 分析股票
const analyzeStock = (stock: StockDailyData) => {
    console.log('分析股票:', stock)
    // 这里可以跳转到分析页面
}

// 刷新单个股票
const refreshStock = async (stock: StockDailyData) => {
    try {
        await stocksStore.refreshStockData(stock.symbol)
        // 刷新后重新加载列表
        await stocksStore.fetchStocks()
    } catch (error) {
        console.error(`刷新股票 ${stock.symbol} 失败:`, error)
    }
}

// 处理股票选择
const handleStockSelect = (stock: Stock) => {
    console.log('选择股票:', stock)
    // 这里可以跳转到详情页面
    viewDetails(stock as any)
}

// 处理搜索
const handleStockSearch = (query: string) => {
    console.log('搜索股票:', query)
    filterForm.symbol = query
    handleSearch()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    stocksStore.updatePagination(1, size)
    handleSearch()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
    pagination.current = page
    stocksStore.updatePagination(page)
    handleSearch()
}

// 处理选择变化
const handleSelectionChange = (selection: StockDailyData[]) => {
    selectedStocks.value = selection
}

// 导出数据
const handleExport = () => {
    console.log('导出选中的股票:', selectedStocks.value)
    // 这里可以实现数据导出逻辑
}

onMounted(() => {
    // 初始化数据
    handleSearch()
})
</script>

<style scoped>
.stocks {
    padding: 0;
}

.page-header {
    margin-bottom: 24px;
}

.page-header h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #303133;
}

.page-header p {
    margin: 0;
    color: #909399;
    font-size: 14px;
}

.filter-card {
    margin-bottom: 24px;
    border-radius: 8px;
}

.stocks-table {
    border-radius: 8px;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pagination {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
}

.price-up {
    color: #f56c6c;
    font-weight: bold;
}

.price-down {
    color: #67c23a;
    font-weight: bold;
}
</style>