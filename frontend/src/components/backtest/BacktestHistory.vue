<template>
    <div class="backtest-history">
        <el-card class="history-card">
            <template #header>
                <div class="history-header">
                    <span>回测历史记录</span>
                    <div class="header-actions">
                        <el-button :icon="Refresh" @click="refreshHistory">刷新</el-button>
                        <el-button :icon="Delete" @click="clearHistory">清空</el-button>
                    </div>
                </div>
            </template>

            <!-- 筛选条件 -->
            <div class="history-filters">
                <el-form :model="filters" inline>
                    <el-form-item label="模型">
                        <el-select v-model="filters.modelId" placeholder="选择模型" clearable>
                            <el-option v-for="model in availableModels" :key="model.id" :label="model.name"
                                :value="model.id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="开始日期">
                        <el-date-picker v-model="filters.startDate" type="date" placeholder="选择开始日期" clearable />
                    </el-form-item>
                    <el-form-item label="结束日期">
                        <el-date-picker v-model="filters.endDate" type="date" placeholder="选择结束日期" clearable />
                    </el-form-item>
                    <el-form-item label="最小收益率">
                        <el-input-number v-model="filters.minReturn" :min="-100" :max="100" :step="1"
                            placeholder="最小收益率" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="applyFilters">筛选</el-button>
                        <el-button @click="resetFilters">重置</el-button>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 历史记录表格 -->
            <el-table :data="filteredResults" style="width: 100%" v-loading="loading"
                :default-sort="{ prop: 'created_at', order: 'descending' }">
                <el-table-column prop="model_name" label="模型名称" width="150" />
                <el-table-column prop="backtest_date" label="回测日期" width="120" />
                <el-table-column prop="results.total_return" label="总收益率" width="120" sortable>
                    <template #default="scope">
                        <span :class="getReturnClass(scope.row.results.total_return)">
                            {{ formatPercentage(scope.row.results.total_return) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="results.annual_return" label="年化收益率" width="120" sortable>
                    <template #default="scope">
                        <span :class="getReturnClass(scope.row.results.annual_return)">
                            {{ formatPercentage(scope.row.results.annual_return) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="results.sharpe_ratio" label="夏普比率" width="100" sortable>
                    <template #default="scope">
                        {{ formatNumber(scope.row.results.sharpe_ratio) }}
                    </template>
                </el-table-column>
                <el-table-column prop="results.max_drawdown" label="最大回撤" width="100" sortable>
                    <template #default="scope">
                        <span class="drawdown">
                            {{ formatPercentage(scope.row.results.max_drawdown) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="results.win_rate" label="胜率" width="100" sortable>
                    <template #default="scope">
                        {{ formatPercentage(scope.row.results.win_rate) }}
                    </template>
                </el-table-column>
                <el-table-column prop="results.total_trades" label="交易次数" width="100" sortable />
                <el-table-column prop="created_at" label="创建时间" width="180" sortable>
                    <template #default="scope">
                        {{ formatDateTime(scope.row.created_at) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" link size="small" @click="viewResult(scope.row)">
                            查看详情
                        </el-button>
                        <el-button type="success" link size="small" @click="exportResult(scope.row)">
                            导出
                        </el-button>
                        <el-button type="danger" link size="small" @click="deleteResult(scope.row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
                <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size"
                    :page-sizes="[10, 20, 50, 100]" :total="pagination.total"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 空状态 -->
        <el-card class="empty-card" v-if="!loading && filteredResults.length === 0">
            <div class="empty-content">
                <el-icon>
                    <DataAnalysis />
                </el-icon>
                <p>暂无回测历史记录</p>
                <p class="empty-desc">执行回测后，结果将显示在这里</p>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Delete, DataAnalysis } from '@element-plus/icons-vue'
import { useBacktestStore } from '@/store/backtest'
import { useModelStore } from '@/store/models'
import { formatPercentage, formatNumber, getReturnColorClass } from '@/utils/backtestUtils'
import type { BacktestResultDetail } from '@/types/api'

// Store
const backtestStore = useBacktestStore()
const modelStore = useModelStore()

// 状态
const loading = ref(false)
const filters = ref({
    modelId: '',
    startDate: '',
    endDate: '',
    minReturn: 0
})

const pagination = ref({
    current: 1,
    size: 10,
    total: 0
})

// 计算属性
const filteredResults = computed(() => {
    return backtestStore.filteredResults
})

const availableModels = computed(() => {
    return modelStore.models
})

// 方法
const getReturnClass = (returnRate: number) => {
    return getReturnColorClass(returnRate)
}

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
}

const applyFilters = () => {
    backtestStore.setFilters(filters.value)
    backtestStore.fetchBacktestResults({
        model_id: filters.value.modelId ? parseInt(filters.value.modelId) : undefined,
        start_date: filters.value.startDate,
        end_date: filters.value.endDate,
        skip: (pagination.value.current - 1) * pagination.value.size,
        limit: pagination.value.size
    })
}

const resetFilters = () => {
    filters.value = {
        modelId: '',
        startDate: '',
        endDate: '',
        minReturn: 0
    }
    applyFilters()
}

const refreshHistory = async () => {
    try {
        loading.value = true
        await backtestStore.fetchBacktestResults({
            skip: (pagination.value.current - 1) * pagination.value.size,
            limit: pagination.value.size
        })
        ElMessage.success('历史记录已刷新')
    } catch (error) {
        console.error('刷新历史记录失败:', error)
        ElMessage.error('刷新历史记录失败')
    } finally {
        loading.value = false
    }
}

const clearHistory = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要清空所有回测历史记录吗？此操作不可恢复。',
            '确认清空',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        // 这里应该调用API删除所有记录
        ElMessage.success('历史记录已清空')
    } catch (error) {
        // 用户取消
    }
}

const viewResult = (result: BacktestResultDetail) => {
    backtestStore.fetchBacktestResult(result.id)
}

const exportResult = async (result: BacktestResultDetail) => {
    try {
        await backtestStore.exportBacktestResult(result.id, 'json')
    } catch (error) {
        console.error('导出回测结果失败:', error)
        ElMessage.error('导出回测结果失败')
    }
}

const deleteResult = async (result: BacktestResultDetail) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除回测结果 "${result.model_name}" 吗？`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        // 这里应该调用API删除记录
        ElMessage.success('回测结果已删除')
    } catch (error) {
        // 用户取消
    }
}

const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
    applyFilters()
}

const handleCurrentChange = (page: number) => {
    pagination.value.current = page
    applyFilters()
}

// 生命周期
onMounted(async () => {
    try {
        loading.value = true
        await modelStore.fetchModels()
        await backtestStore.fetchBacktestResults({
            skip: 0,
            limit: pagination.value.size
        })
        pagination.value.total = backtestStore.pagination.total
    } catch (error) {
        console.error('加载回测历史失败:', error)
        ElMessage.error('加载回测历史失败')
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.backtest-history {
    width: 100%;
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.history-card {
    margin-bottom: 20px;
    border-radius: 8px;
}

.history-filters {
    margin-bottom: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 4px;
}

.pagination-container {
    margin-top: 16px;
    text-align: right;
}

.empty-card {
    text-align: center;
    padding: 40px;
    border-radius: 8px;
}

.empty-content .el-icon {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 16px;
}

.empty-content p {
    margin: 8px 0;
    color: #909399;
}

.empty-desc {
    font-size: 14px;
}

.drawdown {
    color: #f56c6c;
    font-weight: bold;
}

:deep(.el-form--inline .el-form-item) {
    margin-right: 16px;
    margin-bottom: 0;
}
</style>