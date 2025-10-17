<template>
    <div class="decision-table">
        <!-- 表格操作栏 -->
        <div class="table-toolbar">
            <div class="toolbar-left">
                <el-button type="primary" :icon="Plus" @click="$emit('generate')">
                    生成决策
                </el-button>
                <el-button :icon="Refresh" @click="handleRefresh" :loading="loading">
                    刷新
                </el-button>
                <el-button :icon="Download" @click="handleExport">
                    导出
                </el-button>
            </div>

            <div class="toolbar-right">
                <el-button v-if="selectedDecisions.length > 0" type="danger" :icon="Delete" @click="handleBatchDelete">
                    批量删除 ({{ selectedDecisions.length }})
                </el-button>

                <el-button-group>
                    <el-button :type="viewMode === 'table' ? 'primary' : ''" :icon="Grid" @click="viewMode = 'table'">
                        表格
                    </el-button>
                    <el-button :type="viewMode === 'card' ? 'primary' : ''" :icon="Collection"
                        @click="viewMode = 'card'">
                        卡片
                    </el-button>
                </el-button-group>
            </div>
        </div>

        <!-- 表格视图 -->
        <div v-if="viewMode === 'table'" class="table-container">
            <el-table :data="displayedDecisions" v-loading="loading" @selection-change="handleSelectionChange"
                @sort-change="handleSortChange" :default-sort="{ prop: sortConfig.field, order: sortConfig.order }"
                style="width: 100%">
                <el-table-column type="selection" width="55" />

                <el-table-column prop="symbol" label="股票代码" width="120" sortable="custom">
                    <template #default="scope">
                        <div class="symbol-cell">
                            <span class="symbol-text">{{ scope.row.symbol }}</span>
                            <el-tag v-if="isNewDecision(scope.row)" type="success" size="small">
                                新
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="final_decision.decision" label="决策" width="100" sortable="custom">
                    <template #default="scope">
                        <el-tag :type="getDecisionType(scope.row.final_decision.decision)" size="small">
                            {{ getDecisionText(scope.row.final_decision.decision) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column prop="final_decision.confidence" label="置信度" width="120" sortable="custom">
                    <template #default="scope">
                        <div class="confidence-cell">
                            <el-progress :percentage="scope.row.final_decision.confidence" :show-text="false"
                                :stroke-width="8" :status="getConfidenceStatus(scope.row.final_decision.confidence)" />
                            <span class="confidence-text">{{ scope.row.final_decision.confidence }}%</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="risk_assessment.risk_level" label="风险等级" width="100" sortable="custom">
                    <template #default="scope">
                        <el-tag :type="getRiskType(scope.row.risk_assessment.risk_level)" size="small">
                            {{ getRiskText(scope.row.risk_assessment.risk_level) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column prop="final_decision.vote_summary" label="投票分布" width="180">
                    <template #default="scope">
                        <div class="vote-summary">
                            <div class="vote-item buy">
                                <span class="vote-count">{{ scope.row.final_decision.vote_summary.BUY }}</span>
                                <span class="vote-label">买</span>
                            </div>
                            <div class="vote-item sell">
                                <span class="vote-count">{{ scope.row.final_decision.vote_summary.SELL }}</span>
                                <span class="vote-label">卖</span>
                            </div>
                            <div class="vote-item hold">
                                <span class="vote-count">{{ scope.row.final_decision.vote_summary.HOLD }}</span>
                                <span class="vote-label">持</span>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="timestamp" label="生成时间" width="180" sortable="custom">
                    <template #default="scope">
                        {{ formatDateTime(scope.row.timestamp) }}
                    </template>
                </el-table-column>

                <el-table-column prop="trade_date" label="交易日期" width="120" sortable="custom">
                    <template #default="scope">
                        {{ formatDate(scope.row.trade_date) }}
                    </template>
                </el-table-column>

                <el-table-column label="质量评分" width="120" sortable="custom">
                    <template #default="scope">
                        <div class="quality-score">
                            <el-rate :model-value="getQualityScore(scope.row)" disabled :max="5"
                                :colors="['#99A9BF', '#F7BA2A', '#FF9900']" />
                            <span class="score-text">{{ getQualityScore(scope.row) }}/5</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" link size="small" @click="handleViewDetail(scope.row)">
                            详情
                        </el-button>
                        <el-button type="success" link size="small" @click="handleExecute(scope.row)">
                            执行
                        </el-button>
                        <el-button type="warning" link size="small" @click="handleRegenerate(scope.row)">
                            重新生成
                        </el-button>
                        <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size"
                    :total="pagination.total" :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>
        </div>

        <!-- 卡片视图 -->
        <div v-else class="card-container">
            <el-row :gutter="16">
                <el-col v-for="decision in displayedDecisions" :key="decision.symbol + decision.timestamp" :xs="24"
                    :sm="12" :md="8" :lg="6">
                    <DecisionCard :decision="decision" @view="handleViewDetail" @execute="handleExecute"
                        @regenerate="handleRegenerate" @delete="handleDelete" />
                </el-col>
            </el-row>

            <!-- 卡片视图分页 -->
            <div class="pagination">
                <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size"
                    :total="pagination.total" :page-sizes="[8, 16, 24, 32]"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>
        </div>

        <!-- 批量操作确认 -->
        <el-dialog v-model="showBatchDeleteConfirm" title="确认批量删除" width="400px">
            <span>确定要删除选中的 {{ selectedDecisions.length }} 个决策吗？此操作不可恢复。</span>
            <template #footer>
                <el-button @click="showBatchDeleteConfirm = false">取消</el-button>
                <el-button type="danger" @click="confirmBatchDelete">确定删除</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Plus,
    Refresh,
    Download,
    Delete,
    Grid,
    Collection
} from '@element-plus/icons-vue'
import { useDecisionStore } from '@/store/decisions'
import {
    getDecisionText,
    getDecisionColor,
    getRiskLevelText,
    calculateDecisionQuality,
    formatDecisionTime
} from '@/utils/decisionUtils'
import DecisionCard from './DecisionCard.vue'
import type { DecisionResponse } from '@/types/api'

// 事件定义
const emit = defineEmits<{
    generate: []
    view: [decision: DecisionResponse]
    execute: [decision: DecisionResponse]
    regenerate: [decision: DecisionResponse]
    delete: [decision: DecisionResponse]
}>()

// Props
interface Props {
    decisions: DecisionResponse[]
    loading?: boolean
    showPagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    decisions: () => [],
    loading: false,
    showPagination: true
})

// Store
const decisionStore = useDecisionStore()

// 状态
const viewMode = ref<'table' | 'card'>('table')
const selectedDecisions = ref<DecisionResponse[]>([])
const showBatchDeleteConfirm = ref(false)

// 分页配置
const pagination = ref({
    current: 1,
    size: 10,
    total: 0
})

// 排序配置
const sortConfig = ref({
    field: 'timestamp',
    order: 'desc' as 'asc' | 'desc'
})

// 计算属性
const displayedDecisions = computed(() => {
    let decisions = [...props.decisions]

    // 应用排序
    if (sortConfig.value.field) {
        decisions.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortConfig.value.field) {
                case 'symbol':
                    aValue = a.symbol
                    bValue = b.symbol
                    break
                case 'final_decision.decision':
                    aValue = a.final_decision.decision
                    bValue = b.final_decision.decision
                    break
                case 'final_decision.confidence':
                    aValue = a.final_decision.confidence
                    bValue = b.final_decision.confidence
                    break
                case 'risk_assessment.risk_level':
                    aValue = a.risk_assessment.risk_level
                    bValue = b.risk_assessment.risk_level
                    break
                case 'timestamp':
                    aValue = new Date(a.timestamp).getTime()
                    bValue = new Date(b.timestamp).getTime()
                    break
                case 'trade_date':
                    aValue = new Date(a.trade_date).getTime()
                    bValue = new Date(b.trade_date).getTime()
                    break
                default:
                    aValue = a.symbol
                    bValue = b.symbol
            }

            if (sortConfig.value.order === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })
    }

    // 应用分页
    if (props.showPagination) {
        const start = (pagination.value.current - 1) * pagination.value.size
        const end = start + pagination.value.size
        decisions = decisions.slice(start, end)
    }

    return decisions
})

// 方法
const getDecisionType = (decision: string) => {
    const types: Record<string, string> = {
        BUY: 'success',
        SELL: 'danger',
        HOLD: 'warning'
    }
    return types[decision] || 'info'
}

const getRiskType = (riskLevel: string) => {
    const types: Record<string, string> = {
        LOW: 'success',
        MEDIUM: 'warning',
        HIGH: 'danger'
    }
    return types[riskLevel] || 'info'
}

const getRiskText = getRiskLevelText

const getConfidenceStatus = (confidence: number) => {
    if (confidence >= 80) return 'success'
    if (confidence >= 60) return 'warning'
    return 'exception'
}

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (timestamp: string) => {
    return formatDecisionTime(timestamp)
}

const getQualityScore = (decision: DecisionResponse) => {
    const quality = calculateDecisionQuality(decision)
    return Math.round(quality / 20) // 转换为5分制
}

const isNewDecision = (decision: DecisionResponse) => {
    const decisionTime = new Date(decision.timestamp).getTime()
    const now = Date.now()
    return now - decisionTime < 24 * 60 * 60 * 1000 // 24小时内为新决策
}

const handleSelectionChange = (selection: DecisionResponse[]) => {
    selectedDecisions.value = selection
}

const handleSortChange = (sort: { prop: string; order: 'ascending' | 'descending' }) => {
    sortConfig.value = {
        field: sort.prop,
        order: sort.order === 'ascending' ? 'asc' : 'desc'
    }
}

const handleRefresh = () => {
    emit('generate')
}

const handleExport = () => {
    // 导出功能实现
    ElMessage.info('导出功能开发中...')
}

const handleBatchDelete = () => {
    if (selectedDecisions.value.length === 0) {
        ElMessage.warning('请选择要删除的决策')
        return
    }
    showBatchDeleteConfirm.value = true
}

const confirmBatchDelete = async () => {
    try {
        // 这里可以调用批量删除 API
        ElMessage.success(`成功删除 ${selectedDecisions.value.length} 个决策`)
        selectedDecisions.value = []
        showBatchDeleteConfirm.value = false
    } catch (error) {
        ElMessage.error('删除失败')
    }
}

const handleViewDetail = (decision: DecisionResponse) => {
    emit('view', decision)
}

const handleExecute = (decision: DecisionResponse) => {
    emit('execute', decision)
}

const handleRegenerate = async (decision: DecisionResponse) => {
    try {
        const confirm = await ElMessageBox.confirm(
            `确定要重新生成 ${decision.symbol} 的决策吗？`,
            '确认重新生成',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        if (confirm) {
            emit('regenerate', decision)
        }
    } catch {
        // 用户取消
    }
}

const handleDelete = async (decision: DecisionResponse) => {
    try {
        const confirm = await ElMessageBox.confirm(
            `确定要删除 ${decision.symbol} 的决策吗？`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        if (confirm) {
            emit('delete', decision)
        }
    } catch {
        // 用户取消
    }
}

const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
}

const handleCurrentChange = (page: number) => {
    pagination.value.current = page
}

// 监听数据变化更新分页总数
watch(() => props.decisions, (newDecisions: DecisionResponse[]) => {
    pagination.value.total = newDecisions.length
}, { immediate: true })
</script>

<style scoped>
.decision-table {
    width: 100%;
}

.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.toolbar-left,
.toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.table-container {
    margin-bottom: 20px;
}

.card-container {
    margin-bottom: 20px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.symbol-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.symbol-text {
    font-weight: bold;
}

.confidence-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.confidence-text {
    font-size: 12px;
    color: #909399;
    min-width: 30px;
}

.vote-summary {
    display: flex;
    gap: 12px;
}

.vote-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.vote-item.buy .vote-count {
    color: #67c23a;
    font-weight: bold;
}

.vote-item.sell .vote-count {
    color: #f56c6c;
    font-weight: bold;
}

.vote-item.hold .vote-count {
    color: #e6a23c;
    font-weight: bold;
}

.vote-label {
    font-size: 10px;
    color: #909399;
}

.quality-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.score-text {
    font-size: 12px;
    color: #909399;
}
</style>