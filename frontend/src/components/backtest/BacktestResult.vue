<template>
    <div class="backtest-result">
        <!-- 结果概览 -->
        <el-card class="overview-card" v-if="currentBacktest">
            <template #header>
                <div class="overview-header">
                    <span>回测结果概览</span>
                    <div class="header-actions">
                        <el-button type="primary" :icon="Download" @click="exportResult">
                            导出结果
                        </el-button>
                        <el-button :icon="Printer" @click="generateReport">
                            生成报告
                        </el-button>
                    </div>
                </div>
            </template>

            <div class="overview-content">
                <!-- 关键指标 -->
                <div class="key-metrics">
                    <div class="metric-item">
                        <div class="metric-value" :class="getReturnClass(currentBacktest.results.total_return)">
                            {{ formatPercentage(currentBacktest.results.total_return) }}
                        </div>
                        <div class="metric-label">总收益率</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" :class="getReturnClass(currentBacktest.results.annual_return)">
                            {{ formatPercentage(currentBacktest.results.annual_return) }}
                        </div>
                        <div class="metric-label">年化收益率</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">
                            {{ formatNumber(currentBacktest.results.sharpe_ratio) }}
                        </div>
                        <div class="metric-label">夏普比率</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value drawdown">
                            {{ formatPercentage(currentBacktest.results.max_drawdown) }}
                        </div>
                        <div class="metric-label">最大回撤</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">
                            {{ formatPercentage(currentBacktest.results.win_rate) }}
                        </div>
                        <div class="metric-label">胜率</div>
                    </div>
                </div>

                <!-- 详细信息 -->
                <el-row :gutter="20" class="detail-metrics">
                    <el-col :span="8">
                        <el-descriptions title="交易统计" :column="1" border>
                            <el-descriptions-item label="总交易次数">
                                {{ currentBacktest.results.total_trades }}
                            </el-descriptions-item>
                            <el-descriptions-item label="盈利交易">
                                {{ currentBacktest.results.winning_trades }}
                            </el-descriptions-item>
                            <el-descriptions-item label="亏损交易">
                                {{ currentBacktest.results.losing_trades }}
                            </el-descriptions-item>
                            <el-descriptions-item label="利润因子">
                                {{ formatNumber(currentBacktest.results.profit_factor) }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </el-col>
                    <el-col :span="8">
                        <el-descriptions title="风险指标" :column="1" border>
                            <el-descriptions-item label="波动率">
                                {{ formatPercentage(currentBacktest.results.volatility) }}
                            </el-descriptions-item>
                            <el-descriptions-item label="平均盈利">
                                {{ formatCurrency(currentBacktest.results.avg_profit_per_trade || 0) }}
                            </el-descriptions-item>
                            <el-descriptions-item label="平均亏损">
                                {{ formatCurrency(currentBacktest.results.avg_loss_per_trade || 0) }}
                            </el-descriptions-item>
                            <el-descriptions-item label="盈亏比">
                                {{ calculateProfitLossRatio(currentBacktest) }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </el-col>
                    <el-col :span="8">
                        <el-descriptions title="基本信息" :column="1" border>
                            <el-descriptions-item label="模型名称">
                                {{ currentBacktest.model_name }}
                            </el-descriptions-item>
                            <el-descriptions-item label="回测日期">
                                {{ currentBacktest.backtest_date }}
                            </el-descriptions-item>
                            <el-descriptions-item label="创建时间">
                                {{ formatDateTime(currentBacktest.created_at) }}
                            </el-descriptions-item>
                            <el-descriptions-item label="回测周期">
                                {{ calculateBacktestPeriod(currentBacktest) }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </el-col>
                </el-row>
            </div>
        </el-card>

        <!-- 图表展示 -->
        <el-card class="charts-card" v-if="currentBacktest">
            <template #header>
                <span>图表分析</span>
            </template>
            <BacktestCharts :backtest-result="currentBacktest" />
        </el-card>

        <!-- 交易记录 -->
        <el-card class="trades-card" v-if="currentBacktest && currentBacktest.trades.length > 0">
            <template #header>
                <span>交易记录</span>
            </template>
            <el-table :data="currentBacktest.trades" style="width: 100%"
                :default-sort="{ prop: 'date', order: 'descending' }">
                <el-table-column prop="date" label="日期" width="120" sortable />
                <el-table-column prop="symbol" label="股票" width="100" />
                <el-table-column prop="type" label="操作" width="80">
                    <template #default="scope">
                        <el-tag :type="scope.row.type === 'BUY' ? 'success' : 'danger'" size="small">
                            {{ scope.row.type === 'BUY' ? '买入' : '卖出' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="price" label="价格" width="100">
                    <template #default="scope">
                        {{ formatCurrency(scope.row.price) }}
                    </template>
                </el-table-column>
                <el-table-column prop="shares" label="股数" width="100" />
                <el-table-column prop="value" label="价值" width="120">
                    <template #default="scope">
                        {{ formatCurrency(scope.row.value) }}
                    </template>
                </el-table-column>
                <el-table-column prop="profit" label="利润" width="120">
                    <template #default="scope">
                        <span :class="getProfitClass(scope.row.profit || 0)">
                            {{ formatCurrency(scope.row.profit || 0) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="reason" label="原因" min-width="150" show-overflow-tooltip />
            </el-table>
        </el-card>

        <!-- 信号记录 -->
        <el-card class="signals-card" v-if="signals.length > 0">
            <template #header>
                <span>信号记录</span>
            </template>
            <el-table :data="signals" style="width: 100%">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="decision" label="决策" width="100">
                    <template #default="scope">
                        <el-tag :type="getDecisionType(scope.row.decision)" size="small">
                            {{ getDecisionText(scope.row.decision) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="confidence" label="置信度" width="100">
                    <template #default="scope">
                        <el-progress :percentage="Math.round(scope.row.confidence * 100)" :show-text="false"
                            :stroke-width="8" />
                        <span style="margin-left: 8px">{{ Math.round(scope.row.confidence * 100) }}%</span>
                    </template>
                </el-table-column>
                <el-table-column prop="signal_strength" label="信号强度" width="120">
                    <template #default="scope">
                        <el-rate v-model="scope.row.signal_strength" disabled show-score text-color="#ff9900"
                            score-template="{value}" />
                    </template>
                </el-table-column>
                <el-table-column prop="reasoning" label="推理过程" min-width="200" show-overflow-tooltip />
            </el-table>
        </el-card>

        <!-- 空状态 -->
        <el-card class="empty-card" v-else>
            <div class="empty-content">
                <el-icon>
                    <DataAnalysis />
                </el-icon>
                <p>暂无回测结果</p>
                <p class="empty-desc">请先执行回测以查看结果</p>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Printer, DataAnalysis } from '@element-plus/icons-vue'
import { useBacktestStore } from '@/store/backtest'
import BacktestCharts from './BacktestCharts.vue'
import {
    formatCurrency,
    formatPercentage,
    formatNumber,
    getReturnColorClass,
    exportToCSV,
    exportToJSON,
    generateBacktestReport
} from '@/utils/backtestUtils'
import type { BacktestResultDetail, SignalRecord } from '@/types/api'

// Props
const props = defineProps<{
    resultId?: number
}>()

// Store
const backtestStore = useBacktestStore()

// 状态
const signals = ref<SignalRecord[]>([])
const loading = ref(false)

// 计算属性
const currentBacktest = computed(() => backtestStore.currentBacktest)

// 方法
const getReturnClass = (returnRate: number) => {
    return getReturnColorClass(returnRate)
}

const getProfitClass = (profit: number) => {
    return profit > 0 ? 'profit-positive' : profit < 0 ? 'profit-negative' : ''
}

const getDecisionType = (decision: string) => {
    const types: Record<string, any> = {
        BUY: 'success',
        SELL: 'danger',
        HOLD: 'info'
    }
    return types[decision] || 'info'
}

const getDecisionText = (decision: string) => {
    const texts: Record<string, string> = {
        BUY: '买入',
        SELL: '卖出',
        HOLD: '持有'
    }
    return texts[decision] || decision
}

const calculateProfitLossRatio = (result: BacktestResultDetail) => {
    const avgProfit = (result.results as any).avg_profit_per_trade || 0
    const avgLoss = Math.abs((result.results as any).avg_loss_per_trade || 0)

    if (avgLoss === 0) return avgProfit > 0 ? '∞' : '0'

    return (avgProfit / avgLoss).toFixed(2)
}

const calculateBacktestPeriod = (result: BacktestResultDetail) => {
    // 这里需要根据实际数据计算回测周期
    return '30天'
}

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
}

const exportResult = async () => {
    if (!currentBacktest.value) return

    try {
        await ElMessageBox.confirm(
            '请选择导出格式',
            '导出回测结果',
            {
                distinguishCancelAndClose: true,
                confirmButtonText: 'CSV格式',
                cancelButtonText: 'JSON格式'
            }
        )

        // 导出 CSV
        const csvData = exportToCSV(currentBacktest.value)
        downloadFile(csvData, `backtest_${currentBacktest.value.id}.csv`, 'text/csv')
        ElMessage.success('CSV导出成功')

    } catch (action: any) {
        if (action === 'cancel') {
            // 导出 JSON
            const jsonData = exportToJSON(currentBacktest.value)
            downloadFile(jsonData, `backtest_${currentBacktest.value.id}.json`, 'application/json')
            ElMessage.success('JSON导出成功')
        }
    }
}

const generateReport = () => {
    if (!currentBacktest.value) return

    const report = generateBacktestReport(currentBacktest.value)
    downloadFile(report, `backtest_report_${currentBacktest.value.id}.md`, 'text/markdown')
    ElMessage.success('报告生成成功')
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

const fetchSignals = async () => {
    if (!currentBacktest.value) return

    try {
        loading.value = true
        const signalData = await backtestStore.fetchBacktestSignals(currentBacktest.value.id)
        signals.value = signalData
    } catch (error) {
        console.error('获取信号记录失败:', error)
        signals.value = []
    } finally {
        loading.value = false
    }
}

// 监听
watch(currentBacktest, (newResult: any) => {
    if (newResult) {
        fetchSignals()
    }
})

// 生命周期
onMounted(async () => {
    if (props.resultId) {
        try {
            loading.value = true
            await backtestStore.fetchBacktestResult(props.resultId)
        } catch (error) {
            console.error('加载回测结果失败:', error)
            ElMessage.error('加载回测结果失败')
        } finally {
            loading.value = false
        }
    }
})
</script>

<style scoped>
.backtest-result {
    width: 100%;
}

.overview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.overview-card,
.charts-card,
.trades-card,
.signals-card {
    margin-bottom: 20px;
    border-radius: 8px;
}

.key-metrics {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.metric-item {
    text-align: center;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.metric-value {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
}

.metric-label {
    font-size: 14px;
    color: #6c757d;
}

.return-positive {
    color: #67c23a;
}

.return-negative {
    color: #f56c6c;
}

.drawdown {
    color: #f56c6c;
}

.profit-positive {
    color: #67c23a;
    font-weight: bold;
}

.profit-negative {
    color: #f56c6c;
    font-weight: bold;
}

.detail-metrics {
    margin-top: 20px;
}

.empty-card {
    text-align: center;
    padding: 40px;
    border-radius: 8px;
}

.empty-content .el-icon {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 16px;
}

.empty-content p {
    margin: 8px 0;
    color: #909399;
}

.empty-desc {
    font-size: 14px;
}

:deep(.el-descriptions__title) {
    font-size: 14px;
    font-weight: 600;
}

:deep(.el-descriptions__label) {
    font-weight: 500;
}
</style>