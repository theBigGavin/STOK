<template>
    <div class="backtest-compare">
        <el-card class="compare-card">
            <template #header>
                <div class="compare-header">
                    <span>回测结果比较</span>
                    <div class="header-actions">
                        <el-button :icon="Download" @click="exportComparison">导出比较</el-button>
                        <el-button :icon="Close" @click="clearComparison">关闭比较</el-button>
                    </div>
                </div>
            </template>

            <!-- 比较摘要 -->
            <div class="comparison-summary" v-if="comparisonResults">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <div class="summary-item">
                            <div class="summary-label">最佳表现</div>
                            <div class="summary-value best">
                                {{ comparisonResults.summary.best_performer || '无' }}
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="6">
                        <div class="summary-item">
                            <div class="summary-label">最差表现</div>
                            <div class="summary-value worst">
                                {{ comparisonResults.summary.worst_performer || '无' }}
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="6">
                        <div class="summary-item">
                            <div class="summary-label">平均收益率</div>
                            <div class="summary-value" :class="getReturnClass(comparisonResults.summary.avg_return)">
                                {{ formatPercentage(comparisonResults.summary.avg_return) }}
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="6">
                        <div class="summary-item">
                            <div class="summary-label">平均夏普比率</div>
                            <div class="summary-value">
                                {{ formatNumber(comparisonResults.summary.avg_sharpe) }}
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </div>

            <!-- 比较图表 -->
            <div class="comparison-charts">
                <el-tabs v-model="activeChart" type="border-card">
                    <el-tab-pane label="收益率对比" name="returns">
                        <div class="chart-container">
                            <div ref="returnsChart" class="chart" style="height: 400px;"></div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="风险指标对比" name="risk">
                        <div class="chart-container">
                            <div ref="riskChart" class="chart" style="height: 400px;"></div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="综合评分" name="score">
                        <div class="chart-container">
                            <div ref="scoreChart" class="chart" style="height: 400px;"></div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>

            <!-- 详细比较表格 -->
            <div class="comparison-table">
                <el-table :data="comparisonData" style="width: 100%"
                    :default-sort="{ prop: 'total_return', order: 'descending' }">
                    <el-table-column prop="symbol" label="股票/模型" width="120" fixed />
                    <el-table-column prop="total_return" label="总收益率" width="120" sortable>
                        <template #default="scope">
                            <span :class="getReturnClass(scope.row.total_return)">
                                {{ formatPercentage(scope.row.total_return) }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="annual_return" label="年化收益率" width="120" sortable>
                        <template #default="scope">
                            <span :class="getReturnClass(scope.row.annual_return)">
                                {{ formatPercentage(scope.row.annual_return) }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="sharpe_ratio" label="夏普比率" width="100" sortable>
                        <template #default="scope">
                            {{ formatNumber(scope.row.sharpe_ratio) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="max_drawdown" label="最大回撤" width="100" sortable>
                        <template #default="scope">
                            <span class="drawdown">
                                {{ formatPercentage(scope.row.max_drawdown) }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="volatility" label="波动率" width="100" sortable>
                        <template #default="scope">
                            {{ formatPercentage(scope.row.volatility) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="win_rate" label="胜率" width="100" sortable>
                        <template #default="scope">
                            {{ formatPercentage(scope.row.win_rate) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="profit_factor" label="利润因子" width="100" sortable>
                        <template #default="scope">
                            {{ formatNumber(scope.row.profit_factor) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="total_trades" label="交易次数" width="100" sortable />
                    <el-table-column label="综合评分" width="100" sortable>
                        <template #default="scope">
                            <el-rate v-model="scope.row.composite_score" disabled show-score text-color="#ff9900"
                                score-template="{value}" />
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import { useBacktestStore } from '@/store/backtest'
import { formatPercentage, formatNumber, getReturnColorClass } from '@/utils/backtestUtils'
import type { BacktestComparisonResponse, BacktestComparisonItem } from '@/types/api'

// Store
const backtestStore = useBacktestStore()

// 状态
const activeChart = ref('returns')

// 图表引用
const returnsChart = ref<HTMLElement>()
const riskChart = ref<HTMLElement>()
const scoreChart = ref<HTMLElement>()

// 图表实例
let returnsChartInstance: ECharts | null = null
let riskChartInstance: ECharts | null = null
let scoreChartInstance: ECharts | null = null

// 计算属性
const comparisonResults = computed(() => backtestStore.comparisonResults)

const comparisonData = computed(() => {
    if (!comparisonResults.value) return []

    return comparisonResults.value.comparison
        .filter((item: BacktestComparisonItem) => item.results)
        .map((item: BacktestComparisonItem) => ({
            symbol: item.symbol,
            model_id: item.model_id,
            ...item.results,
            composite_score: calculateCompositeScore(item.results)
        }))
})

// 方法
const getReturnClass = (returnRate: number) => {
    return getReturnColorClass(returnRate)
}

const calculateCompositeScore = (results: any) => {
    if (!results) return 0

    const weights = {
        total_return: 0.3,
        sharpe_ratio: 0.25,
        max_drawdown: 0.2,
        win_rate: 0.15,
        profit_factor: 0.1
    }

    let score = 0
    score += Math.max(0, results.total_return) * weights.total_return * 10
    score += Math.max(0, results.sharpe_ratio) * weights.sharpe_ratio * 2
    score += (100 - Math.max(0, results.max_drawdown)) * weights.max_drawdown * 0.1
    score += results.win_rate * weights.win_rate * 0.1
    score += Math.max(0, results.profit_factor) * weights.profit_factor * 2

    return Math.min(5, Math.max(0, score))
}

const initCharts = () => {
    if (!returnsChart.value || !riskChart.value || !scoreChart.value) return

    returnsChartInstance = echarts.init(returnsChart.value)
    riskChartInstance = echarts.init(riskChart.value)
    scoreChartInstance = echarts.init(scoreChart.value)

    window.addEventListener('resize', handleResize)
}

const handleResize = () => {
    returnsChartInstance?.resize()
    riskChartInstance?.resize()
    scoreChartInstance?.resize()
}

const updateCharts = () => {
    updateReturnsChart()
    updateRiskChart()
    updateScoreChart()
}

const updateReturnsChart = () => {
    if (!returnsChartInstance || !comparisonData.value.length) return

    const symbols = comparisonData.value.map((item: any) => item.symbol)
    const totalReturns = comparisonData.value.map((item: any) => item.total_return)
    const annualReturns = comparisonData.value.map((item: any) => item.annual_return)

    const option: EChartsOption = {
        title: {
            text: '收益率对比',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['总收益率', '年化收益率'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: symbols,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '总收益率',
                type: 'bar',
                data: totalReturns,
                itemStyle: {
                    color: (params: any) => {
                        return params.data > 0 ? '#67c23a' : '#f56c6c'
                    }
                }
            },
            {
                name: '年化收益率',
                type: 'line',
                data: annualReturns,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    width: 2,
                    color: '#409eff'
                },
                itemStyle: {
                    color: '#409eff'
                }
            }
        ]
    }

    returnsChartInstance.setOption(option)
}

const updateRiskChart = () => {
    if (!riskChartInstance || !comparisonData.value.length) return

    const symbols = comparisonData.value.map((item: any) => item.symbol)
    const sharpeRatios = comparisonData.value.map((item: any) => item.sharpe_ratio)
    const maxDrawdowns = comparisonData.value.map((item: any) => item.max_drawdown)

    const option: EChartsOption = {
        title: {
            text: '风险指标对比',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['夏普比率', '最大回撤'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: symbols,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '夏普比率',
                position: 'left'
            },
            {
                type: 'value',
                name: '最大回撤 (%)',
                position: 'right',
                inverse: true
            }
        ],
        series: [
            {
                name: '夏普比率',
                type: 'bar',
                data: sharpeRatios,
                itemStyle: {
                    color: '#e6a23c'
                }
            },
            {
                name: '最大回撤',
                type: 'line',
                yAxisIndex: 1,
                data: maxDrawdowns,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    width: 2,
                    color: '#f56c6c'
                },
                itemStyle: {
                    color: '#f56c6c'
                }
            }
        ]
    }

    riskChartInstance.setOption(option)
}

const updateScoreChart = () => {
    if (!scoreChartInstance || !comparisonData.value.length) return

    const symbols = comparisonData.value.map((item: any) => item.symbol)
    const scores = comparisonData.value.map((item: any) => item.composite_score)

    const option: EChartsOption = {
        title: {
            text: '综合评分',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: symbols,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 5,
            interval: 1
        },
        series: [
            {
                type: 'bar',
                data: scores,
                itemStyle: {
                    color: (params: any) => {
                        const score = params.data
                        if (score >= 4) return '#67c23a'
                        if (score >= 3) return '#e6a23c'
                        if (score >= 2) return '#f56c6c'
                        return '#909399'
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}'
                }
            }
        ]
    }

    scoreChartInstance.setOption(option)
}

const exportComparison = () => {
    if (!comparisonResults.value) return

    const exportData = {
        comparison: comparisonResults.value,
        export_timestamp: new Date().toISOString(),
        export_version: '1.0'
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backtest_comparison_${new Date().getTime()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('比较结果导出成功')
}

const clearComparison = () => {
    backtestStore.clearComparisonResults()
}

// 监听
watch(comparisonResults, () => {
    nextTick(() => {
        updateCharts()
    })
})

watch(activeChart, () => {
    nextTick(() => {
        updateCharts()
    })
})

// 生命周期
onMounted(() => {
    nextTick(() => {
        initCharts()
        updateCharts()
    })
})

onUnmounted(() => {
    returnsChartInstance?.dispose()
    riskChartInstance?.dispose()
    scoreChartInstance?.dispose()
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.backtest-compare {
    width: 100%;
    margin-bottom: 20px;
}

.compare-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.compare-card {
    border-radius: 8px;
}

.comparison-summary {
    margin-bottom: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 4px;
}

.summary-item {
    text-align: center;
}

.summary-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
}

.summary-value {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.summary-value.best {
    color: #67c23a;
}

.summary-value.worst {
    color: #f56c6c;
}

.comparison-charts {
    margin-bottom: 24px;
}

.chart-container {
    position: relative;
}

.chart {
    width: 100%;
    background: #fff;
    border-radius: 4px;
}

.comparison-table {
    margin-top: 16px;
}

.drawdown {
    color: #f56c6c;
    font-weight: bold;
}

:deep(.el-tabs__content) {
    padding: 0;
}

:deep(.el-tab-pane) {
    padding: 0;
}
</style>