<template>
    <div class="decision-stats">
        <!-- 基础统计卡片 -->
        <el-row :gutter="20" class="stats-cards">
            <el-col :span="6">
                <el-card class="stat-card total">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon>
                                <DataBoard />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ stats.total }}</div>
                            <div class="stat-label">总决策数</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card buy">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon>
                                <TrendCharts />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ stats.buyCount }}</div>
                            <div class="stat-label">买入决策</div>
                            <div class="stat-percentage">{{ stats.buyPercentage.toFixed(1) }}%</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card sell">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon>
                                <SortDown />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ stats.sellCount }}</div>
                            <div class="stat-label">卖出决策</div>
                            <div class="stat-percentage">{{ stats.sellPercentage.toFixed(1) }}%</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card hold">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon>
                                <PieChart />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ stats.holdCount }}</div>
                            <div class="stat-label">持有决策</div>
                            <div class="stat-percentage">{{ stats.holdPercentage.toFixed(1) }}%</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 图表统计 -->
        <el-row :gutter="20" class="charts-section">
            <el-col :span="12">
                <el-card class="chart-card">
                    <template #header>
                        <div class="chart-header">
                            <span class="chart-title">决策类型分布</span>
                            <el-button type="primary" link :icon="Refresh" @click="refreshCharts">
                                刷新
                            </el-button>
                        </div>
                    </template>

                    <div class="chart-container">
                        <div ref="typeChartRef" class="chart" style="height: 300px;"></div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="12">
                <el-card class="chart-card">
                    <template #header>
                        <div class="chart-header">
                            <span class="chart-title">置信度分布</span>
                            <el-button type="primary" link :icon="Refresh" @click="refreshCharts">
                                刷新
                            </el-button>
                        </div>
                    </template>

                    <div class="chart-container">
                        <div ref="confidenceChartRef" class="chart" style="height: 300px;"></div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 详细统计 -->
        <el-row :gutter="20" class="detailed-stats">
            <el-col :span="8">
                <el-card class="detail-card">
                    <template #header>
                        <span class="card-title">风险等级分布</span>
                    </template>

                    <div class="risk-distribution">
                        <div v-for="risk in riskDistribution" :key="risk.level" class="risk-item">
                            <div class="risk-info">
                                <div class="risk-level">
                                    <el-tag :type="getRiskType(risk.level)" size="small">
                                        {{ getRiskText(risk.level) }}
                                    </el-tag>
                                </div>
                                <div class="risk-count">{{ risk.count }}</div>
                                <div class="risk-percentage">{{ risk.percentage.toFixed(1) }}%</div>
                            </div>
                            <div class="risk-bar">
                                <div class="risk-fill" :style="{
                                    width: `${risk.percentage}%`,
                                    backgroundColor: getRiskColor(risk.level)
                                }" />
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card class="detail-card">
                    <template #header>
                        <span class="card-title">质量评分分布</span>
                    </template>

                    <div class="quality-distribution">
                        <div v-for="quality in qualityDistribution" :key="quality.score" class="quality-item">
                            <div class="quality-info">
                                <div class="quality-score">
                                    <el-rate :model-value="quality.score" disabled :max="5"
                                        :colors="['#99A9BF', '#F7BA2A', '#FF9900']" />
                                    <span class="score-text">{{ quality.score }}分</span>
                                </div>
                                <div class="quality-count">{{ quality.count }}</div>
                                <div class="quality-percentage">{{ quality.percentage.toFixed(1) }}%</div>
                            </div>
                            <div class="quality-bar">
                                <div class="quality-fill" :style="{ width: `${quality.percentage}%` }" />
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card class="detail-card">
                    <template #header>
                        <span class="card-title">实时监控</span>
                    </template>

                    <div class="monitoring-stats">
                        <div class="monitoring-item">
                            <div class="monitoring-label">今日新决策</div>
                            <div class="monitoring-value">{{ todayStats.newDecisions }}</div>
                            <div class="monitoring-trend" :class="getTrendClass(todayStats.trend)">
                                <el-icon v-if="todayStats.trend > 0">
                                    <Top />
                                </el-icon>
                                <el-icon v-else-if="todayStats.trend < 0">
                                    <Bottom />
                                </el-icon>
                                <el-icon v-else>
                                    <Minus />
                                </el-icon>
                                {{ Math.abs(todayStats.trend) }}%
                            </div>
                        </div>

                        <div class="monitoring-item">
                            <div class="monitoring-label">平均置信度</div>
                            <div class="monitoring-value">{{ todayStats.avgConfidence }}%</div>
                            <div class="monitoring-change" :class="getChangeClass(todayStats.confidenceChange)">
                                {{ todayStats.confidenceChange > 0 ? '+' : '' }}{{ todayStats.confidenceChange }}%
                            </div>
                        </div>

                        <div class="monitoring-item">
                            <div class="monitoring-label">执行成功率</div>
                            <div class="monitoring-value">{{ todayStats.successRate }}%</div>
                            <div class="monitoring-change" :class="getChangeClass(todayStats.successRateChange)">
                                {{ todayStats.successRateChange > 0 ? '+' : '' }}{{ todayStats.successRateChange }}%
                            </div>
                        </div>

                        <div class="monitoring-item">
                            <div class="monitoring-label">活跃模型</div>
                            <div class="monitoring-value">{{ todayStats.activeModels }}</div>
                            <div class="monitoring-status" :class="getStatusClass(todayStats.systemStatus)">
                                {{ getStatusText(todayStats.systemStatus) }}
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 时间趋势分析 -->
        <el-card class="trend-analysis-card">
            <template #header>
                <div class="card-header">
                    <span class="card-title">决策趋势分析</span>
                    <div class="header-actions">
                        <el-select v-model="trendPeriod" placeholder="选择时间范围" style="width: 120px;">
                            <el-option label="最近7天" value="7d" />
                            <el-option label="最近30天" value="30d" />
                            <el-option label="最近90天" value="90d" />
                        </el-select>
                        <el-button type="primary" :icon="Download" @click="exportStats">
                            导出报告
                        </el-button>
                    </div>
                </div>
            </template>

            <div class="trend-chart-container">
                <div ref="trendChartRef" class="chart" style="height: 400px;"></div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Refresh, Download, DataBoard, TrendCharts, SortDown, PieChart, Top, Bottom, Minus } from '@element-plus/icons-vue'
import { useDecisionStore } from '@/store/decisions'
import { getRiskLevelText, getRiskLevelColor } from '@/utils/decisionUtils'
import type { DecisionResponse } from '@/types/api'

// Store
const decisionStore = useDecisionStore()

// 图表引用
const typeChartRef = ref<HTMLElement>()
const confidenceChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

// 状态
const trendPeriod = ref('7d')
const chartsInitialized = ref(false)

// 计算属性
const stats = computed(() => decisionStore.stats)

const riskDistribution = computed(() => {
    const distribution = decisionStore.stats.riskDistribution || { LOW: 0, MEDIUM: 0, HIGH: 0 }
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)

    return Object.entries(distribution).map(([level, count]) => ({
        level,
        count,
        percentage: total > 0 ? (count as number / total * 100) : 0
    }))
})

const qualityDistribution = computed(() => {
    // 模拟质量评分分布数据
    const distribution = [
        { score: 5, count: Math.floor(stats.value.total * 0.2) },
        { score: 4, count: Math.floor(stats.value.total * 0.3) },
        { score: 3, count: Math.floor(stats.value.total * 0.25) },
        { score: 2, count: Math.floor(stats.value.total * 0.15) },
        { score: 1, count: Math.floor(stats.value.total * 0.1) }
    ]

    const total = distribution.reduce((sum, item) => sum + item.count, 0)

    return distribution.map(item => ({
        ...item,
        percentage: total > 0 ? (item.count / total * 100) : 0
    }))
})

const todayStats = computed(() => {
    // 模拟今日统计数据
    return {
        newDecisions: Math.floor(Math.random() * 20) + 5,
        trend: Math.floor(Math.random() * 40) - 20, // -20% 到 +20%
        avgConfidence: Math.floor(Math.random() * 30) + 65, // 65% 到 95%
        confidenceChange: Math.floor(Math.random() * 10) - 5, // -5% 到 +5%
        successRate: Math.floor(Math.random() * 30) + 70, // 70% 到 100%
        successRateChange: Math.floor(Math.random() * 8) - 4, // -4% 到 +4%
        activeModels: Math.floor(Math.random() * 5) + 3, // 3 到 8
        systemStatus: Math.random() > 0.1 ? 'normal' : 'warning' // 90% 正常，10% 警告
    }
})

// 方法
const getRiskType = (riskLevel: string) => {
    const types: Record<string, string> = {
        LOW: 'success',
        MEDIUM: 'warning',
        HIGH: 'danger'
    }
    return types[riskLevel] || 'info'
}

const getRiskText = getRiskLevelText

const getRiskColor = getRiskLevelColor

const getTrendClass = (trend: number) => {
    if (trend > 0) return 'trend-up'
    if (trend < 0) return 'trend-down'
    return 'trend-stable'
}

const getChangeClass = (change: number) => {
    if (change > 0) return 'change-up'
    if (change < 0) return 'change-down'
    return 'change-stable'
}

const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
        normal: 'status-normal',
        warning: 'status-warning',
        error: 'status-error'
    }
    return classes[status] || 'status-unknown'
}

const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
        normal: '正常',
        warning: '警告',
        error: '异常'
    }
    return texts[status] || '未知'
}

const refreshCharts = () => {
    // 重新初始化图表
    initCharts()
}

const initCharts = () => {
    // 这里应该使用 ECharts 初始化图表
    // 由于环境限制，这里只做模拟实现
    console.log('初始化图表...')
    chartsInitialized.value = true
}

const exportStats = () => {
    // 导出统计报告
    console.log('导出统计报告...')
}

// 生命周期
onMounted(() => {
    // 初始化图表
    initCharts()

    // 监听窗口大小变化，重新渲染图表
    window.addEventListener('resize', initCharts)
})

onUnmounted(() => {
    // 清理事件监听
    window.removeEventListener('resize', initCharts)
})
</script>

<style scoped>
.decision-stats {
    width: 100%;
}

.stats-cards {
    margin-bottom: 20px;
}

.stat-card {
    border-radius: 8px;
    transition: all 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.total {
    border-left: 4px solid #409eff;
}

.stat-card.buy {
    border-left: 4px solid #67c23a;
}

.stat-card.sell {
    border-left: 4px solid #f56c6c;
}

.stat-card.hold {
    border-left: 4px solid #e6a23c;
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

.stat-card.total .stat-icon {
    background-color: #409eff;
}

.stat-card.buy .stat-icon {
    background-color: #67c23a;
}

.stat-card.sell .stat-icon {
    background-color: #f56c6c;
}

.stat-card.hold .stat-icon {
    background-color: #e6a23c;
}

.stat-icon .el-icon {
    font-size: 24px;
}

.stat-info {
    flex: 1;
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
    margin-bottom: 2px;
}

.stat-percentage {
    font-size: 12px;
    color: #67c23a;
    font-weight: 500;
}

.stat-card.sell .stat-percentage {
    color: #f56c6c;
}

.charts-section {
    margin-bottom: 20px;
}

.chart-card {
    border-radius: 8px;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chart-title {
    font-size: 16px;
    font-weight: bold;
}

.chart-container {
    padding: 10px;
}

.chart {
    width: 100%;
}

.detailed-stats {
    margin-bottom: 20px;
}

.detail-card {
    border-radius: 8px;
}

.card-title {
    font-size: 16px;
    font-weight: bold;
}

.risk-distribution,
.quality-distribution {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.risk-item,
.quality-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.risk-info,
.quality-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.risk-level,
.quality-score {
    display: flex;
    align-items: center;
    gap: 8px;
}

.score-text {
    font-size: 12px;
    color: #909399;
}

.risk-count,
.quality-count {
    font-size: 14px;
    font-weight: bold;
    color: #303133;
}

.risk-percentage,
.quality-percentage {
    font-size: 12px;
    color: #909399;
    width: 40px;
    text-align: right;
}

.risk-bar,
.quality-bar {
    height: 6px;
    background-color: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;
}

.risk-fill,
.quality-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.quality-fill {
    background: linear-gradient(90deg, #99A9BF, #FF9900);
}

.monitoring-stats {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.monitoring-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 6px;
}

.monitoring-label {
    font-size: 14px;
    color: #606266;
}

.monitoring-value {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.monitoring-trend,
.monitoring-change,
.monitoring-status {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 3px;
}

.trend-up,
.change-up {
    color: #67c23a;
    background-color: #f0f9ff;
}

.trend-down,
.change-down {
    color: #f56c6c;
    background-color: #fef0f0;
}

.trend-stable,
.change-stable {
    color: #909399;
    background-color: #f4f4f5;
}

.status-normal {
    color: #67c23a;
    background-color: #f0f9ff;
}

.status-warning {
    color: #e6a23c;
    background-color: #fdf6ec;
}

.status-error {
    color: #f56c6c;
    background-color: #fef0f0;
}

.status-unknown {
    color: #909399;
    background-color: #f4f4f5;
}

.trend-analysis-card {
    border-radius: 8px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.trend-chart-container {
    padding: 10px;
}
</style>