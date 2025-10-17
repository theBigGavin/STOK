<template>
    <div class="stock-chart">
        <!-- 图表工具栏 -->
        <div class="chart-toolbar" v-if="showToolbar">
            <div class="toolbar-left">
                <span class="chart-title" v-if="title">{{ title }}</span>
                <span class="chart-subtitle" v-if="subtitle">{{ subtitle }}</span>
            </div>
            <div class="toolbar-right">
                <el-button-group>
                    <el-button v-for="period in timePeriods" :key="period.value"
                        :type="currentPeriod === period.value ? 'primary' : ''" size="small"
                        @click="handlePeriodChange(period.value)">
                        {{ period.label }}
                    </el-button>
                </el-button-group>

                <el-button-group class="chart-type-group">
                    <el-button v-for="type in chartTypes" :key="type.value"
                        :type="chartType === type.value ? 'primary' : ''" size="small"
                        @click="handleChartTypeChange(type.value)">
                        {{ type.label }}
                    </el-button>
                </el-button-group>

                <el-button :icon="Refresh" @click="handleRefresh" size="small">
                    刷新
                </el-button>

                <el-button :icon="Download" @click="handleExport" size="small">
                    导出
                </el-button>

                <el-button :icon="Setting" @click="showSettings = true" size="small">
                    设置
                </el-button>
            </div>
        </div>

        <!-- 技术指标选择器 -->
        <div class="indicator-selector" v-if="showIndicators">
            <el-checkbox-group v-model="selectedIndicators">
                <el-checkbox label="MA5">MA5</el-checkbox>
                <el-checkbox label="MA10">MA10</el-checkbox>
                <el-checkbox label="MA20">MA20</el-checkbox>
                <el-checkbox label="MA60">MA60</el-checkbox>
                <el-checkbox label="BOLL">布林带</el-checkbox>
                <el-checkbox label="MACD">MACD</el-checkbox>
                <el-checkbox label="RSI">RSI</el-checkbox>
                <el-checkbox label="VOLUME">成交量</el-checkbox>
            </el-checkbox-group>
        </div>

        <!-- 图表容器 -->
        <div class="chart-container" ref="chartContainer">
            <div v-if="loading" class="chart-loading">
                <el-icon class="is-loading">
                    <Loading />
                </el-icon>
                <span>加载中...</span>
            </div>

            <div v-else-if="!chartData || chartData.length === 0" class="chart-empty">
                <el-empty description="暂无数据" />
            </div>

            <div v-else ref="chartElement" class="chart-element" :style="{ height: chartHeight }" />
        </div>

        <!-- 图表设置对话框 -->
        <el-dialog v-model="showSettings" title="图表设置" width="600px">
            <el-form label-width="100px">
                <el-form-item label="图表类型">
                    <el-radio-group v-model="chartType">
                        <el-radio v-for="type in chartTypes" :key="type.value" :label="type.value">
                            {{ type.label }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="时间周期">
                    <el-radio-group v-model="currentPeriod">
                        <el-radio v-for="period in timePeriods" :key="period.value" :label="period.value">
                            {{ period.label }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="图表高度">
                    <el-input-number v-model="chartHeightNumber" :min="300" :max="1000" :step="50" />
                    <span class="unit">px</span>
                </el-form-item>

                <el-form-item label="显示网格">
                    <el-switch v-model="showGrid" />
                </el-form-item>

                <el-form-item label="显示数据标签">
                    <el-switch v-model="showDataLabels" />
                </el-form-item>

                <el-form-item label="动画效果">
                    <el-switch v-model="enableAnimation" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="showSettings = false">取消</el-button>
                <el-button type="primary" @click="applySettings">应用</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Refresh, Download, Setting, Loading } from '@element-plus/icons-vue'

interface Props {
    // 数据
    chartData?: any[]
    loading?: boolean
    // 图表配置
    title?: string
    subtitle?: string
    symbol?: string
    chartType?: 'candle' | 'line' | 'area' | 'bar'
    timePeriod?: '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all'
    showToolbar?: boolean
    showIndicators?: boolean
    height?: string | number
    // 技术指标
    indicators?: string[]
}

interface Emits {
    (e: 'refresh'): void
    (e: 'export'): void
    (e: 'period-change', period: string): void
    (e: 'chart-type-change', type: string): void
    (e: 'indicator-change', indicators: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
    chartData: () => [],
    loading: false,
    chartType: 'candle',
    timePeriod: '1m',
    showToolbar: true,
    showIndicators: true,
    height: '400px',
    indicators: () => ['MA5', 'MA10', 'VOLUME']
})

const emit = defineEmits<Emits>()

// 响应式数据
const chartElement = ref<HTMLDivElement>()
const chartContainer = ref<HTMLDivElement>()
const chartInstance = ref<any>(null)
const showSettings = ref(false)
const currentPeriod = ref(props.timePeriod)
const chartType = ref(props.chartType)
const selectedIndicators = ref<string[]>(props.indicators)
const chartHeightNumber = ref(400)
const showGrid = ref(true)
const showDataLabels = ref(false)
const enableAnimation = ref(true)

// 图表类型选项
const chartTypes = ref([
    { label: 'K线图', value: 'candle' },
    { label: '折线图', value: 'line' },
    { label: '面积图', value: 'area' },
    { label: '柱状图', value: 'bar' }
])

// 时间周期选项
const timePeriods = ref([
    { label: '1日', value: '1d' },
    { label: '1周', value: '1w' },
    { label: '1月', value: '1m' },
    { label: '3月', value: '3m' },
    { label: '6月', value: '6m' },
    { label: '1年', value: '1y' },
    { label: '全部', value: 'all' }
])

// 计算属性
const chartHeight = computed(() => {
    if (typeof props.height === 'number') {
        return `${props.height}px`
    }
    return props.height
})

// 监听数据变化
watch(() => props.chartData, () => {
    nextTick(() => {
        updateChart()
    })
}, { deep: true })

watch(() => props.loading, (newLoading: boolean) => {
    if (!newLoading) {
        nextTick(() => {
            updateChart()
        })
    }
})

watch(selectedIndicators, () => {
    nextTick(() => {
        updateChart()
    })
})

// 生命周期
onMounted(() => {
    initChart()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    if (chartInstance.value) {
        chartInstance.value.dispose()
    }
    window.removeEventListener('resize', handleResize)
})

// 方法

// 初始化图表
const initChart = () => {
    if (!chartElement.value) return

    // 这里应该初始化 ECharts 实例
    // chartInstance.value = echarts.init(chartElement.value)
    updateChart()
}

// 更新图表
const updateChart = () => {
    if (!chartInstance.value || !props.chartData?.length) return
    // 这里应该更新图表数据
}

// 窗口大小变化处理
const handleResize = () => {
    if (chartInstance.value) {
        chartInstance.value.resize()
    }
}

// 事件处理
const handleRefresh = () => {
    emit('refresh')
}

const handleExport = () => {
    emit('export')
}

const handlePeriodChange = (period: string) => {
    currentPeriod.value = period
    emit('period-change', period)
}

const handleChartTypeChange = (type: string) => {
    chartType.value = type as any
    emit('chart-type-change', type)
}

const applySettings = () => {
    showSettings.value = false
    updateChart()
}

// 暴露方法给父组件
defineExpose({
    getChartInstance: () => chartInstance.value,
    resize: () => {
        handleResize()
    }
})
</script>

<style scoped>
.stock-chart {
    width: 100%;
    height: 100%;
}

.chart-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
}

.toolbar-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.chart-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.chart-subtitle {
    font-size: 14px;
    color: #909399;
}

.toolbar-right {
    display: flex;
    gap: 8px;
    align-items: center;
}

.chart-type-group {
    margin: 0 8px;
}

.indicator-selector {
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
}

.chart-container {
    position: relative;
    width: 100%;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
}

.chart-loading,
.chart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: #909399;
}

.chart-element {
    width: 100%;
}

.unit {
    margin-left: 8px;
    color: #909399;
}

:deep(.el-checkbox-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

:deep(.el-checkbox) {
    margin-right: 0;
}

:deep(.el-button-group) {
    margin-right: 8px;
}
</style>