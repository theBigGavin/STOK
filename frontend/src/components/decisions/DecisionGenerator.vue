<template>
    <div class="decision-generator">
        <!-- 单股决策生成 -->
        <el-card class="generator-card">
            <template #header>
                <div class="card-header">
                    <span class="card-title">单股决策生成</span>
                    <el-button type="primary" :icon="Plus" @click="showBatchGenerator = true">
                        批量生成
                    </el-button>
                </div>
            </template>

            <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" @submit.prevent="handleGenerate">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="股票代码" prop="symbol">
                            <el-input v-model="form.symbol" placeholder="请输入股票代码，如：AAPL" clearable
                                @input="handleSymbolInput">
                                <template #append>
                                    <el-button :icon="Search" @click="searchStock" />
                                </template>
                            </el-input>
                        </el-form-item>
                    </el-col>

                    <el-col :span="12">
                        <el-form-item label="交易日期" prop="tradeDate">
                            <el-date-picker v-model="form.tradeDate" type="date" placeholder="选择交易日期"
                                format="YYYY-MM-DD" value-format="YYYY-MM-DD" :disabled-date="disabledDate" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="当前持仓" prop="currentPosition">
                            <el-input-number v-model="form.currentPosition" :min="0" :max="10000" :precision="2"
                                placeholder="当前持仓数量" />
                        </el-form-item>
                    </el-col>

                    <el-col :span="12">
                        <el-form-item label="模型选择" prop="modelIds">
                            <el-select v-model="form.modelIds" multiple placeholder="选择参与投票的模型" style="width: 100%">
                                <el-option v-for="model in availableModels" :key="model.id" :label="model.name"
                                    :value="model.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- 高级参数 -->
                <el-collapse v-model="activeCollapse">
                    <el-collapse-item title="高级参数" name="advanced">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="置信度阈值">
                                    <el-slider v-model="form.confidenceThreshold" :min="50" :max="95" :step="5"
                                        show-stops show-input />
                                </el-form-item>
                            </el-col>

                            <el-col :span="12">
                                <el-form-item label="风险偏好">
                                    <el-radio-group v-model="form.riskPreference">
                                        <el-radio label="LOW">保守</el-radio>
                                        <el-radio label="MEDIUM">平衡</el-radio>
                                        <el-radio label="HIGH">激进</el-radio>
                                    </el-radio-group>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </el-collapse-item>
                </el-collapse>

                <el-form-item class="form-actions">
                    <el-button type="primary" :loading="generating" @click="handleGenerate">
                        {{ generating ? '生成中...' : '生成决策' }}
                    </el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 生成结果 -->
        <el-card v-if="generatedDecision" class="result-card">
            <template #header>
                <div class="card-header">
                    <span class="card-title">生成结果</span>
                    <el-tag :type="getDecisionType(generatedDecision.final_decision.decision)">
                        {{ getDecisionText(generatedDecision.final_decision.decision) }}
                    </el-tag>
                </div>
            </template>

            <div class="result-content">
                <el-row :gutter="20">
                    <el-col :span="8">
                        <div class="result-item">
                            <div class="result-label">股票代码</div>
                            <div class="result-value">{{ generatedDecision.symbol }}</div>
                        </div>
                    </el-col>

                    <el-col :span="8">
                        <div class="result-item">
                            <div class="result-label">置信度</div>
                            <div class="result-value">
                                <el-progress :percentage="generatedDecision.final_decision.confidence"
                                    :status="getConfidenceStatus(generatedDecision.final_decision.confidence)"
                                    :show-text="false" />
                                <span>{{ generatedDecision.final_decision.confidence }}%</span>
                            </div>
                        </div>
                    </el-col>

                    <el-col :span="8">
                        <div class="result-item">
                            <div class="result-label">风险等级</div>
                            <div class="result-value">
                                <el-tag :type="getRiskType(generatedDecision.risk_assessment.risk_level)">
                                    {{ getRiskText(generatedDecision.risk_assessment.risk_level) }}
                                </el-tag>
                            </div>
                        </div>
                    </el-col>
                </el-row>

                <!-- 投票分布 -->
                <el-divider>模型投票分布</el-divider>
                <div class="vote-distribution">
                    <div v-for="vote in voteDistribution" :key="vote.name" class="vote-item">
                        <div class="vote-label">{{ vote.name }}</div>
                        <div class="vote-bar">
                            <div class="vote-fill" :style="{
                                width: `${vote.percentage}%`,
                                backgroundColor: vote.color
                            }" />
                        </div>
                        <div class="vote-count">{{ vote.value }}票 ({{ vote.percentage.toFixed(1) }}%)</div>
                    </div>
                </div>

                <!-- 模型详情 -->
                <el-divider>模型详情</el-divider>
                <el-table :data="generatedDecision.final_decision.model_details" size="small">
                    <el-table-column prop="model_name" label="模型名称" />
                    <el-table-column prop="decision" label="决策">
                        <template #default="scope">
                            <el-tag :type="getDecisionType(scope.row.decision)" size="small">
                                {{ getDecisionText(scope.row.decision) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="confidence" label="置信度">
                        <template #default="scope">
                            {{ scope.row.confidence }}%
                        </template>
                    </el-table-column>
                    <el-table-column prop="signal_strength" label="信号强度">
                        <template #default="scope">
                            {{ scope.row.signal_strength }}%
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 执行建议 -->
                <el-divider>执行建议</el-divider>
                <div class="execution-advice">
                    <el-alert :title="executionAdvice.advice"
                        :type="getAlertType(generatedDecision.risk_assessment.risk_level)" :closable="false"
                        show-icon />
                    <div class="position-suggestion" v-if="generatedDecision.risk_assessment.position_suggestion">
                        <span>建议仓位: </span>
                        <strong>{{ (generatedDecision.risk_assessment.position_suggestion * 100).toFixed(1) }}%</strong>
                    </div>
                </div>
            </div>
        </el-card>

        <!-- 批量生成弹窗 -->
        <el-dialog v-model="showBatchGenerator" title="批量决策生成" width="600px" :before-close="handleBatchClose">
            <BatchDecisionGenerator @success="handleBatchSuccess" @close="showBatchGenerator = false" />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useDecisionStore } from '@/store/decisions'
import { useModelStore } from '@/store/models'
import { getDecisionText, getDecisionColor, getRiskLevelText, generateVoteDistribution } from '@/utils/decisionUtils'
import BatchDecisionGenerator from './BatchDecisionGenerator.vue'
import type { DecisionResponse } from '@/types/api'

// Store
const decisionStore = useDecisionStore()
const modelStore = useModelStore()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const form = ref({
    symbol: '',
    tradeDate: '',
    currentPosition: 0,
    modelIds: [] as number[],
    confidenceThreshold: 70,
    riskPreference: 'MEDIUM'
})

const generating = ref(false)
const generatedDecision = ref<DecisionResponse | null>(null)
const showBatchGenerator = ref(false)
const activeCollapse = ref<string[]>([])

// 表单验证规则
const rules: FormRules = {
    symbol: [
        { required: true, message: '请输入股票代码', trigger: 'blur' },
        { pattern: /^[A-Za-z]{1,5}$/, message: '股票代码格式不正确', trigger: 'blur' }
    ],
    tradeDate: [
        { required: true, message: '请选择交易日期', trigger: 'change' }
    ]
}

// 计算属性
const availableModels = computed(() => {
    return modelStore.modelList.filter(model => model.is_active)
})

const voteDistribution = computed(() => {
    if (!generatedDecision.value) return []
    return generateVoteDistribution(generatedDecision.value.final_decision.vote_summary)
})

const executionAdvice = computed(() => {
    if (!generatedDecision.value) return { advice: '', color: '', icon: '' }

    const { final_decision, risk_assessment } = generatedDecision.value
    if (risk_assessment.risk_level === 'HIGH') {
        return {
            advice: '高风险，建议谨慎执行',
            color: '#f56c6c',
            icon: 'Warning'
        }
    }

    if (final_decision.confidence >= 80) {
        return {
            advice: '高置信度，建议执行',
            color: '#67c23a',
            icon: 'SuccessFilled'
        }
    }

    if (final_decision.confidence >= 60) {
        return {
            advice: '中等置信度，建议观察',
            color: '#e6a23c',
            icon: 'InfoFilled'
        }
    }

    return {
        advice: '低置信度，不建议执行',
        color: '#909399',
        icon: 'CloseBold'
    }
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

const getAlertType = (riskLevel: string) => {
    const types: Record<string, 'success' | 'warning' | 'error'> = {
        LOW: 'success',
        MEDIUM: 'warning',
        HIGH: 'error'
    }
    return types[riskLevel] || 'info'
}

const disabledDate = (time: Date) => {
    return time.getTime() > Date.now()
}

const handleSymbolInput = () => {
    form.value.symbol = form.value.symbol.toUpperCase()
}

const searchStock = async () => {
    if (!form.value.symbol) {
        ElMessage.warning('请输入股票代码')
        return
    }

    // 这里可以调用股票搜索 API
    ElMessage.info(`搜索股票: ${form.value.symbol}`)
}

const handleGenerate = async () => {
    if (!formRef.value) return

    try {
        const valid = await formRef.value.validate()
        if (!valid) return

        generating.value = true
        generatedDecision.value = null

        const result = await decisionStore.generateDecision(
            form.value.symbol,
            form.value.tradeDate || new Date().toISOString().split('T')[0]
        )

        generatedDecision.value = result
        ElMessage.success('决策生成成功')

    } catch (error) {
        console.error('生成决策失败:', error)
        ElMessage.error('生成决策失败')
    } finally {
        generating.value = false
    }
}

const handleReset = () => {
    formRef.value?.resetFields()
    generatedDecision.value = null
    form.value.currentPosition = 0
    form.value.modelIds = []
    form.value.confidenceThreshold = 70
    form.value.riskPreference = 'MEDIUM'
}

const handleBatchClose = (done: () => void) => {
    ElMessageBox.confirm('确定要关闭批量生成吗？未完成的生成将会取消。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        showBatchGenerator.value = false
        done()
    }).catch(() => {
        // 取消关闭
    })
}

const handleBatchSuccess = (results: DecisionResponse[]) => {
    showBatchGenerator.value = false
    ElMessage.success(`批量生成完成，共生成 ${results.length} 个决策`)
    // 可以在这里处理批量生成的结果
}

// 生命周期
onMounted(() => {
    // 设置默认日期为今天
    form.value.tradeDate = new Date().toISOString().split('T')[0]

    // 加载可用模型
    modelStore.fetchModels()
})
</script>

<style scoped>
.decision-generator {
    width: 100%;
}

.generator-card,
.result-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    font-size: 16px;
    font-weight: bold;
}

.form-actions {
    margin-top: 20px;
    text-align: center;
}

.result-content {
    padding: 0 10px;
}

.result-item {
    margin-bottom: 16px;
}

.result-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 4px;
}

.result-value {
    font-size: 16px;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;
}

.vote-distribution {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.vote-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.vote-label {
    width: 60px;
    font-size: 14px;
    color: #606266;
}

.vote-bar {
    flex: 1;
    height: 8px;
    background-color: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
}

.vote-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.vote-count {
    width: 100px;
    font-size: 12px;
    color: #909399;
    text-align: right;
}

.execution-advice {
    margin-top: 16px;
}

.position-suggestion {
    margin-top: 12px;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-size: 14px;
}

.position-suggestion strong {
    color: #67c23a;
}
</style>