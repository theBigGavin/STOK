<template>
    <div class="backtest-charts">
        <!-- 图表选项卡 -->
        <el-tabs v-model="activeTab" type="border-card">
            <!-- 权益曲线 -->
            <el-tab-pane label="权益曲线" name="equity">
                <div class="chart-container">
                    <div ref="equityChart" class="chart" style="height: 400px;"></div>
                </div>
            </el-tab-pane>

            <!-- 回撤分析 -->
            <el-tab-pane label="回撤分析" name="drawdown">
                <div class="chart-container">
                    <div ref="drawdownChart" class="chart" style="height: 400px;"></div>
                </div>
            </el-tab-pane>

            <!-- 持仓分布 -->
            <el-tab-pane label="持仓分布" name="holdings">
                <div class="chart-container">
                    <div ref="holdingsChart" class="chart" style="height: 400px;"></div>
                </div>
            </el-tab-pane>

            <!-- 交易分析 -->
            <el-tab-pane label="交易分析" name="trades">
                <div class="chart-container">
                    <div ref="tradesChart" class="chart" style="height: 400px;"></div>
                </div>
            </el-tab-pane>
        </el-tabs>

        <!-- 图表控制 -->
        <div class="chart-controls">
            <el-button-group>
                <el-button :type="chartPeriod === '1m' ? 'primary' : 'default'" @click="setChartPeriod('1m')">
                    1月
                </el-button>
                <el-button :type="chartPeriod === '3m' ? 'primary' : 'default'" @click="setChartPeriod('3m')">
                    3月
                </el-button>
                <el-button :type="chartPeriod === '6m' ? 'primary' : 'default'" @click="setChartPeriod('6m')">
                    6月
                </el-button>
                <el-button :type="chartPeriod === '1y' ? 'primary' : 'default'" @click="setChartPeriod('1y')">
                    1年
                </el-button>
                <el-button :type="chartPeriod === 'all' ? 'primary' : 'default'" @click="setChartPeriod('all')">
                    全部
                </el-button>
            </el-button-group>

            <div class="chart-actions">
                <el-button :icon="Download" @click="exportChart">
                    导出图表
                </el-button>
                <el-button :icon="FullScreen" @click="toggleFullscreen">
                    全屏
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, FullScreen } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import type { BacktestResultDetail } from '@/types/api'
import { generateChartData } from '@/utils/backtestUtils'
import type { BacktestChartData } from '@/utils/backtestUtils'

// Props
const props = defineProps<{
    backtestResult: BacktestResultDetail
}>()

// 状态
const activeTab = ref('equity')
const chartPeriod = ref('all')
const isFullscreen = ref(false)

// 图表引用
const equityChart = ref<HTMLElement>()
const drawdownChart = ref<HTMLElement>()
const holdingsChart = ref<HTMLElement>()
const tradesChart = ref<HTMLElement>()

// 图表实例
let equityChartInstance: ECharts | null = null
let drawdownChartInstance: ECharts | null = null
let holdingsChartInstance: ECharts | null = null
let tradesChartInstance: ECharts | null = null

// 图表数据
const chartData = ref<BacktestChartData>({
    dates: [],
    equity: [],
    benchmark: [],
    drawdown: [],
    signals: []
})

// 方法
const initCharts = () => {
    if (!equityChart.value || !drawdownChart.value || !holdingsChart.value || !tradesChart.value) {
        return
    }

    // 初始化权益曲线图表
    equityChartInstance = echarts.init(equityChart.value)

    // 初始化回撤图表
    drawdownChartInstance = echarts.init(drawdownChart.value)

    // 初始化持仓分布图表
    holdingsChartInstance = echarts.init(holdingsChart.value)

    // 初始化交易分析图表
    tradesChartInstance = echarts.init(tradesChart.value)

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
}

const handleResize = () => {
    equityChartInstance?.resize()
    drawdownChartInstance?.resize()
    holdingsChartInstance?.resize()
    tradesChartInstance?.resize()
}

const setChartPeriod = (period: string) => {
    chartPeriod.value = period
    updateCharts()
}

const updateCharts = () => {
    updateEquityChart()
    updateDrawdownChart()
    updateHoldingsChart()
    updateTradesChart()
}

const updateEquityChart = () => {
    if (!equityChartInstance || !chartData.value.dates.length) return

    const option: EChartsOption = {
        title: {
            text: '权益曲线',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: (params: any) => {
                const date = params[0].axisValue
                const equity = params[0].data
                const benchmark = params[1]?.data || null

                let html = `<div style="font-weight: bold; margin-bottom: 8px;">${date}</div>`
                html += `<div>权益: ${formatCurrency(equity)}</div>`
                if (benchmark) {
                    html += `<div>基准: ${formatCurrency(benchmark)}</div>`
                }
                return html
            }
        },
        legend: {
            data: ['权益曲线', '基准收益'],
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
            data: chartData.value.dates,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: (value: number) => formatCurrency(value)
            }
        },
        series: [
            {
                name: '权益曲线',
                type: 'line',
                data: chartData.value.equity,
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: '#5470c6'
                },
                itemStyle: {
                    color: '#5470c6'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
                        { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
                    ])
                }
            },
            ...(chartData.value.benchmark ? [{
                name: '基准收益',
                type: 'line',
                data: chartData.value.benchmark,
                smooth: true,
                lineStyle: {
                    width: 1,
                    color: '#91cc75',
                    type: 'dashed'
                },
                itemStyle: {
                    color: '#91cc75'
                }
            }] : [])
        ]
    }

    equityChartInstance.setOption(option)
}

const updateDrawdownChart = () => {
    if (!drawdownChartInstance || !chartData.value.drawdown?.length) return

    const option: EChartsOption = {
        title: {
            text: '回撤分析',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: (params: any) => {
                const date = params[0].axisValue
                const drawdown = params[0].data
                return `<div style="font-weight: bold;">${date}</div>
                <div>回撤: ${drawdown.toFixed(2)}%</div>`
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
            data: chartData.value.dates,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value}%'
            },
            inverse: true
        },
        series: [
            {
                name: '回撤',
                type: 'bar',
                data: chartData.value.drawdown,
                itemStyle: {
                    color: (params: any) => {
                        const value = params.data
                        if (value > 10) return '#f56c6c'
                        if (value > 5) return '#e6a23c'
                        return '#67c23a'
                    }
                }
            }
        ]
    }

    drawdownChartInstance.setOption(option)
}

const updateHoldingsChart = () => {
    if (!holdingsChartInstance) return

    // 模拟持仓数据
    const holdingsData = [
        { name: 'AAPL', value: 35 },
        { name: 'GOOGL', value: 25 },
        { name: 'MSFT', value: 20 },
        { name: 'TSLA', value: 15 },
        { name: '其他', value: 5 }
    ]

    const option: EChartsOption = {
        title: {
            text: '持仓分布',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c}% ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'middle'
        },
        series: [
            {
                name: '持仓比例',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 18,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: holdingsData
            }
        ]
    }

    holdingsChartInstance.setOption(option)
}

const updateTradesChart = () => {
    if (!tradesChartInstance || !props.backtestResult.trades.length) return

    // 按月份统计交易
    const monthlyTrades: Record<string, { buy: number, sell: number }> = {}

    props.backtestResult.trades.forEach((trade: any) => {
        const month = trade.date.substring(0, 7) // YYYY-MM
        if (!monthlyTrades[month]) {
            monthlyTrades[month] = { buy: 0, sell: 0 }
        }
        if (trade.type === 'BUY') {
            monthlyTrades[month].buy++
        } else {
            monthlyTrades[month].sell++
        }
    })

    const months = Object.keys(monthlyTrades).sort()
    const buyData = months.map(month => monthlyTrades[month].buy)
    const sellData = months.map(month => monthlyTrades[month].sell)

    const option: EChartsOption = {
        title: {
            text: '交易分析',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['买入', '卖出'],
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
            data: months,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '交易次数'
        },
        series: [
            {
                name: '买入',
                type: 'bar',
                data: buyData,
                itemStyle: {
                    color: '#67c23a'
                }
            },
            {
                name: '卖出',
                type: 'bar',
                data: sellData,
                itemStyle: {
                    color: '#f56c6c'
                }
            }
        ]
    }

    tradesChartInstance.setOption(option)
}

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

const exportChart = () => {
    let chartInstance: ECharts | null = null

    switch (activeTab.value) {
        case 'equity':
            chartInstance = equityChartInstance
            break
        case 'drawdown':
            chartInstance = drawdownChartInstance
            break
        case 'holdings':
            chartInstance = holdingsChartInstance
            break
        case 'trades':
            chartInstance = tradesChartInstance
            break
    }

    if (chartInstance) {
        const dataURL = chartInstance.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff'
        })

        const link = document.createElement('a')
        link.href = dataURL
        link.download = `backtest_chart_${activeTab.value}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        ElMessage.success('图表导出成功')
    }
}

const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
    // 这里可以实现全屏逻辑
    ElMessage.info('全屏功能开发中')
}

// 监听
watch(() => props.backtestResult, (newResult: any) => {
    if (newResult) {
        // 生成图表数据
        chartData.value = generateChartData(
            newResult.trades.map((trade: any) => ({
                date: trade.date,
                value: trade.value
            })),
            newResult.trades.map((trade: any) => ({
                date: trade.date,
                decision: trade.type as 'BUY' | 'SELL',
                confidence: 0.8,
                signal_strength: 1,
                reasoning: trade.reason
            })),
            [] // 基准数据
        )

        nextTick(() => {
            updateCharts()
        })
    }
}, { deep: true })

watch(activeTab, () => {
    nextTick(() => {
        updateCharts()
    })
})

// 生命周期
onMounted(() => {
    nextTick(() => {
        initCharts()
        if (props.backtestResult) {
            chartData.value = generateChartData(
                props.backtestResult.trades.map((trade: any) => ({
                    date: trade.date,
                    value: trade.value
                })),
                props.backtestResult.trades.map((trade: any) => ({
                    date: trade.date,
                    decision: trade.type as 'BUY' | 'SELL',
                    confidence: 0.8,
                    signal_strength: 1,
                    reasoning: trade.reason
                })),
                [] // 基准数据
            )
            updateCharts()
        }
    })
})

onUnmounted(() => {
    equityChartInstance?.dispose()
    drawdownChartInstance?.dispose()
    holdingsChartInstance?.dispose()
    tradesChartInstance?.dispose()
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.backtest-charts {
    width: 100%;
}

.chart-container {
    position: relative;
    margin-bottom: 16px;
}

.chart {
    width: 100%;
    background: #fff;
    border-radius: 4px;
}

.chart-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
}

.chart-actions {
    display: flex;
    gap: 8px;
}

:deep(.el-tabs__content) {
    padding: 0;
}

:deep(.el-tab-pane) {
    padding: 0;
}
</style>