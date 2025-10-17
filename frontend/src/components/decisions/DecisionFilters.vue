<template>
    <div class="decision-filters">
        <el-card class="filters-card">
            <template #header>
                <div class="card-header">
                    <span class="card-title">决策筛选</span>
                    <div class="header-actions">
                        <el-button type="primary" :icon="Search" @click="handleSearch">
                            搜索
                        </el-button>
                        <el-button :icon="Refresh" @click="handleReset">
                            重置
                        </el-button>
                        <el-button :icon="Setting" @click="showAdvanced = !showAdvanced">
                            {{ showAdvanced ? '隐藏' : '显示' }}高级筛选
                        </el-button>
                    </div>
                </div>
            </template>

            <!-- 基础筛选条件 -->
            <el-row :gutter="20">
                <el-col :span="6">
                    <div class="filter-item">
                        <div class="filter-label">股票代码</div>
                        <el-input v-model="filters.symbol" placeholder="输入股票代码" clearable @input="handleSymbolInput" />
                    </div>
                </el-col>

                <el-col :span="6">
                    <div class="filter-item">
                        <div class="filter-label">决策类型</div>
                        <el-select v-model="filters.decisionType" placeholder="选择决策类型" clearable style="width: 100%">
                            <el-option label="买入" value="BUY" />
                            <el-option label="卖出" value="SELL" />
                            <el-option label="持有" value="HOLD" />
                        </el-select>
                    </div>
                </el-col>

                <el-col :span="6">
                    <div class="filter-item">
                        <div class="filter-label">风险等级</div>
                        <el-select v-model="filters.riskLevel" placeholder="选择风险等级" clearable style="width: 100%">
                            <el-option label="低风险" value="LOW" />
                            <el-option label="中风险" value="MEDIUM" />
                            <el-option label="高风险" value="HIGH" />
                        </el-select>
                    </div>
                </el-col>

                <el-col :span="6">
                    <div class="filter-item">
                        <div class="filter-label">日期范围</div>
                        <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD" style="width: 100%" />
                    </div>
                </el-col>
            </el-row>

            <!-- 高级筛选条件 -->
            <el-collapse-transition>
                <div v-show="showAdvanced" class="advanced-filters">
                    <el-divider>高级筛选</el-divider>

                    <el-row :gutter="20">
                        <el-col :span="6">
                            <div class="filter-item">
                                <div class="filter-label">置信度范围</div>
                                <div class="range-slider">
                                    <el-slider v-model="confidenceRange" range :min="0" :max="100" :step="5"
                                        show-stops />
                                    <div class="range-values">
                                        {{ confidenceRange[0] }}% - {{ confidenceRange[1] }}%
                                    </div>
                                </div>
                            </div>
                        </el-col>

                        <el-col :span="6">
                            <div class="filter-item">
                                <div class="filter-label">投票一致性</div>
                                <el-slider v-model="filters.voteConsistency" :min="0" :max="100" :step="10" show-stops
                                    show-input />
                            </div>
                        </el-col>

                        <el-col :span="6">
                            <div class="filter-item">
                                <div class="filter-label">质量评分</div>
                                <el-rate v-model="filters.qualityScore" :max="5"
                                    :colors="['#99A9BF', '#F7BA2A', '#FF9900']" show-score text-color="#ff9900"
                                    score-template="{value} 分以上" />
                            </div>
                        </el-col>

                        <el-col :span="6">
                            <div class="filter-item">
                                <div class="filter-label">模型数量</div>
                                <el-input-number v-model="filters.minModels" :min="1" :max="10" placeholder="最少模型数"
                                    controls-position="right" style="width: 100%" />
                            </div>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20" style="margin-top: 16px;">
                        <el-col :span="12">
                            <div class="filter-item">
                                <div class="filter-label">投票分布</div>
                                <div class="vote-distribution-filters">
                                    <div class="vote-filter-item">
                                        <span class="vote-label">买入票数 ≥</span>
                                        <el-input-number v-model="filters.minBuyVotes" :min="0" :max="10" size="small"
                                            controls-position="right" />
                                    </div>
                                    <div class="vote-filter-item">
                                        <span class="vote-label">卖出票数 ≥</span>
                                        <el-input-number v-model="filters.minSellVotes" :min="0" :max="10" size="small"
                                            controls-position="right" />
                                    </div>
                                    <div class="vote-filter-item">
                                        <span class="vote-label">持有票数 ≥</span>
                                        <el-input-number v-model="filters.minHoldVotes" :min="0" :max="10" size="small"
                                            controls-position="right" />
                                    </div>
                                </div>
                            </div>
                        </el-col>

                        <el-col :span="12">
                            <div class="filter-item">
                                <div class="filter-label">其他条件</div>
                                <div class="other-filters">
                                    <el-checkbox v-model="filters.onlyApproved">仅显示已批准决策</el-checkbox>
                                    <el-checkbox v-model="filters.onlyNew">仅显示今日新决策</el-checkbox>
                                    <el-checkbox v-model="filters.onlyExecutable">仅显示可执行决策</el-checkbox>
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                </div>
            </el-collapse-transition>

            <!-- 筛选结果统计 -->
            <div class="filter-stats" v-if="filteredCount > 0">
                <el-divider>筛选结果</el-divider>
                <div class="stats-content">
                    <div class="stat-item">
                        <span class="stat-label">符合条件:</span>
                        <span class="stat-value">{{ filteredCount }} 个决策</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">买入:</span>
                        <span class="stat-value buy">{{ buyCount }} 个</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">卖出:</span>
                        <span class="stat-value sell">{{ sellCount }} 个</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">持有:</span>
                        <span class="stat-value hold">{{ holdCount }} 个</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">平均置信度:</span>
                        <span class="stat-value">{{ avgConfidence }}%</span>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Refresh, Setting } from '@element-plus/icons-vue'
import { useDecisionStore } from '@/store/decisions'
import type { DecisionResponse } from '@/types/api'

// 事件定义
const emit = defineEmits<{
    search: [filters: any]
    reset: []
}>()

// Store
const decisionStore = useDecisionStore()

// 状态
const showAdvanced = ref(false)
const dateRange = ref<string[]>([])
const confidenceRange = ref([0, 100])

// 筛选条件
const filters = ref({
    symbol: '',
    decisionType: '',
    riskLevel: '',
    voteConsistency: 0,
    qualityScore: 0,
    minModels: 0,
    minBuyVotes: 0,
    minSellVotes: 0,
    minHoldVotes: 0,
    onlyApproved: false,
    onlyNew: false,
    onlyExecutable: false
})

// 计算属性
const filteredDecisions = computed(() => {
    return decisionStore.filteredDecisions.filter(decision => {
        // 股票代码筛选
        if (filters.value.symbol && !decision.symbol.toLowerCase().includes(filters.value.symbol.toLowerCase())) {
            return false
        }

        // 决策类型筛选
        if (filters.value.decisionType && decision.final_decision.decision !== filters.value.decisionType) {
            return false
        }

        // 风险等级筛选
        if (filters.value.riskLevel && decision.risk_assessment.risk_level !== filters.value.riskLevel) {
            return false
        }

        // 日期范围筛选
        if (dateRange.value && dateRange.value.length === 2) {
            const [startDate, endDate] = dateRange.value
            if (decision.trade_date < startDate || decision.trade_date > endDate) {
                return false
            }
        }

        // 置信度范围筛选
        const confidence = decision.final_decision.confidence
        if (confidence < confidenceRange.value[0] || confidence > confidenceRange.value[1]) {
            return false
        }

        // 投票一致性筛选
        if (filters.value.voteConsistency > 0) {
            const voteSummary = decision.final_decision.vote_summary
            const totalVotes = voteSummary.BUY + voteSummary.SELL + voteSummary.HOLD
            if (totalVotes > 0) {
                const maxVotes = Math.max(voteSummary.BUY, voteSummary.SELL, voteSummary.HOLD)
                const consistency = (maxVotes / totalVotes) * 100
                if (consistency < filters.value.voteConsistency) {
                    return false
                }
            }
        }

        // 质量评分筛选
        if (filters.value.qualityScore > 0) {
            // 这里需要实现质量评分计算
            const qualityScore = calculateQualityScore(decision)
            if (qualityScore < filters.value.qualityScore) {
                return false
            }
        }

        // 模型数量筛选
        if (filters.value.minModels > 0) {
            const modelCount = decision.final_decision.model_details.length
            if (modelCount < filters.value.minModels) {
                return false
            }
        }

        // 投票分布筛选
        const voteSummary = decision.final_decision.vote_summary
        if (voteSummary.BUY < filters.value.minBuyVotes) {
            return false
        }
        if (voteSummary.SELL < filters.value.minSellVotes) {
            return false
        }
        if (voteSummary.HOLD < filters.value.minHoldVotes) {
            return false
        }

        // 其他条件筛选
        if (filters.value.onlyApproved && !decision.risk_assessment.is_approved) {
            return false
        }

        if (filters.value.onlyNew) {
            const decisionTime = new Date(decision.timestamp).getTime()
            const now = Date.now()
            const isToday = now - decisionTime < 24 * 60 * 60 * 1000
            if (!isToday) {
                return false
            }
        }

        if (filters.value.onlyExecutable) {
            const isExecutable = decision.final_decision.confidence >= 70 &&
                decision.risk_assessment.risk_level !== 'HIGH'
            if (!isExecutable) {
                return false
            }
        }

        return true
    })
})

const filteredCount = computed(() => filteredDecisions.value.length)

const buyCount = computed(() => {
    return filteredDecisions.value.filter(d => d.final_decision.decision === 'BUY').length
})

const sellCount = computed(() => {
    return filteredDecisions.value.filter(d => d.final_decision.decision === 'SELL').length
})

const holdCount = computed(() => {
    return filteredDecisions.value.filter(d => d.final_decision.decision === 'HOLD').length
})

const avgConfidence = computed(() => {
    if (filteredDecisions.value.length === 0) return 0
    const total = filteredDecisions.value.reduce((sum, d) => sum + d.final_decision.confidence, 0)
    return Math.round(total / filteredDecisions.value.length)
})

// 方法
const handleSymbolInput = () => {
    filters.value.symbol = filters.value.symbol.toUpperCase()
}

const calculateQualityScore = (decision: DecisionResponse): number => {
    // 简化的质量评分计算
    const { final_decision, risk_assessment } = decision

    let score = final_decision.confidence * 0.6 // 置信度权重 60%

    // 风险等级权重 20%
    const riskWeights: Record<string, number> = {
        LOW: 1.0,
        MEDIUM: 0.7,
        HIGH: 0.4
    }
    score += (riskWeights[risk_assessment.risk_level] || 0.5) * 20

    // 投票一致性权重 20%
    const voteSummary = final_decision.vote_summary
    const totalVotes = voteSummary.BUY + voteSummary.SELL + voteSummary.HOLD
    if (totalVotes > 0) {
        const maxVotes = Math.max(voteSummary.BUY, voteSummary.SELL, voteSummary.HOLD)
        const consistency = maxVotes / totalVotes
        score += consistency * 20
    }

    return Math.round(score / 20) // 转换为5分制
}

const handleSearch = () => {
    const searchFilters = {
        ...filters.value,
        startDate: dateRange.value?.[0] || '',
        endDate: dateRange.value?.[1] || '',
        minConfidence: confidenceRange.value[0],
        maxConfidence: confidenceRange.value[1]
    }

    emit('search', searchFilters)
}

const handleReset = () => {
    filters.value = {
        symbol: '',
        decisionType: '',
        riskLevel: '',
        voteConsistency: 0,
        qualityScore: 0,
        minModels: 0,
        minBuyVotes: 0,
        minSellVotes: 0,
        minHoldVotes: 0,
        onlyApproved: false,
        onlyNew: false,
        onlyExecutable: false
    }

    dateRange.value = []
    confidenceRange.value = [0, 100]

    emit('reset')
}

// 监听筛选条件变化，自动搜索
watch(
    [filters, dateRange, confidenceRange],
    () => {
        // 可以在这里实现自动搜索，或者保留手动搜索
        // handleSearch()
    },
    { deep: true }
)
</script>

<style scoped>
.decision-filters {
    width: 100%;
    margin-bottom: 20px;
}

.filters-card {
    border-radius: 8px;
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

.filter-item {
    margin-bottom: 16px;
}

.filter-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
    font-weight: 500;
}

.range-slider {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.range-values {
    font-size: 12px;
    color: #909399;
    text-align: center;
}

.vote-distribution-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.vote-filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.vote-label {
    font-size: 12px;
    color: #606266;
    min-width: 60px;
}

.other-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-stats {
    margin-top: 16px;
}

.stats-content {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.stat-label {
    font-size: 14px;
    color: #606266;
}

.stat-value {
    font-size: 14px;
    font-weight: bold;
    color: #303133;
}

.stat-value.buy {
    color: #67c23a;
}

.stat-value.sell {
    color: #f56c6c;
}

.stat-value.hold {
    color: #e6a23c;
}

.advanced-filters {
    margin-top: 16px;
}
</style>