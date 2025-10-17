<template>
    <div class="decisions">
        <div class="page-header">
            <h1>决策分析</h1>
            <p>多模型投票决策结果分析与管理系统</p>
        </div>

        <!-- 标签页导航 -->
        <el-tabs v-model="activeTab" class="decision-tabs">
            <el-tab-pane label="决策概览" name="overview">
                <!-- 决策统计 -->
                <DecisionStats />

                <!-- 决策筛选 -->
                <DecisionFilters @search="handleFilterSearch" @reset="handleFilterReset" />

                <!-- 决策列表 -->
                <DecisionTable :decisions="filteredDecisions" :loading="loading" @generate="showGenerator = true"
                    @view="handleViewDetail" @execute="handleExecute" @regenerate="handleRegenerate"
                    @delete="handleDelete" />
            </el-tab-pane>

            <el-tab-pane label="决策生成" name="generation">
                <DecisionGenerator />
            </el-tab-pane>

            <el-tab-pane label="决策历史" name="history">
                <div class="history-section">
                    <el-alert title="决策历史功能开发中" type="info" description="该功能将展示历史决策的执行结果和绩效分析" show-icon
                        :closable="false" />
                </div>
            </el-tab-pane>
        </el-tabs>

        <!-- 决策生成弹窗 -->
        <el-dialog v-model="showGenerator" title="快速决策生成" width="800px" :before-close="handleGeneratorClose">
            <DecisionGenerator />
            <template #footer>
                <el-button @click="showGenerator = false">取消</el-button>
                <el-button type="primary" @click="showGenerator = false">确定</el-button>
            </template>
        </el-dialog>

        <!-- 决策详情弹窗 -->
        <el-dialog v-model="showDetail" title="决策详情" width="900px" fullscreen :before-close="handleDetailClose">
            <DecisionDetail v-if="selectedDecision" :decision-data="selectedDecision" />
            <template #footer>
                <el-button @click="showDetail = false">关闭</el-button>
                <el-button type="primary" @click="handleExecute(selectedDecision)">执行交易</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDecisionStore } from '@/store/decisions'
import DecisionStats from '@/components/decisions/DecisionStats.vue'
import DecisionFilters from '@/components/decisions/DecisionFilters.vue'
import DecisionTable from '@/components/decisions/DecisionTable.vue'
import DecisionGenerator from '@/components/decisions/DecisionGenerator.vue'
import DecisionDetail from '@/components/decisions/DecisionDetail.vue'
import type { DecisionResponse } from '@/types/api'

// Store
const decisionStore = useDecisionStore()

// 状态
const activeTab = ref('overview')
const showGenerator = ref(false)
const showDetail = ref(false)
const selectedDecision = ref<DecisionResponse | null>(null)
const loading = ref(false)

// 计算属性
const filteredDecisions = computed(() => {
    return decisionStore.filteredDecisions
})

// 方法
const handleFilterSearch = (filters: any) => {
    console.log('应用筛选条件:', filters)
    // 这里可以调用 API 进行筛选
    decisionStore.setFilters(filters)
}

const handleFilterReset = () => {
    console.log('重置筛选条件')
    decisionStore.setFilters({
        symbol: '',
        decisionType: '',
        startDate: '',
        endDate: '',
        minConfidence: 0,
        maxConfidence: 100
    })
}

const handleViewDetail = (decision: DecisionResponse) => {
    selectedDecision.value = decision
    showDetail.value = true
}

const handleExecute = async (decision: DecisionResponse) => {
    try {
        const confirm = await ElMessageBox.confirm(
            `确定要执行 ${decision.symbol} 的${getDecisionText(decision.final_decision.decision)}操作吗？`,
            '确认执行交易',
            {
                confirmButtonText: '确定执行',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        if (confirm) {
            // 这里调用交易执行 API
            ElMessage.success(`已执行 ${decision.symbol} 的${getDecisionText(decision.final_decision.decision)}操作`)
            showDetail.value = false
        }
    } catch {
        // 用户取消
    }
}

const handleRegenerate = async (decision: DecisionResponse) => {
    try {
        loading.value = true
        await decisionStore.generateDecision(decision.symbol, decision.trade_date)
        ElMessage.success(`已重新生成 ${decision.symbol} 的决策`)
    } catch (error) {
        ElMessage.error('重新生成决策失败')
    } finally {
        loading.value = false
    }
}

const handleDelete = async (decision: DecisionResponse) => {
    try {
        const confirm = await ElMessageBox.confirm(
            `确定要删除 ${decision.symbol} 的决策吗？`,
            '确认删除',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        if (confirm) {
            // 这里调用删除 API
            ElMessage.success(`已删除 ${decision.symbol} 的决策`)
        }
    } catch {
        // 用户取消
    }
}

const handleGeneratorClose = (done: () => void) => {
    ElMessageBox.confirm('确定要关闭决策生成吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        showGenerator.value = false
        done()
    }).catch(() => {
        // 取消关闭
    })
}

const handleDetailClose = (done: () => void) => {
    showDetail.value = false
    selectedDecision.value = null
    done()
}

const getDecisionText = (decision: string) => {
    const texts: Record<string, string> = {
        BUY: '买入',
        SELL: '卖出',
        HOLD: '持有'
    }
    return texts[decision] || decision
}

// 生命周期
onMounted(() => {
    // 加载决策数据
    decisionStore.fetchDecisions()
})
</script>

<style scoped>
.decisions {
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

.decision-tabs {
    margin-top: 20px;
}

.decision-tabs :deep(.el-tabs__header) {
    margin-bottom: 0;
}

.decision-tabs :deep(.el-tabs__content) {
    padding: 20px 0;
}

.history-section {
    padding: 40px 0;
    text-align: center;
}

.history-section :deep(.el-alert) {
    max-width: 600px;
    margin: 0 auto;
}
</style>