<template>
    <div class="stock-table">
        <!-- 表格工具栏 -->
        <div class="table-toolbar" v-if="showToolbar">
            <div class="toolbar-left">
                <slot name="toolbar-left">
                    <span class="table-title" v-if="title">{{ title }}</span>
                    <span class="table-info" v-if="stocks.length > 0">
                        共 {{ stocks.length }} 只股票
                    </span>
                </slot>
            </div>
            <div class="toolbar-right">
                <slot name="toolbar-right">
                    <el-button :icon="Refresh" @click="handleRefresh" :loading="loading" size="small">
                        刷新
                    </el-button>
                    <el-button :icon="Download" @click="handleExport" size="small">
                        导出
                    </el-button>
                    <el-button :icon="Setting" @click="showColumnSettings = true" size="small">
                        列设置
                    </el-button>
                </slot>
            </div>
        </div>

        <!-- 股票表格 -->
        <el-table :data="displayStocks" v-loading="loading" :empty-text="emptyText" :row-class-name="getRowClassName"
            @row-click="handleRowClick" @sort-change="handleSortChange" @selection-change="handleSelectionChange"
            style="width: 100%" class="stock-data-table" :stripe="stripe" :border="border" :height="height"
            :max-height="maxHeight">
            <!-- 选择列 -->
            <el-table-column v-if="selectable" type="selection" width="55" align="center" />

            <!-- 股票代码 -->
            <el-table-column prop="symbol" label="股票代码" width="120" :sortable="sortable" fixed="left">
                <template #default="scope">
                    <span class="stock-symbol" :class="getSymbolClass(scope.row)">
                        {{ scope.row.symbol }}
                    </span>
                </template>
            </el-table-column>

            <!-- 股票名称 -->
            <el-table-column prop="name" label="股票名称" width="150" :sortable="sortable" show-overflow-tooltip>
                <template #default="scope">
                    <span class="stock-name">{{ scope.row.name }}</span>
                    <el-tag v-if="scope.row.market" size="small" effect="plain" class="market-tag">
                        {{ scope.row.market }}
                    </el-tag>
                </template>
            </el-table-column>

            <!-- 当前价格 -->
            <el-table-column prop="close_price" label="当前价格" width="120" :sortable="sortable" align="right">
                <template #default="scope">
                    <span :class="getPriceClass(scope.row)">
                        {{ formatPrice(scope.row.close_price) }}
                    </span>
                </template>
            </el-table-column>

            <!-- 涨跌幅 -->
            <el-table-column prop="change_percent" label="涨跌幅" width="120" :sortable="sortable" align="right">
                <template #default="scope">
                    <el-tag :type="getChangeTagType(scope.row.change_percent)" size="small" effect="light">
                        {{ formatChange(scope.row.change_percent) }}
                    </el-tag>
                </template>
            </el-table-column>

            <!-- 成交量 -->
            <el-table-column prop="volume" label="成交量" width="120" :sortable="sortable" align="right">
                <template #default="scope">
                    {{ formatVolume(scope.row.volume) }}
                </template>
            </el-table-column>

            <!-- 成交额 -->
            <el-table-column v-if="showTurnover" prop="turnover" label="成交额" width="140" :sortable="sortable"
                align="right">
                <template #default="scope">
                    {{ formatVolume(scope.row.turnover || 0) }}
                </template>
            </el-table-column>

            <!-- 最高价 -->
            <el-table-column v-if="showHighLow" prop="high_price" label="最高" width="100" :sortable="sortable"
                align="right">
                <template #default="scope">
                    {{ formatPrice(scope.row.high_price) }}
                </template>
            </el-table-column>

            <!-- 最低价 -->
            <el-table-column v-if="showHighLow" prop="low_price" label="最低" width="100" :sortable="sortable"
                align="right">
                <template #default="scope">
                    {{ formatPrice(scope.row.low_price) }}
                </template>
            </el-table-column>

            <!-- 开盘价 -->
            <el-table-column v-if="showOpen" prop="open_price" label="开盘" width="100" :sortable="sortable"
                align="right">
                <template #default="scope">
                    {{ formatPrice(scope.row.open_price) }}
                </template>
            </el-table-column>

            <!-- 交易信号 -->
            <el-table-column v-if="showSignal" prop="signal" label="交易信号" width="120" :sortable="sortable"
                align="center">
                <template #default="scope">
                    <el-tag :type="getSignalType(scope.row.signal)" size="small" effect="dark">
                        {{ getSignalText(scope.row.signal) }}
                    </el-tag>
                </template>
            </el-table-column>

            <!-- 置信度 -->
            <el-table-column v-if="showConfidence" prop="confidence" label="置信度" width="140" :sortable="sortable"
                align="center">
                <template #default="scope">
                    <div class="confidence-container">
                        <el-progress :percentage="scope.row.confidence || 0" :show-text="false" :stroke-width="6"
                            :status="getConfidenceStatus(scope.row.confidence)" class="confidence-progress" />
                        <span class="confidence-text">{{ scope.row.confidence || 0 }}%</span>
                    </div>
                </template>
            </el-table-column>

            <!-- 更新时间 -->
            <el-table-column prop="trade_date" label="更新时间" width="160" :sortable="sortable">
                <template #default="scope">
                    {{ formatDate(scope.row.trade_date) }}
                </template>
            </el-table-column>

            <!-- 操作列 -->
            <el-table-column v-if="showActions" label="操作" width="200" fixed="right" align="center">
                <template #default="scope">
                    <el-button type="primary" link size="small" @click.stop="handleView(scope.row)">
                        查看详情
                    </el-button>
                    <el-button type="success" link size="small" @click.stop="handleAnalyze(scope.row)">
                        分析
                    </el-button>
                    <el-button type="warning" link size="small" @click.stop="handleRefreshStock(scope.row)"
                        :loading="refreshingStocks.includes(scope.row.symbol)">
                        刷新
                    </el-button>
                </template>
            </el-table-column>

            <!-- 自定义列插槽 -->
            <slot />
        </el-table>

        <!-- 分页 -->
        <div class="table-pagination" v-if="showPagination">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>

        <!-- 列设置对话框 -->
        <el-dialog v-model="showColumnSettings" title="列设置" width="500px">
            <el-checkbox-group v-model="visibleColumns">
                <el-checkbox label="symbol">股票代码</el-checkbox>
                <el-checkbox label="name">股票名称</el-checkbox>
                <el-checkbox label="price">当前价格</el-checkbox>
                <el-checkbox label="change">涨跌幅</el-checkbox>
                <el-checkbox label="volume">成交量</el-checkbox>
                <el-checkbox label="turnover">成交额</el-checkbox>
                <el-checkbox label="highLow">最高/最低</el-checkbox>
                <el-checkbox label="open">开盘价</el-checkbox>
                <el-checkbox label="signal">交易信号</el-checkbox>
                <el-checkbox label="confidence">置信度</el-checkbox>
                <el-checkbox label="timestamp">更新时间</el-checkbox>
            </el-checkbox-group>
            <template #footer>
                <el-button @click="showColumnSettings = false">取消</el-button>
                <el-button type="primary" @click="applyColumnSettings">应用</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Refresh, Download, Setting } from '@element-plus/icons-vue'
import {
    formatPrice,
    formatChange,
    formatVolume,
    formatDate,
    getChangeTagType,
    getSignalType,
    getSignalText,
    getConfidenceStatus
} from '@/utils/stockUtils'
import type { StockDailyData } from '@/types/api'

interface Props {
    // 数据
    stocks: StockDailyData[]
    loading?: boolean
    // 表格配置
    title?: string
    emptyText?: string
    showToolbar?: boolean
    showPagination?: boolean
    selectable?: boolean
    sortable?: boolean | 'custom'
    stripe?: boolean
    border?: boolean
    height?: string | number
    maxHeight?: string | number
    // 列显示控制
    showTurnover?: boolean
    showHighLow?: boolean
    showOpen?: boolean
    showSignal?: boolean
    showConfidence?: boolean
    showActions?: boolean
    // 分页
    currentPage?: number
    pageSize?: number
    total?: number
}

interface Emits {
    (e: 'refresh'): void
    (e: 'export'): void
    (e: 'row-click', row: StockDailyData): void
    (e: 'view', row: StockDailyData): void
    (e: 'analyze', row: StockDailyData): void
    (e: 'refresh-stock', row: StockDailyData): void
    (e: 'selection-change', selection: StockDailyData[]): void
    (e: 'sort-change', sort: any): void
    (e: 'size-change', size: number): void
    (e: 'current-change', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
    stocks: () => [],
    loading: false,
    emptyText: '暂无数据',
    showToolbar: true,
    showPagination: false,
    selectable: false,
    sortable: true,
    stripe: true,
    border: false,
    showTurnover: true,
    showHighLow: true,
    showOpen: true,
    showSignal: true,
    showConfidence: true,
    showActions: true,
    currentPage: 1,
    pageSize: 20,
    total: 0
})

const emit = defineEmits<Emits>()

// 响应式数据
const showColumnSettings = ref(false)
const visibleColumns = ref<string[]>(['symbol', 'name', 'price', 'change', 'volume', 'timestamp'])
const refreshingStocks = ref<string[]>([])
const currentPage = ref(props.currentPage)
const pageSize = ref(props.pageSize)

// 计算属性
const displayStocks = computed(() => {
    if (!props.showPagination) {
        return props.stocks
    }

    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return props.stocks.slice(start, end)
})

// 监听分页属性变化
watch(() => props.currentPage, (newValue) => {
    currentPage.value = newValue
})

watch(() => props.pageSize, (newValue) => {
    pageSize.value = newValue
})

watch(() => props.total, (newValue) => {
    // 可以在这里处理总记录数变化
})

// 方法

// 获取价格样式
const getPriceClass = (row: StockDailyData) => {
    const change = row.change_percent || 0
    return change > 0 ? 'price-up' : change < 0 ? 'price-down' : 'price-unchanged'
}

// 获取股票代码样式
const getSymbolClass = (row: StockDailyData) => {
    return `symbol-${row.symbol.toLowerCase()}`
}

// 获取行类名
const getRowClassName = ({ row }: { row: StockDailyData }) => {
    const classes = []
    if (row.change_percent && row.change_percent > 5) {
        classes.push('row-high-increase')
    } else if (row.change_percent && row.change_percent < -5) {
        classes.push('row-high-decrease')
    }
    return classes.join(' ')
}

// 事件处理
const handleRefresh = () => {
    emit('refresh')
}

const handleExport = () => {
    emit('export')
}

const handleRowClick = (row: StockDailyData) => {
    emit('row-click', row)
}

const handleView = (row: StockDailyData) => {
    emit('view', row)
}

const handleAnalyze = (row: StockDailyData) => {
    emit('analyze', row)
}

const handleRefreshStock = (row: StockDailyData) => {
    refreshingStocks.value.push(row.symbol)
    emit('refresh-stock', row)
    // 模拟刷新完成
    setTimeout(() => {
        const index = refreshingStocks.value.indexOf(row.symbol)
        if (index > -1) {
            refreshingStocks.value.splice(index, 1)
        }
    }, 2000)
}

const handleSelectionChange = (selection: StockDailyData[]) => {
    emit('selection-change', selection)
}

const handleSortChange = (sort: any) => {
    emit('sort-change', sort)
}

const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    emit('size-change', size)
}

const handleCurrentChange = (page: number) => {
    currentPage.value = page
    emit('current-change', page)
}

const applyColumnSettings = () => {
    showColumnSettings.value = false
    // 这里可以保存列设置到本地存储
}

// 暴露方法给父组件
defineExpose({
    clearSelection: () => {
        // 这里可以添加清除选择逻辑
    },
    getSelectedRows: (): StockDailyData[] => {
        // 这里可以返回选中的行
        return []
    }
})
</script>

<style scoped>
.stock-table {
    width: 100%;
}

.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.table-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.table-info {
    font-size: 14px;
    color: #909399;
}

.toolbar-right {
    display: flex;
    gap: 8px;
}

.stock-data-table {
    border-radius: 8px;
    overflow: hidden;
}

.stock-symbol {
    font-weight: bold;
    color: #409eff;
}

.stock-name {
    margin-right: 8px;
}

.market-tag {
    margin-left: 4px;
}

.price-up {
    color: #f56c6c;
    font-weight: bold;
}

.price-down {
    color: #67c23a;
    font-weight: bold;
}

.price-unchanged {
    color: #606266;
}

.confidence-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.confidence-progress {
    flex: 1;
}

.confidence-text {
    font-size: 12px;
    color: #909399;
    min-width: 30px;
}

.table-pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

/* 行样式 */
:deep(.row-high-increase) {
    background-color: rgba(245, 108, 108, 0.05) !important;
}

:deep(.row-high-decrease) {
    background-color: rgba(103, 194, 58, 0.05) !important;
}

:deep(.el-table .el-table__row:hover) {
    background-color: #f5f7fa;
}

:deep(.el-table .el-table__row--striped:hover) {
    background-color: #f5f7fa;
}
</style>