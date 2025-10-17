<template>
    <el-dialog v-model="visible" :title="`模型回测 - ${model?.name || '未知模型'}`" width="90%" top="5vh" destroy-on-close
        @close="handleClose">
        <div class="backtest-container">
            <!-- 回测配置 -->
            <el-card class="config-section" v-if="!backtestResult">
                <template #header>
                    <span>回测配置</span>
                </template>

                <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="left">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="股票代码" prop="symbol">
                                <el-select v-model="form.symbol" placeholder="请选择股票" filterable style="width: 100%">
                                    <el-option v-for="stock in stockOptions" :key="stock.symbol"
                                        :label="`${stock.symbol} - ${stock.name}`" :value="stock.symbol" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="初始资金" prop="initial_capital">
                                <el-input-number v-model="form.initial_capital" :min="1000" :max="10000000" :step="1000"
                                    placeholder="初始资金" style="width: 100%" />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="开始日期" prop="start_date">
                                <el-date-picker v-model="form.start_date" type="date" placeholder="选择开始日期"
                                    value-format="YYYY-MM-DD" style="width: 100%" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="结束日期" prop="end_date">
                                <el-date-picker v-model="form.end_date" type="date" placeholder="选择结束日期"
                                    value-format="YYYY-MM-DD" style="width: 100%" />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-form-item label="交易设置">
                        <el-checkbox v-model="form.include_transaction_costs">
                            包含交易成本
                        </el-checkbox>
                        <el-checkbox v-model="form.include_slippage">
                            包含滑点
                        </el-checkbox>
                    </el-form-item>

                    <el-form-item label="回测说明">
                        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入回测说明（可选）"
                            maxlength="200" show-word-limit />
                    </el-form-item>
                </el-form>
            </el-card>

            <!-- 回测结果 -->
            <div v-if="backtestResult" class="result-section">
                <!-- 结果概览 -->
                <el-card class="result-overview">
                    <template #header>
                        <span>回测结果概览</span>
                    </template>

                    <div class="overview-grid">
                        <div class="overview-item">
                            <div class="overview-value" :class="getReturnClass(backtestResult.total_return)">
                                {{ (backtestResult.total_return * 100).toFixed(2) }}%
                            </div>
                            <div class="overview-label">总收益</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-value">
                                {{ backtestResult.sharpe_ratio.toFixed(2) }}
                            </div>
                            <div class="overview-label">夏普比率</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-value" :class="getDrawdownClass(backtestResult.max_drawdown)">
                                {{ (backtestResult.max_drawdown * 100).toFixed(2) }}%
                            </div>
                            <div class="overview-label">最大回撤</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-value">
                                {{ (backtestResult.win_rate * 100).toFixed(1) }}%
                            </div>
                            <div class="overview-label">胜率</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-value">
                                {{ backtestResult.total_trades }}
                            </div>
                            <div class="overview-label">总交易次数</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-value">
                                {{ backtestResult.profit_factor.toFixed(2) }}
                            </div>
                            <div class="overview-label">盈利因子</div>
                        </div>
                    </div>
                </el-card>

                <!-- 收益曲线 -->
                <el-card class="result-chart">
                    <template #header>
                        <span>收益曲线</span>
                    </template>
                    <div ref="chartRef" style="height: 300px;"></div>
                </el-card>

                <!-- 交易记录 -->
                <el-card class="trade-records">
                    <template #header>
                        <span>交易记录</span>
                        <el-button size="small" @click="exportTrades">
                            导出交易记录
                        </el-button>
                    </template>

                    <el-table :data="backtestResult.trades" v-loading="loading" style="width: 100%" max-height="400">
                        <el-table-column prop="date" label="日期" width="120" />
                        <el-table-column prop="type" label="类型" width="80">
                            <template #default="scope">
                                <el-tag :type="scope.row.type === 'BUY' ? 'success' : 'danger'" size="small">
                                    {{ scope.row.type === 'BUY' ? '买入' : '卖出' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="price" label="价格" width="100">
                            <template #default="scope">
                                {{ scope.row.price.toFixed(2) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="shares" label="股数" width="100" />
                        <el-table-column prop="value" label="金额" width="120">
                            <template #default="scope">
                                {{ scope.row.value.toFixed(2) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="profit" label="盈亏" width="100">
                            <template #default="scope">
                                <span :class="getProfitClass(scope.row.profit)">
                                    {{ scope.row.profit ? scope.row.profit.toFixed(2) : '-' }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
                    </el-table>
                </el-card>
            </div>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose" :disabled="loading">
                    {{ backtestResult ? '关闭' : '取消' }}
                </el-button>
                <el-button v-if="!backtestResult" type="primary" @click="runBacktest" :loading="loading">
                    开始回测
                </el-button>
                <el-button v-if="backtestResult" type="primary" @click="saveResult" :loading="saving">
                    保存结果
                </el-button>
                <el-button v-if="backtestResult" @click="resetBacktest">
                    重新配置
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useModelStore } from '@/store/models'
import type { BacktestModel, BacktestRequest, BacktestResult } from '@/types/api'
import * as echarts from 'echarts'

// Props
interface Props {
    model?: BacktestModel
    visible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'update:visible': [value: boolean]
    'success': []
}>()

// Store
const modelStore = useModelStore()

// 表单引用
const formRef = ref<FormInstance>()
const chartRef = ref<HTMLDivElement>()
const chartInstance = ref<echarts.ECharts>()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const backtestResult = ref<BacktestResult | null>(null)
const stockOptions = ref([
    { symbol: '000001', name: '平安银行' },
    { symbol: '000002', name: '万科A' },
    { symbol: '000858', name: '五粮液' },
    { symbol: '600519', name: '贵州茅台' },
    { symbol: '601318', name: '中国平安' },
    { symbol: '000333', name: '美的集团' }
])

// 表单数据
const form = reactive<BacktestRequest>({
    symbol: '',
    start_date: '',
    end_date: '',
    initial_capital: 100000
})

// 表单验证规则
const rules: FormRules = {
    symbol: [
        { required: true, message: '请选择股票', trigger: 'change' }
    ],
    start_date: [
        { required: true, message: '请选择开始日期', trigger: 'change' }
    ],
    end_date: [
        { required: true, message: '请选择结束日期', trigger: 'change' }
    ],
    initial_capital: [
        { required: true, message: '请输入初始资金', trigger: 'blur' },
        { type: 'number', min: 1000, message: '初始资金不能少于1000元', trigger: 'blur' }
    ]
}

// 计算属性
const visible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value)
})

// 方法
const getReturnClass = (returnValue: number) => {
    return returnValue > 0 ? 'positive-return' : 'negative-return'
}

const getDrawdownClass = (drawdown: number) => {
    return drawdown < -0.1 ? 'high-drawdown' : 'normal-drawdown'
}

const getProfitClass = (profit?: number) => {
    if (!profit) return ''
    return profit > 0 ? 'positive-profit' : profit < 0 ? 'negative-profit' : ''
}

const initChart = () => {
    if (!chartRef.value || !backtestResult.value) return

    chartInstance.value = echarts.init(chartRef.value)
    updateChart()
}

const updateChart = () => {
    if (!chartInstance.value || !backtestResult.value) return

    const equityCurve = backtestResult.value.equity_curve
    const dates = equityCurve.map((point: any) => point.date)
    const values = equityCurve.map((point: any) => point.value)

    const option: echarts.EChartsOption = {
        title: {
            text: '资金曲线',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const param = params[0]
                return `${param.axisValue}<br/>${param.marker} 资金: ${param.value.toFixed(2)}`
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
            name: '资金 (元)'
        },
        series: [
            {
                name: '资金曲线',
                type: 'line',
                data: values,
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: '#409eff'
                },
                itemStyle: {
                    color: '#409eff'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                        { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
                    ])
                }
            }
        ]
    }

    chartInstance.value.setOption(option)
}

const runBacktest = async () => {
    if (!formRef.value || !props.model) return

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    loading.value = true
    try {
        const result = await modelStore.runBacktest(props.model.id, form)
        backtestResult.value = result.backtest_result

        await nextTick()
        initChart()

        ElMessage.success('回测完成')
    } catch (error) {
        ElMessage.error('回测失败')
        console.error('运行回测失败:', error)
    } finally {
        loading.value = false
    }
}

const saveResult = async () => {
    if (!backtestResult.value || !props.model) return

    saving.value = true
    try {
        // 这里可以调用API保存回测结果
        // await saveBacktestResult(props.model.id, backtestResult.value)
        ElMessage.success('结果保存成功')
        emit('success')
        handleClose()
    } catch (error) {
        ElMessage.error('保存失败')
        console.error('保存回测结果失败:', error)
    } finally {
        saving.value = false
    }
}

const resetBacktest = () => {
    backtestResult.value = null
    if (chartInstance.value) {
        chartInstance.value.dispose()
        chartInstance.value = undefined
    }
}

const exportTrades = () => {
    if (!backtestResult.value) return

    // 这里可以实现导出交易记录功能
    ElMessage.info('导出功能开发中')
}

const handleClose = () => {
    visible.value = false
    resetBacktest()
    if (formRef.value) {
        formRef.value.resetFields()
    }
}

const handleResize = () => {
    if (chartInstance.value) {
        chartInstance.value.resize()
    }
}

// 生命周期
onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    if (chartInstance.value) {
        chartInstance.value.dispose()
    }
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.backtest-container {
    max-height: 70vh;
    overflow-y: auto;
}

.config-section,
.result-overview,
.result-chart,
.trade-records {
    margin-bottom: 20px;
}

.overview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.overview-item {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    border: 1px solid #e9ecef;
}

.overview-value {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
}

.overview-label {
    font-size: 14px;
    color: #6c757d;
}

.positive-return {
    color: #67c23a;
}

.negative-return {
    color: #f56c6c;
}

.high-drawdown {
    color: #f56c6c;
}

.normal-drawdown {
    color: #e6a23c;
}

.positive-profit {
    color: #67c23a;
    font-weight: 500;
}

.negative-profit {
    color: #f56c6c;
    font-weight: 500;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .overview-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 480px) {
    .overview-grid {
        grid-template-columns: 1fr;
    }
}
</style>