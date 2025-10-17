<template>
    <div class="models">
        <div class="page-header">
            <h1>模型管理</h1>
            <p>机器学习模型配置和性能监控</p>
        </div>

        <!-- 模型统计 -->
        <el-row :gutter="20" class="model-stats">
            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon" style="background-color: #409eff;">
                            <el-icon>
                                <Cpu />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ modelStats.total }}</div>
                            <div class="stat-label">总模型数</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon" style="background-color: #67c23a;">
                            <el-icon>
                                <Check />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ modelStats.active }}</div>
                            <div class="stat-label">活跃模型</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon" style="background-color: #e6a23c;">
                            <el-icon>
                                <TrendCharts />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ modelTypes.length }}</div>
                            <div class="stat-label">模型类型</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon" style="background-color: #909399;">
                            <el-icon>
                                <DataAnalysis />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ getAvgAccuracy() }}%</div>
                            <div class="stat-label">平均准确率</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 搜索和筛选 -->
        <el-card class="search-filter">
            <el-row :gutter="20" align="middle">
                <el-col :span="8">
                    <el-input v-model="searchQuery" placeholder="搜索模型名称、类型或描述" :prefix-icon="Search" clearable
                        @clear="handleSearchClear" @input="handleSearch" />
                </el-col>
                <el-col :span="6">
                    <el-select v-model="filterType" placeholder="选择模型类型" clearable @change="handleFilterChange">
                        <el-option v-for="type in modelTypes" :key="type" :label="type" :value="type" />
                    </el-select>
                </el-col>
                <el-col :span="10" class="filter-actions">
                    <el-button-group>
                        <el-button :type="activeFilter === 'all' ? 'primary' : ''" @click="setActiveFilter('all')">
                            全部
                        </el-button>
                        <el-button :type="activeFilter === 'active' ? 'primary' : ''"
                            @click="setActiveFilter('active')">
                            活跃
                        </el-button>
                        <el-button :type="activeFilter === 'inactive' ? 'primary' : ''"
                            @click="setActiveFilter('inactive')">
                            停用
                        </el-button>
                    </el-button-group>
                </el-col>
            </el-row>
        </el-card>

        <!-- 模型列表 -->
        <el-card class="models-table">
            <template #header>
                <div class="table-header">
                    <span>模型列表 ({{ filteredModels.length }})</span>
                    <div class="header-actions">
                        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
                            新建模型
                        </el-button>
                        <el-button :icon="Refresh" @click="refreshModels">
                            刷新
                        </el-button>
                        <el-button :icon="Download" @click="exportModels">
                            导出
                        </el-button>
                    </div>
                </div>
            </template>

            <el-table :data="displayedModels" v-loading="loading" style="width: 100%">
                <el-table-column prop="name" label="模型名称" width="200" />
                <el-table-column prop="model_type" label="模型类型" width="150">
                    <template #default="scope">
                        <el-tag :type="getModelTypeTag(scope.row.model_type)">
                            {{ scope.row.model_type }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="准确率" width="120">
                    <template #default="scope">
                        <el-progress v-if="scope.row.performance_metrics?.accuracy"
                            :percentage="Math.round(scope.row.performance_metrics.accuracy * 100)" :show-text="false"
                            :stroke-width="8" :status="getAccuracyStatus(scope.row.performance_metrics.accuracy)" />
                        <span style="margin-left: 8px">
                            {{ scope.row.performance_metrics?.accuracy ?
                                Math.round(scope.row.performance_metrics.accuracy * 100) + '%' : 'N/A' }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="总收益" width="120">
                    <template #default="scope">
                        <span :class="getReturnClass(scope.row.performance_metrics?.total_return)">
                            {{ scope.row.performance_metrics?.total_return ? (scope.row.performance_metrics.total_return
                                * 100).toFixed(2) + '%' : 'N/A' }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="夏普比率" width="120">
                    <template #default="scope">
                        <span>
                            {{ scope.row.performance_metrics?.sharpe_ratio ?
                                scope.row.performance_metrics.sharpe_ratio.toFixed(2) : 'N/A' }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="120">
                    <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.is_active)" size="small">
                            {{ getStatusText(scope.row.is_active) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="updated_at" label="最后更新" width="180">
                    <template #default="scope">
                        {{ formatDate(scope.row.updated_at) }}
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                <el-table-column label="操作" width="240" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" link size="small" @click="viewModelDetail(scope.row)">
                            详情
                        </el-button>
                        <el-button type="success" link size="small" @click="toggleModelStatus(scope.row)">
                            {{ scope.row.is_active ? '停用' : '启用' }}
                        </el-button>
                        <el-button type="warning" link size="small" @click="runBacktest(scope.row)">
                            回测
                        </el-button>
                        <el-dropdown @command="handleCommand($event, scope.row)">
                            <el-button type="info" link size="small">
                                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                                    <el-dropdown-item command="performance">性能分析</el-dropdown-item>
                                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size"
                    :total="filteredModels.length" :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 创建模型对话框 -->
        <ModelCreate v-model="showCreateDialog" @success="handleCreateSuccess" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
    Plus,
    Refresh,
    Download,
    Search,
    ArrowDown,
    Cpu,
    Check,
    TrendCharts,
    DataAnalysis
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useModelStore } from '@/store/models'
import type { BacktestModel } from '@/types/api'
import {
    ModelCreate,
    ModelDetail,
    ModelBacktest
} from '@/components/models'

// Store
const modelStore = useModelStore()

// 响应式数据
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showBacktestDialog = ref(false)
const selectedModel = ref<BacktestModel | null>(null)
const searchQuery = ref('')
const filterType = ref('')
const activeFilter = ref('all')

// 分页配置
const pagination = reactive({
    current: 1,
    size: 10,
    total: 0,
})

// 计算属性
const modelStats = computed(() => modelStore.modelStats)
const modelTypes = computed(() => modelStore.modelTypes)
const loading = computed(() => modelStore.loading)

const filteredModels = computed(() => {
    let filtered = modelStore.filteredModels

    // 状态过滤
    if (activeFilter.value === 'active') {
        filtered = filtered.filter((model: BacktestModel) => model.is_active)
    } else if (activeFilter.value === 'inactive') {
        filtered = filtered.filter((model: BacktestModel) => !model.is_active)
    }

    return filtered
})

const displayedModels = computed(() => {
    const start = (pagination.current - 1) * pagination.size
    const end = start + pagination.size
    return filteredModels.value.slice(start, end)
})

// 方法
const getAvgAccuracy = () => {
    const modelsWithAccuracy = modelStore.models.filter(
        (model: BacktestModel) => model.performance_metrics?.accuracy
    )
    if (modelsWithAccuracy.length === 0) return 0

    const totalAccuracy = modelsWithAccuracy.reduce(
        (sum: number, model: BacktestModel) => sum + (model.performance_metrics!.accuracy * 100), 0
    )
    return Math.round(totalAccuracy / modelsWithAccuracy.length)
}

const getAccuracyStatus = (accuracy: number) => {
    const percentage = accuracy * 100
    if (percentage >= 80) return 'success'
    if (percentage >= 70) return 'warning'
    return 'exception'
}

const getReturnClass = (returnValue?: number) => {
    if (!returnValue) return ''
    return returnValue > 0 ? 'positive-return' : 'negative-return'
}

const getModelTypeTag = (type: string) => {
    const typeMap: Record<string, string> = {
        '技术指标': '',
        '机器学习': 'success',
        '深度学习': 'warning',
        '基本面': 'info',
        '混合': 'danger'
    }
    return typeMap[type] || ''
}

const getStatusType = (isActive: boolean) => {
    return isActive ? 'success' : 'info'
}

const getStatusText = (isActive: boolean) => {
    return isActive ? '活跃' : '停用'
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
}

const handleSearch = () => {
    modelStore.setSearchQuery(searchQuery.value)
    pagination.current = 1
}

const handleSearchClear = () => {
    searchQuery.value = ''
    modelStore.setSearchQuery('')
    pagination.current = 1
}

const handleFilterChange = () => {
    modelStore.setFilterType(filterType.value)
    pagination.current = 1
}

const setActiveFilter = (filter: string) => {
    activeFilter.value = filter
    pagination.current = 1
}

const refreshModels = async () => {
    try {
        await modelStore.fetchModels()
        ElMessage.success('模型列表已刷新')
    } catch (error) {
        ElMessage.error('刷新失败')
    }
}

const viewModelDetail = (model: BacktestModel) => {
    console.log('查看模型详情:', model)
    // 这里可以打开详情弹窗或跳转到详情页面
}

const toggleModelStatus = async (model: BacktestModel) => {
    try {
        await modelStore.toggleModelStatus(model.id, !model.is_active)
        ElMessage.success(`模型已${!model.is_active ? '启用' : '停用'}`)
    } catch (error) {
        ElMessage.error('操作失败')
    }
}

const runBacktest = (model: BacktestModel) => {
    console.log('运行回测:', model)
    // 这里可以打开回测对话框
}

const handleCommand = (command: string, model: BacktestModel) => {
    switch (command) {
        case 'edit':
            console.log('编辑模型:', model)
            break
        case 'performance':
            console.log('性能分析:', model)
            break
        case 'delete':
            handleDeleteModel(model)
            break
    }
}

const handleDeleteModel = async (model: BacktestModel) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除模型 "${model.name}" 吗？此操作不可恢复。`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        await modelStore.removeModel(model.id)
        ElMessage.success('模型删除成功')
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

const exportModels = () => {
    console.log('导出模型数据')
    // 这里可以实现导出功能
}

const handleCreateSuccess = () => {
    showCreateDialog.value = false
    refreshModels()
}

const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
}

const handleCurrentChange = (page: number) => {
    pagination.current = page
}

// 生命周期
onMounted(() => {
    modelStore.fetchModels()
})
</script>

<style scoped>
.models {
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

.model-stats {
    margin-bottom: 24px;
}

.stat-card {
    border-radius: 8px;
}

.stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.stat-icon .el-icon {
    font-size: 24px;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    line-height: 1;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 14px;
    color: #909399;
}

.search-filter {
    margin-bottom: 24px;
    border-radius: 8px;
}

.filter-actions {
    display: flex;
    justify-content: flex-end;
}

.models-table {
    border-radius: 8px;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.pagination {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
}

.positive-return {
    color: #67c23a;
    font-weight: 500;
}

.negative-return {
    color: #f56c6c;
    font-weight: 500;
}
</style>