<template>
    <div class="performance-chart">
        <!-- 图表类型选择 -->
        <div class="chart-controls">
            <el-radio-group v-model="chartType" size="small">
                <el-radio-button label="accuracy">准确率</el-radio-button>
                <el-radio-button label="return">收益曲线</el-radio-button>
                <el-radio-button label="sharpe">夏普比率</el-radio-button>
                <el-radio-button label="drawdown">回撤分析</el-radio-button>
                <el-radio-button label="comparison">多模型对比</el-radio-button>
            </el-radio-group>

            <div class="control-actions">
                <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
                    end-placeholder="结束日期" value-format="YYYY-MM-DD" size="small" @change="handleDateRangeChange" />
                <el-button size="small" :icon="Refresh" @click="refreshData">
                    刷新
                </el-button>
            </div>
        </div>

        <!-- 图表容器 -->
        <div ref="chartRef" :style="{ height: `${height}px`, width: '100%' }"></div>

        <!-- 无数据提示 -->
        <div v-if="!hasData" class="no-data">
            <el-empty description="暂无性能数据" :image-size="100">
                <el-button type="primary" @click="refreshData">
                    获取数据
                </el-button>
            </el-empty>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { useModelStore } from '@/store/models'
import type { ModelPerformance } from '@/types/api'

// 引入 ECharts
import * as echarts from 'echarts'

// Props
interface Props {
    modelId?: number
    height?: number
    compareModelIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
    height: 400,
    compareModelIds: () => []
})

// Store
const modelStore = useModelStore()

// 响应式数据
const chartRef = ref<HTMLDivElement>()
const chartInstance = ref<echarts.ECharts>()
const chartType = ref('accuracy')
const dateRange = ref<string[]>([])
const loading = ref(false)

// 计算属性
const hasData = computed(() => {
    return modelStore.modelPerformance.length > 0
})

const performanceData = computed(() => {
    return modelStore.modelPerformance
})

// 方法
const initChart = () => {
    if (!chartRef.value) return

    chartInstance.value = echarts.init(chartRef.value)
    updateChart()

    // 响应窗口大小变化
    window.addEventListener('resize', handleResize)
}

const handleResize = () => {
    if (chartInstance.value) {
        chartInstance.value.resize()
    }
}

const updateChart = () => {
    if (!chartInstance.value || !hasData.value) return

    const option = getChartOption()
    chartInstance.value.setOption(option, true)
}

const getChartOption = (): echarts.EChartsOption => {
    switch (chartType.value) {
        case 'accuracy':
            return getAccuracyChartOption()
        case 'return':
            return getReturnChartOption()
        case 'sharpe':
            return getSharpeChartOption()
        case 'drawdown':
            return getDrawdownChartOption()
        case 'comparison':
            return getComparisonChartOption()
        default:
            return getAccuracyChartOption()
    }
}

const getAccuracyChartOption = (): echarts.EChartsOption => {
    const dates = performanceData.value.map((item: ModelPerformance) => item.backtest_date)
    const accuracy = performanceData.value.map((item: ModelPerformance) => item.accuracy * 100)
    const precision = performanceData.value.map((item: ModelPerformance) => item.precision * 100)
    const recall = performanceData.value.map((item: ModelPerformance) => item.recall * 100)
    const f1Score = performanceData.value.map((item: ModelPerformance) => item.f1_score * 100)

    return {
        title: {
            text: '模型准确率历史',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const date = params[0].axisValue
                let result = `${date}<br/>`
                params.forEach((param: any) => {
                    result += `${param.marker} ${param.seriesName}: ${param.value.toFixed(2)}%<br/>`
                })
                return result
            }
        },
        legend: {
            data: ['准确率', '精确率', '召回率', 'F1分数'],
            bottom: 10
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '百分比 (%)',
            min: 0,
            max: 100,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '准确率',
                type: 'line',
                data: accuracy,
                smooth: true,
                lineStyle: {
                    width: 3
                }
            },
            {
                name: '精确率',
                type: 'line',
                data: precision,
                smooth: true
            },
            {
                name: '召回率',
                type: 'line',
                data: recall,
                smooth: true
            },
            {
                name: 'F1分数',
                type: 'line',
                data: f1Score,
                smooth: true
            }
        ]
    }
}

const getReturnChartOption = (): echarts.EChartsOption => {
    const dates = performanceData.value.map((item: ModelPerformance) => item.backtest_date)
    const totalReturn = performanceData.value.map((item: ModelPerformance) => item.total_return * 100)

    return {
        title: {
            text: '累计收益曲线',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const param = params[0]
                return `${param.axisValue}<br/>${param.marker} ${param.seriesName}: ${param.value.toFixed(2)}%`
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '收益率 (%)',
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '累计收益',
                type: 'line',
                data: totalReturn,
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: '#67c23a'
                },
                itemStyle: {
                    color: '#67c23a'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
                        { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
                    ])
                }
            }
        ]
    }
}

const getSharpeChartOption = (): echarts.EChartsOption => {
    const dates = performanceData.value.map((item: ModelPerformance) => item.backtest_date)
    const sharpe = performanceData.value.map((item: ModelPerformance) => item.sharpe_ratio)

    return {
        title: {
            text: '夏普比率历史',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '夏普比率'
        },
        series: [
            {
                name: '夏普比率',
                type: 'line',
                data: sharpe,
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: '#409eff'
                },
                itemStyle: {
                    color: '#409eff'
                }
            }
        ]
    }
}

const getDrawdownChartOption = (): echarts.EChartsOption => {
    const dates = performanceData.value.map((item: ModelPerformance) => item.backtest_date)
    const drawdown = performanceData.value.map((item: ModelPerformance) => item.max_drawdown * 100)

    return {
        title: {
            text: '最大回撤分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const param = params[0]
                return `${param.axisValue}<br/>${param.marker} ${param.seriesName}: ${param.value.toFixed(2)}%`
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '回撤 (%)',
            inverse: true,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '最大回撤',
                type: 'bar',
                data: drawdown,
                itemStyle: {
                    color: '#e6a23c'
                },
                emphasis: {
                    itemStyle: {
                        color: '#d48806'
                    }
                }
            }
        ]
    }
}

const getComparisonChartOption = (): echarts.EChartsOption => {
    // 这里需要实现多模型对比逻辑
    // 暂时返回空配置
    return {
        title: {
            text: '多模型对比',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['当前模型'],
            bottom: 10
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: performanceData.value.map((item: ModelPerformance) => item.backtest_date),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '当前模型',
                type: 'line',
                data: performanceData.value.map((item: ModelPerformance) => item.accuracy * 100),
                smooth: true
            }
        ]
    }
}

const handleDateRangeChange = () => {
    refreshData()
}

const refreshData = async () => {
    if (!props.modelId) return

    loading.value = true
    try {
        const startDate = dateRange.value?.[0] || undefined
        const endDate = dateRange.value?.[1] || undefined

        await modelStore.fetchModelPerformance(props.modelId, startDate, endDate)
        updateChart()
    } catch (error) {
        console.error('刷新性能数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 监听器
watch(() => chartType.value, () => {
    updateChart()
})

watch(() => performanceData.value, () => {
    updateChart()
})

watch(() => props.modelId, (newModelId: number | undefined) => {
    if (newModelId) {
        refreshData()
    }
})

// 生命周期
onMounted(() => {
    initChart()
    if (props.modelId) {
        refreshData()
    }
})

onUnmounted(() => {
    if (chartInstance.value) {
        chartInstance.value.dispose()
    }
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.performance-chart {
    position: relative;
}

.chart-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
}

.control-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    height: v-bind('height + "px"');
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .chart-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .control-actions {
        justify-content: space-between;
    }
}
</style>