<template>
    <div class="decision-detail">
        <!-- 决策基本信息 -->
        <el-card class="basic-info-card">
            <template #header>
                <div class="card-header">
                    <span class="card-title">决策基本信息</span>
                    <div class="header-actions">
                        <el-button type="primary" :icon="DocumentAdd" @click="handleExecute">
                            执行交易
                        </el-button>
                        <el-button :icon="Share" @click="handleShare">
                            分享
                        </el-button>
                    </div>
                </div>
            </template>

            <el-row :gutter="20">
                <el-col :span="8">
                    <div class="info-item">
                        <div class="info-label">股票代码</div>
                        <div class="info-value">{{ decision?.symbol }}</div>
                    </div>
                </el-col>

                <el-col :span="8">
                    <div class="info-item">
                        <div class="info-label">交易日期</div>
                        <div class="info-value">{{ formatDate(decision?.trade_date) }}</div>
                    </div>
                </el-col>

                <el-col :span="8">
                    <div class="info-item">
                        <div class="info-label">生成时间</div>
                        <div class="info-value">{{ formatDateTime(decision?.timestamp) }}</div>
                    </div>
                </el-col>
            </el-row>

            <el-row :gutter="20" class="decision-main">
                <el-col :span="8">
                    <div class="decision-type">
                        <div class="type-label">最终决策</div>
                        <div class="type-value">
                            <el-tag :type="getDecisionType(decision?.final_decision?.decision)" size="large"
                                class="decision-tag">
                                {{ getDecisionText(decision?.final_decision?.decision) }}
                            </el-tag>
                        </div>
                    </div>
                </el-col>

                <el-col :span="8">
                    <div class="confidence-info">
                        <div class="confidence-label">置信度</div>
                        <div class="confidence-value">
                            <el-progress :percentage="decision?.final_decision?.confidence || 0"
                                :status="getConfidenceStatus(decision?.final_decision?.confidence || 0)"
                                :stroke-width="12" :show-text="false" />
                            <span class="confidence-text">{{ decision?.final_decision?.confidence }}%</span>
                        </div>
                    </div>
                </el-col>

                <el-col :span="8">
                    <div class="risk-info">
                        <div class="risk-label">风险等级</div>
                        <div class="risk-value">
                            <el-tag :type="getRiskType(decision?.risk_assessment?.risk_level)" size="large">
                                {{ getRiskText(decision?.risk_assessment?.risk_level) }}
                            </el-tag>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </el-card>

        <!-- 投票结果分析 -->
        <el-row :gutter="20" class="analysis-section">
            <el-col :span="12">
                <el-card class="vote-analysis-card">
                    <template #header>
                        <span class="card-title">模型投票分布</span>
                    </template>

                    <div class="vote-chart">
                        <div v-for="vote in voteDistribution" :key="vote.name" class="vote-item">
                            <div class="vote-info">
                                <div class="vote-name">{{ vote.name }}</div>
                                <div class="vote-count">{{ vote.value }}票</div>
                                <div class="vote-percentage">{{ vote.percentage.toFixed(1) }}%</div>
                            </div>
                            <div class="vote-bar">
                                <div class="vote-fill" :style="{
                                    width: `${vote.percentage}%`,
                                    backgroundColor: vote.color
                                }" />
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="12">
                <el-card class="quality-assessment-card">
                    <template #header>
                        <span class="card-title">决策质量评估</span>
                    </template>

                    <div class="quality-metrics">
                        <div class="metric-item">
                            <div class="metric-label">质量评分</div>
                            <div class="metric-value">
                                <el-rate v-model="qualityScore" disabled show-score text-color="#ff9900"
                                    score-template="{value} 分" />
                            </div>
                        </div>

                        <div class="metric-item">
                            <div class="metric-label">投票一致性</div>
                            <div class="metric-value">
                                <el-progress :percentage="voteConsistency"
                                    :status="getConsistencyStatus(voteConsistency)" />
                            </div>
                        </div>

                        <div class="metric-item">
                            <div class="metric-label">风险控制</div>
                            <div class="metric-value">
                                <el-tag :type="getRiskControlStatus(decision?.risk_assessment?.risk_level)">
                                    {{ getRiskControlText(decision?.risk_assessment?.risk_level) }}
                                </el-tag>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 模型详情 -->
        <el-card class="model-details-card">
            <template #header>
                <span class="card-title">参与模型详情</span>
            </template>

            <el-table :data="modelDetails" v-loading="loading">
                <el-table-column prop="model_name" label="模型名称" width="180" />
                <el-table-column prop="decision" label="决策" width="100">
                    <template #default="scope">
                        <el-tag :type="getDecisionType(scope.row.decision)" size="small">
                            {{ getDecisionText(scope.row.decision) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="confidence" label="置信度" width="120">
                    <template #default="scope">
                        <div class="confidence-display">
                            <el-progress :percentage="scope.row.confidence" :show-text="false" :stroke-width="6"
                                :status="getConfidenceStatus(scope.row.confidence)" />
                            <span class="confidence-text">{{ scope.row.confidence }}%</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="signal_strength" label="信号强度" width="120">
                    <template #default="scope">
                        <div class="strength-display">
                            <el-progress :percentage="scope.row.signal_strength" :show-text="false" :stroke-width="6"
                                :status="getSignalStrengthStatus(scope.row.signal_strength)" />
                            <span class="strength-text">{{ scope.row.signal_strength }}%</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="reasoning" label="决策理由" min-width="200">
                    <template #default="scope">
                        <div class="reasoning-text">
                            {{ scope.row.reasoning || '基于模型分析结果' }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" link size="small" @click="viewModelDetail(scope.row.model_id)">
                            查看模型
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 风险分析 -->
        <el-card class="risk-analysis-card">
            <template #header>
                <span class="card-title">风险分析与执行建议</span>
            </template>

            <div class="risk-content">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <div class="risk-assessment">
                            <h4>风险评估</h4>
                            <div class="risk-details">
                                <div class="risk-item">
                                    <span class="risk-label">审批状态:</span>
                                    <el-tag :type="decision?.risk_assessment?.is_approved ? 'success' : 'danger'">
                                        {{ decision?.risk_assessment?.is_approved ? '已批准' : '未批准' }}
                                    </el-tag>
                                </div>

                                <div class="risk-item">
                                    <span class="risk-label">调整决策:</span>
                                    <el-tag :type="getDecisionType(decision?.risk_assessment?.adjusted_decision)">
                                        {{ getDecisionText(decision?.risk_assessment?.adjusted_decision) }}
                                    </el-tag>
                                </div>

                                <div class="risk-item">
                                    <span class="risk-label">建议仓位:</span>
                                    <span class="position-value">
                                        {{ (decision?.risk_assessment?.position_suggestion || 0) * 100 }}%
                                    </span>
                                </div>
                            </div>

                            <div class="risk-warnings" v-if="decision?.risk_assessment?.warnings?.length">
                                <h5>风险警告</h5>
                                <ul class="warning-list">
                                    <li v-for="(warning, index) in decision.risk_assessment.warnings" :key="index"
                                        class="warning-item">
                                        <el-icon>
                                            <Warning />
                                        </el-icon>
                                        {{ warning }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </el-col>

                    <el-col :span="12">
                        <div class="execution-advice">
                            <h4>执行建议</h4>
                            <el-alert :title="executionAdvice.advice"
                                :type="getAlertType(decision?.risk_assessment?.risk_level)" :closable="false"
                                show-icon />

                            <div class="advice-details">
                                <div class="advice-item">
                                    <strong>操作建议:</strong>
                                    <span>{{ getOperationAdvice(decision?.final_decision?.decision) }}</span>
                                </div>

                                <div class="advice-item">
                                    <strong>持仓建议:</strong>
                                    <span>{{ getPositionAdvice(decision?.risk_assessment?.position_suggestion) }}</span>
                                </div>

                                <div class="advice-item">
                                    <strong>止损建议:</strong>
                                    <span>{{ getStopLossAdvice(decision?.risk_assessment?.risk_level) }}</span>
                                </div>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </div>
        </el-card>

        <!-- 历史决策对比 -->
        <el-card class="history-comparison-card" v-if="showHistory">
            <template #header>
                <span class="card-title">历史决策对比</span>
            </template>

            <div class="history-content">
                <el-table :data="historyDecisions" size="small">
                    <el-table-column prop="trade_date" label="日期" width="120" />
                    <el-table-column prop="final_decision" label="决策" width="100">
                        <template #default="scope">
                            <el-tag :type="getDecisionType(scope.row.final_decision)" size="small">
                                {{ getDecisionText(scope.row.final_decision) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="confidence_score" label="置信度" width="100">
                        <template #default="scope">
                            {{ scope.row.confidence_score }}%
                        </template>
                    </el-table-column>
                    <el-table-column prop="vote_summary" label="投票分布" width="200">
                        <template #default="scope">
                            买:{{ scope.row.vote_summary.BUY }} 卖:{{ scope.row.vote_summary.SELL }} 持:{{
                                scope.row.vote_summary.HOLD }}
                        </template>
                    </el-table-column>
                    <el-table-column label="实际表现" width="120">
                        <template #default>
                            <span class="performance-text">待验证</span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DocumentAdd, Share, Warning } from '@element-plus/icons-vue'
import { useDecisionStore } from '@/store/decisions'
import {
    getDecisionText,
    getDecisionColor,
    getRiskLevelText,
    generateVoteDistribution,
    calculateDecisionQuality,
    formatDecisionTime
} from '@/utils/decisionUtils'
import type { DecisionResponse, DecisionHistoryItem } from '@/types/api'

// Props
interface Props {
    decisionId?: number
    decisionData?: DecisionResponse
}

const props = withDefaults(defineProps<Props>(), {
    decisionId: undefined,
    decisionData: undefined
})

// Router
const router = useRouter()

// Store
const decisionStore = useDecisionStore()

// 状态
const loading = ref(false)
const showHistory = ref(false)
const historyDecisions = ref<DecisionHistoryItem[]>([])

// 计算属性
const decision = computed(() => {
    return props.decisionData || decisionStore.decisionDetail
})

const modelDetails = computed(() => {
    return decision.value?.final_decision?.model_details || []
})

const voteDistribution = computed(() => {
    if (!decision.value) return []
    return generateVoteDistribution(decision.value.final_decision.vote_summary)
})

const qualityScore = computed(() => {
    if (!decision.value) return 0
    return Math.round(calculateDecisionQuality(decision.value) / 20) // 转换为5分制
})

const voteConsistency = computed(() => {
    if (!decision.value) return 0
    const voteSummary = decision.value.final_decision.vote_summary
    const totalVotes = voteSummary.BUY + voteSummary.SELL + voteSummary.HOLD
    if (totalVotes === 0) return 0
    const maxVotes = Math.max(voteSummary.BUY, voteSummary.SELL, voteSummary.HOLD)
    return Math.round(maxVotes / totalVotes * 100)
})

const executionAdvice = computed(() => {
    if (!decision.value) return { advice: '', color: '', icon: '' }

    const { final_decision, risk_assessment } = decision.value
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
const getDecisionType = (decision?: string) => {
    const types: Record<string, string> = {
        BUY: 'success',
        SELL: 'danger',
        HOLD: 'warning'
    }
    return types[decision || ''] || 'info'
}

const getRiskType = (riskLevel?: string) => {
    const types: Record<string, string> = {
        LOW: 'success',
        MEDIUM: 'warning',
        HIGH: 'danger'
    }
    return types[riskLevel || ''] || 'info'
}

const getRiskText = getRiskLevelText

const getConfidenceStatus = (confidence: number) => {
    if (confidence >= 80) return 'success'
    if (confidence >= 60) return 'warning'
    return 'exception'
}

const getSignalStrengthStatus = (strength: number) => {
    if (strength >= 70) return 'success'
    if (strength >= 40) return 'warning'
    return 'exception'
}

const getConsistencyStatus = (consistency: number) => {
    if (consistency >= 80) return 'success'
    if (consistency >= 60) return 'warning'
    return 'exception'
}

const getRiskControlStatus = (riskLevel?: string) => {
    const types: Record<string, string> = {
        LOW: 'success',
        MEDIUM: 'warning',
        HIGH: 'danger'
    }
    return types[riskLevel || ''] || 'info'
}

const getRiskControlText = (riskLevel?: string) => {
    const texts: Record<string, string> = {
        LOW: '优秀',
        MEDIUM: '良好',
        HIGH: '需关注'
    }
    return texts[riskLevel || ''] || '未知'
}

const getAlertType = (riskLevel?: string) => {
    const types: Record<string, 'success' | 'warning' | 'error'> = {
        LOW: 'success',
        MEDIUM: 'warning',
        HIGH: 'error'
    }
    return types[riskLevel || ''] || 'info'
}

const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (timestamp?: string) => {
    if (!timestamp) return '-'
    return formatDecisionTime(timestamp)
}

const getOperationAdvice = (decision?: string) => {
    const advice: Record<string, string> = {
        BUY: '建议买入，关注买入时机',
        SELL: '建议卖出，控制风险',
        HOLD: '建议持有，继续观察'
    }
    return advice[decision || ''] || '根据市场情况谨慎操作'
}

const getPositionAdvice = (position?: number) => {
    if (!position) return '建议轻仓操作'
    if (position >= 0.7) return '建议重仓操作'
    if (position >= 0.4) return '建议中等仓位'
    return '建议轻仓操作'
}

const getStopLossAdvice = (riskLevel?: string) => {
    const advice: Record<string, string> = {
        LOW: '设置5%止损',
        MEDIUM: '设置8%止损',
        HIGH: '设置10%止损'
    }
    return advice[riskLevel || ''] || '设置合理止损'
}

const handleExecute = () => {
    if (!decision.value) return

    ElMessage.info('执行交易功能开发中...')
    // 这里可以打开交易执行弹窗或跳转到交易页面
}

const handleShare = () => {
    if (!decision.value) return

    // 分享功能实现
    const shareData = {
        title: `${decision.value.symbol} 交易决策`,
        text: `股票 ${decision.value.symbol} 的决策分析结果`,
        url: window.location.href
    }

    if (navigator.share) {
        navigator.share(shareData)
    } else {
        // 复制到剪贴板
        navigator.clipboard.writeText(window.location.href)
        ElMessage.success('链接已复制到剪贴板')
    }
}

const viewModelDetail = (modelId: number) => {
    router.push(`/models/${modelId}`)
}

const loadDecisionHistory = async () => {
    if (!decision.value) return

    try {
        loading.value = true
        const history = await decisionStore.fetchDecisionHistory(
            decision.value.symbol,
            '2024-01-01',
            decision.value.trade_date
        )
        historyDecisions.value = history?.history || []
        showHistory.value = true
    } catch (error) {
        console.error('加载历史决策失败:', error)
    } finally {
        loading.value = false
    }
}

// 生命周期
onMounted(() => {
    if (props.decisionId && !props.decisionData) {
        decisionStore.fetchDecisionDetail(props.decisionId)
    }

    // 加载历史决策
    loadDecisionHistory()
})
</script>

<style scoped>
.decision-detail {
    width: 100%;
}

.basic-info-card,
.vote-analysis-card,
.quality-assessment-card,
.model-details-card,
.risk-analysis-card,
.history-comparison-card {
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

.header-actions {
    display: flex;
    gap: 8px;
}

.info-item {
    margin-bottom: 16px;
}

.info-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 4px;
}

.info-value {
    font-size: 16px;
    color: #303133;
    font-weight: 500;
}

.decision-main {
    margin-top: 20px;
}

.decision-type,
.confidence-info,
.risk-info {
    text-align: center;
}

.type-label,
.confidence-label,
.risk-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
}

.decision-tag {
    font-size: 16px;
    padding: 8px 16px;
}

.confidence-value {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.confidence-text {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
}

.analysis-section {
    margin: 20px 0;
}

.vote-chart {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.vote-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.vote-info {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 120px;
}

.vote-name {
    font-size: 14px;
    color: #606266;
    width: 40px;
}

.vote-count {
    font-size: 12px;
    color: #909399;
}

.vote-percentage {
    font-size: 12px;
    color: #303133;
    font-weight: bold;
    width: 40px;
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

.quality-metrics {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.metric-label {
    font-size: 14px;
    color: #606266;
}

.metric-value {
    flex: 1;
    margin-left: 16px;
}

.confidence-display,
.strength-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.confidence-text,
.strength-text {
    font-size: 12px;
    color: #909399;
    min-width: 30px;
}

.reasoning-text {
    font-size: 12px;
    color: #606266;
    line-height: 1.4;
}

.risk-content {
    padding: 0 10px;
}

.risk-assessment,
.execution-advice {
    height: 100%;
}

.risk-assessment h4,
.execution-advice h4 {
    margin-bottom: 16px;
    color: #303133;
}

.risk-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.risk-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.risk-label {
    font-size: 14px;
    color: #606266;
}

.position-value {
    font-size: 14px;
    color: #67c23a;
    font-weight: bold;
}

.risk-warnings h5 {
    margin-bottom: 8px;
    color: #f56c6c;
}

.warning-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.warning-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    font-size: 14px;
    color: #f56c6c;
    border-bottom: 1px solid #fde2e2;
}

.warning-item:last-child {
    border-bottom: none;
}

.advice-details {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.advice-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.advice-item strong {
    color: #303133;
}

.advice-item span {
    color: #606266;
}

.history-content {
    padding: 0 10px;
}

.performance-text {
    color: #909399;
    font-style: italic;
}
</style>