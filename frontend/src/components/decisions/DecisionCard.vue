<template>
    <el-card class="decision-card" :class="cardClass">
        <template #header>
            <div class="card-header">
                <div class="stock-info">
                    <div class="symbol">{{ decision.symbol }}</div>
                    <div class="timestamp">{{ formatDateTime(decision.timestamp) }}</div>
                </div>
                <el-tag :type="getDecisionType(decision.final_decision.decision)" size="small">
                    {{ getDecisionText(decision.final_decision.decision) }}
                </el-tag>
            </div>
        </template>

        <div class="card-content">
            <!-- 置信度和风险 -->
            <div class="metrics-row">
                <div class="metric-item">
                    <div class="metric-label">置信度</div>
                    <div class="metric-value">
                        <el-progress :percentage="decision.final_decision.confidence"
                            :status="getConfidenceStatus(decision.final_decision.confidence)" :show-text="false"
                            :stroke-width="6" />
                        <span class="confidence-text">{{ decision.final_decision.confidence }}%</span>
                    </div>
                </div>

                <div class="metric-item">
                    <div class="metric-label">风险等级</div>
                    <div class="metric-value">
                        <el-tag :type="getRiskType(decision.risk_assessment.risk_level)" size="small">
                            {{ getRiskText(decision.risk_assessment.risk_level) }}
                        </el-tag>
                    </div>
                </div>
            </div>

            <!-- 投票分布 -->
            <div class="vote-distribution">
                <div class="vote-title">投票分布</div>
                <div class="vote-bars">
                    <div class="vote-bar buy">
                        <div class="vote-label">买</div>
                        <div class="vote-count">{{ decision.final_decision.vote_summary.BUY }}</div>
                    </div>
                    <div class="vote-bar sell">
                        <div class="vote-label">卖</div>
                        <div class="vote-count">{{ decision.final_decision.vote_summary.SELL }}</div>
                    </div>
                    <div class="vote-bar hold">
                        <div class="vote-label">持</div>
                        <div class="vote-count">{{ decision.final_decision.vote_summary.HOLD }}</div>
                    </div>
                </div>
            </div>

            <!-- 模型数量 -->
            <div class="model-count">
                <el-icon>
                    <User />
                </el-icon>
                <span>{{ decision.final_decision.model_details.length }} 个模型参与</span>
            </div>

            <!-- 执行建议 -->
            <div class="execution-advice" :class="getAdviceClass(decision)">
                <el-icon v-if="getAdviceIcon(decision)">
                    <component :is="getAdviceIcon(decision)" />
                </el-icon>
                <span>{{ getAdviceText(decision) }}</span>
            </div>
        </div>

        <template #footer>
            <div class="card-actions">
                <el-button type="primary" link size="small" @click="$emit('view', decision)">
                    详情
                </el-button>
                <el-button type="success" link size="small" @click="$emit('execute', decision)">
                    执行
                </el-button>
                <el-button type="warning" link size="small" @click="$emit('regenerate', decision)">
                    重新生成
                </el-button>
                <el-button type="danger" link size="small" @click="$emit('delete', decision)">
                    删除
                </el-button>
            </div>
        </template>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User, SuccessFilled, Warning, CloseBold, InfoFilled } from '@element-plus/icons-vue'
import {
    getDecisionText,
    getDecisionColor,
    getRiskLevelText,
    formatDecisionTime
} from '@/utils/decisionUtils'
import type { DecisionResponse } from '@/types/api'

// Props
interface Props {
    decision: DecisionResponse
}

const props = defineProps<Props>()

// 事件定义
const emit = defineEmits<{
    view: [decision: DecisionResponse]
    execute: [decision: DecisionResponse]
    regenerate: [decision: DecisionResponse]
    delete: [decision: DecisionResponse]
}>()

// 计算属性
const cardClass = computed(() => {
    const decisionType = props.decision.final_decision.decision.toLowerCase()
    return `decision-${decisionType}`
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

const formatDateTime = formatDecisionTime

const getAdviceClass = (decision: DecisionResponse) => {
    const { final_decision, risk_assessment } = decision

    if (risk_assessment.risk_level === 'HIGH') {
        return 'advice-danger'
    }

    if (final_decision.confidence >= 80) {
        return 'advice-success'
    }

    if (final_decision.confidence >= 60) {
        return 'advice-warning'
    }

    return 'advice-info'
}

const getAdviceIcon = (decision: DecisionResponse) => {
    const { final_decision, risk_assessment } = decision

    if (risk_assessment.risk_level === 'HIGH') {
        return Warning
    }

    if (final_decision.confidence >= 80) {
        return SuccessFilled
    }

    if (final_decision.confidence >= 60) {
        return InfoFilled
    }

    return CloseBold
}

const getAdviceText = (decision: DecisionResponse) => {
    const { final_decision, risk_assessment } = decision

    if (risk_assessment.risk_level === 'HIGH') {
        return '高风险，谨慎执行'
    }

    if (final_decision.confidence >= 80) {
        return '高置信度，建议执行'
    }

    if (final_decision.confidence >= 60) {
        return '中等置信度，建议观察'
    }

    return '低置信度，不建议执行'
}
</script>

<style scoped>
.decision-card {
    border-radius: 8px;
    transition: all 0.3s ease;
    margin-bottom: 16px;
}

.decision-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.decision-buy {
    border-left: 4px solid #67c23a;
}

.decision-sell {
    border-left: 4px solid #f56c6c;
}

.decision-hold {
    border-left: 4px solid #e6a23c;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.stock-info {
    flex: 1;
}

.symbol {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 4px;
}

.timestamp {
    font-size: 12px;
    color: #909399;
}

.card-content {
    padding: 8px 0;
}

.metrics-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
}

.metric-item {
    flex: 1;
}

.metric-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
}

.metric-value {
    display: flex;
    align-items: center;
    gap: 8px;
}

.confidence-text {
    font-size: 12px;
    color: #303133;
    font-weight: 500;
    min-width: 30px;
}

.vote-distribution {
    margin-bottom: 16px;
}

.vote-title {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
}

.vote-bars {
    display: flex;
    gap: 8px;
}

.vote-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px;
    border-radius: 4px;
}

.vote-bar.buy {
    background-color: #f0f9ff;
    border: 1px solid #e1f3ff;
}

.vote-bar.sell {
    background-color: #fef0f0;
    border: 1px solid #fde2e2;
}

.vote-bar.hold {
    background-color: #fdf6ec;
    border: 1px solid #faecd8;
}

.vote-label {
    font-size: 10px;
    color: #606266;
    margin-bottom: 2px;
}

.vote-count {
    font-size: 14px;
    font-weight: bold;
}

.vote-bar.buy .vote-count {
    color: #67c23a;
}

.vote-bar.sell .vote-count {
    color: #f56c6c;
}

.vote-bar.hold .vote-count {
    color: #e6a23c;
}

.model-count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #909399;
    margin-bottom: 12px;
}

.model-count .el-icon {
    font-size: 14px;
}

.execution-advice {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.advice-success {
    color: #67c23a;
    background-color: #f0f9ff;
    border: 1px solid #e1f3ff;
}

.advice-warning {
    color: #e6a23c;
    background-color: #fdf6ec;
    border: 1px solid #faecd8;
}

.advice-danger {
    color: #f56c6c;
    background-color: #fef0f0;
    border: 1px solid #fde2e2;
}

.advice-info {
    color: #909399;
    background-color: #f4f4f5;
    border: 1px solid #e9e9eb;
}

.execution-advice .el-icon {
    font-size: 14px;
}

.card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>