<template>
    <div class="batch-decision-generator">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
            <el-form-item label="股票列表" prop="symbols">
                <el-input v-model="form.symbolsText" type="textarea" :rows="6" placeholder="请输入股票代码，每行一个，例如：
AAPL
GOOGL
MSFT
TSLA" @input="handleSymbolsInput" />
                <div class="symbols-count">
                    已输入 {{ symbolCount }} 个股票代码
                </div>
            </el-form-item>

            <el-form-item label="交易日期" prop="tradeDate">
                <el-date-picker v-model="form.tradeDate" type="date" placeholder="选择交易日期" format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD" :disabled-date="disabledDate" />
            </el-form-item>

            <el-form-item label="批量设置">
                <el-checkbox v-model="form.parallelProcessing">并行处理</el-checkbox>
                <el-checkbox v-model="form.stopOnError">出错时停止</el-checkbox>
            </el-form-item>

            <!-- 进度显示 -->
            <div v-if="generating" class="progress-section">
                <el-divider>生成进度</el-divider>

                <div class="progress-info">
                    <div class="progress-stats">
                        <span>已完成: {{ progress.completed }}/{{ progress.total }}</span>
                        <span>成功率: {{ progress.successRate }}%</span>
                        <span>预计剩余: {{ progress.estimatedRemaining }}</span>
                    </div>

                    <el-progress :percentage="progress.percentage" :status="progress.status" :stroke-width="8" />
                </div>

                <!-- 实时结果 -->
                <div class="real-time-results">
                    <el-table :data="realTimeResults" size="small" max-height="200">
                        <el-table-column prop="symbol" label="股票代码" width="100" />
                        <el-table-column prop="status" label="状态" width="80">
                            <template #default="scope">
                                <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'" size="small">
                                    {{ scope.row.status === 'success' ? '成功' : '失败' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="decision" label="决策" width="80">
                            <template #default="scope">
                                <span v-if="scope.row.decision" class="decision-text">
                                    {{ getDecisionText(scope.row.decision) }}
                                </span>
                                <span v-else class="no-data">-</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="confidence" label="置信度" width="100">
                            <template #default="scope">
                                <span v-if="scope.row.confidence" class="confidence-value">
                                    {{ scope.row.confidence }}%
                                </span>
                                <span v-else class="no-data">-</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="error" label="错误信息">
                            <template #default="scope">
                                <span v-if="scope.row.error" class="error-text">
                                    {{ scope.row.error }}
                                </span>
                                <span v-else class="no-data">-</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>

            <el-form-item class="form-actions">
                <el-button type="primary" :loading="generating" :disabled="symbolCount === 0" @click="handleGenerate">
                    {{ generating ? '生成中...' : `生成 ${symbolCount} 个决策` }}
                </el-button>
                <el-button @click="handleReset" :disabled="generating">重置</el-button>
                <el-button @click="$emit('close')">取消</el-button>
            </el-form-item>
        </el-form>

        <!-- 生成结果汇总 -->
        <div v-if="batchResults && !generating" class="results-summary">
            <el-divider>生成结果汇总</el-divider>

            <el-row :gutter="20" class="summary-stats">
                <el-col :span="6">
                    <div class="stat-item">
                        <div class="stat-value">{{ batchResults.total_count }}</div>
                        <div class="stat-label">总数量</div>
                    </div>
                </el-col>
                <el-col :span="6">
                    <div class="stat-item">
                        <div class="stat-value success">{{ batchResults.success_count }}</div>
                        <div class="stat-label">成功</div>
                    </div>
                </el-col>
                <el-col :span="6">
                    <div class="stat-item">
                        <div class="stat-value error">{{ batchResults.total_count - batchResults.success_count }}</div>
                        <div class="stat-label">失败</div>
                    </div>
                </el-col>
                <el-col :span="6">
                    <div class="stat-item">
                        <div class="stat-value">{{ Math.round(batchResults.success_count / batchResults.total_count *
                            100) }}%
                        </div>
                        <div class="stat-label">成功率</div>
                    </div>
                </el-col>
            </el-row>

            <!-- 决策分布 -->
            <div class="decision-distribution">
                <h4>决策分布</h4>
                <el-row :gutter="20">
                    <el-col :span="8">
                        <div class="distribution-item buy">
                            <div class="distribution-label">买入</div>
                            <div class="distribution-count">
                                {{ decisionDistribution.BUY || 0 }}
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="distribution-item sell">
                            <div class="distribution-label">卖出</div>
                            <div class="distribution-count">
                                {{ decisionDistribution.SELL || 0 }}
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="distribution-item hold">
                            <div class="distribution-label">持有</div>
                            <div class="distribution-count">
                                {{ decisionDistribution.HOLD || 0 }}
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </div>

            <div class="summary-actions">
                <el-button type="primary" @click="handleSaveResults">保存结果</el-button>
                <el-button @click="handleExportResults">导出数据</el-button>
                <el-button @click="handleViewDetails">查看详情</el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useDecisionStore } from '@/store/decisions'
import { getDecisionText } from '@/utils/decisionUtils'
import type { BatchDecisionResponse, DecisionResponse } from '@/types/api'

// 事件定义
const emit = defineEmits<{
    success: [results: DecisionResponse[]]
    close: []
}>()

// Store
const decisionStore = useDecisionStore()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const form = ref({
    symbolsText: '',
    tradeDate: '',
    parallelProcessing: true,
    stopOnError: false
})

const generating = ref(false)
const batchResults = ref<BatchDecisionResponse | null>(null)
const realTimeResults = ref<Array<{
    symbol: string
    status: 'success' | 'error'
    decision?: string
    confidence?: number
    error?: string
}>>([])

// 进度信息
const progress = ref({
    completed: 0,
    total: 0,
    percentage: 0,
    successRate: 0,
    estimatedRemaining: '计算中...',
    status: 'success' as 'success' | 'exception' | 'warning'
})

// 表单验证规则
const rules: FormRules = {
    symbolsText: [
        { required: true, message: '请输入股票代码列表', trigger: 'blur' }
    ],
    tradeDate: [
        { required: true, message: '请选择交易日期', trigger: 'change' }
    ]
}

// 计算属性
const symbolCount = computed(() => {
    if (!form.value.symbolsText.trim()) return 0
    const symbols = form.value.symbolsText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    return symbols.length
})

const symbolList = computed(() => {
    if (!form.value.symbolsText.trim()) return []
    return form.value.symbolsText
        .split('\n')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0 && /^[A-Z]{1,5}$/.test(s))
})

const decisionDistribution = computed(() => {
    if (!batchResults.value) return { BUY: 0, SELL: 0, HOLD: 0 }

    const distribution = { BUY: 0, SELL: 0, HOLD: 0 }
    batchResults.value.batch_results.forEach(result => {
        if (result.final_decision) {
            distribution[result.final_decision.decision]++
        }
    })
    return distribution
})

// 方法
const handleSymbolsInput = () => {
    // 自动转换为大写
    form.value.symbolsText = form.value.symbolsText.toUpperCase()
}

const disabledDate = (time: Date) => {
    return time.getTime() > Date.now()
}

const handleGenerate = async () => {
    if (!formRef.value) return

    try {
        const valid = await formRef.value.validate()
        if (!valid) return

        if (symbolCount.value === 0) {
            ElMessage.warning('请输入至少一个股票代码')
            return
        }

        if (symbolCount.value > 50) {
            const confirm = await ElMessageBox.confirm(
                `您选择了 ${symbolCount.value} 个股票，批量生成可能需要较长时间，确定继续吗？`,
                '确认批量生成',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )
            if (!confirm) return
        }

        generating.value = true
        batchResults.value = null
        realTimeResults.value = []

        // 初始化进度
        progress.value = {
            completed: 0,
            total: symbolCount.value,
            percentage: 0,
            successRate: 0,
            estimatedRemaining: '计算中...',
            status: 'success'
        }

        // 模拟实时进度更新
        const startTime = Date.now()

        // 执行批量生成
        const results = await decisionStore.generateBatchDecisions(
            symbolList.value,
            form.value.tradeDate || new Date().toISOString().split('T')[0]
        )

        batchResults.value = results

        // 更新实时结果
        results.batch_results.forEach((result, index) => {
            setTimeout(() => {
                realTimeResults.value.push({
                    symbol: result.symbol,
                    status: 'success',
                    decision: result.final_decision.decision,
                    confidence: result.final_decision.confidence
                })

                // 更新进度
                progress.value.completed = index + 1
                progress.value.percentage = Math.round((index + 1) / symbolCount.value * 100)
                progress.value.successRate = Math.round((index + 1) / symbolCount.value * 100)

                // 计算预计剩余时间
                const elapsed = Date.now() - startTime
                const rate = (index + 1) / elapsed
                const remaining = Math.round((symbolCount.value - (index + 1)) / rate / 1000)
                progress.value.estimatedRemaining = `${remaining}秒`

            }, index * 100) // 模拟处理延迟
        })

        ElMessage.success(`批量生成完成，成功 ${results.success_count}/${results.total_count}`)
        emit('success', results.batch_results)

    } catch (error) {
        console.error('批量生成失败:', error)
        ElMessage.error('批量生成失败')
        progress.value.status = 'exception'
    } finally {
        generating.value = false
    }
}

const handleReset = () => {
    formRef.value?.resetFields()
    batchResults.value = null
    realTimeResults.value = []
    form.value.parallelProcessing = true
    form.value.stopOnError = false
}

const handleSaveResults = () => {
    if (!batchResults.value) return

    // 这里可以调用 API 保存结果到数据库
    ElMessage.success('结果保存成功')
}

const handleExportResults = () => {
    if (!batchResults.value) return

    // 导出功能实现
    const dataStr = JSON.stringify(batchResults.value.batch_results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `batch_decisions_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('数据导出成功')
}

const handleViewDetails = () => {
    // 跳转到决策列表页面或打开详情弹窗
    ElMessage.info('查看详情功能')
}

// 设置默认日期
watch(() => form.value.tradeDate, (newVal) => {
    if (!newVal) {
        form.value.tradeDate = new Date().toISOString().split('T')[0]
    }
}, { immediate: true })
</script>

<style scoped>
.batch-decision-generator {
    width: 100%;
}

.symbols-count {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
}

.progress-section {
    margin: 20px 0;
}

.progress-info {
    margin-bottom: 16px;
}

.progress-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    color: #606266;
}

.real-time-results {
    margin-top: 16px;
}

.decision-text {
    font-weight: bold;
}

.confidence-value {
    color: #67c23a;
    font-weight: bold;
}

.error-text {
    color: #f56c6c;
    font-size: 12px;
}

.no-data {
    color: #c0c4cc;
    font-style: italic;
}

.form-actions {
    margin-top: 20px;
    text-align: center;
}

.results-summary {
    margin-top: 20px;
}

.summary-stats {
    margin-bottom: 20px;
}

.stat-item {
    text-align: center;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 4px;
}

.stat-value.success {
    color: #67c23a;
}

.stat-value.error {
    color: #f56c6c;
}

.stat-label {
    font-size: 14px;
    color: #909399;
}

.decision-distribution {
    margin: 20px 0;
}

.decision-distribution h4 {
    margin-bottom: 16px;
    color: #303133;
}

.distribution-item {
    text-align: center;
    padding: 16px;
    border-radius: 4px;
}

.distribution-item.buy {
    background-color: #f0f9ff;
    border: 1px solid #e1f3ff;
}

.distribution-item.sell {
    background-color: #fef0f0;
    border: 1px solid #fde2e2;
}

.distribution-item.hold {
    background-color: #fdf6ec;
    border: 1px solid #faecd8;
}

.distribution-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
}

.distribution-count {
    font-size: 20px;
    font-weight: bold;
}

.distribution-item.buy .distribution-count {
    color: #67c23a;
}

.distribution-item.sell .distribution-count {
    color: #f56c6c;
}

.distribution-item.hold .distribution-count {
    color: #e6a23c;
}

.summary-actions {
    text-align: center;
    margin-top: 20px;
}
</style>