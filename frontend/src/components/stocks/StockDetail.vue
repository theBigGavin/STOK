
<template>
    <div class="stock-detail">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="10" animated />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-container">
            <el-result icon="error" title="加载失败" :sub-title="error">
                <template #extra>
                    <el-button type="primary" @click="handleRetry">重试</el-button>
                </template>
            </el-result>
        </div>

        <!-- 正常内容 -->
        <div v-else-if="stock" class="detail-content">
            <!-- 头部信息 -->
            <div class="detail-header">
                <div class="stock-basic-info">
                    <h1 class="stock-name">{{ stock.name }}</h1>
                    <div class="stock-meta">
                        <span class="stock-symbol">{{ stock.symbol }}</span>
                        <el-tag v-if="stock.market" size="small">{{ stock.market }}</el-tag>
                        <el-tag v-if="stock.industry" size="small" type="info">{{ stock.industry }}</el-tag>
                        <el-tag v-if="stock.is_active" size="small" type="success">活跃</el-tag>
                        <el-tag v-else size="small" type="danger">停牌</el-tag>
                    </div>
                </div>

                <div class="stock-actions">
                    <el-button type="primary" :icon="Refresh" @click="handleRefresh" :loading="refreshing">
                        刷新数据
                    </el-button>
                    <el-button :icon="Star" @click="handleFavorite">
                        {{ isFavorite ? '取消收藏' : '收藏' }}
                    </el-button>
                    <el-button :icon="Share" @click="handleShare">分享</el-button>
                </div>
            </div>

            <!-- 价格信息 -->
            <el-card class="price-card">
                <template #header>
                    <div class="card-header">
                        <span>实时价格</span>
                        <span class="update-time" v-if="lastUpdateTime">
                            更新时间: {{ formatTime(lastUpdateTime) }}
                        </span>
                    </div>
                </template>

                <div class="price-info">
                    <div class="current-price">
                        <span class="price-value" :class="getPriceClass(latestData?.close_price, previousClose)">
                            {{ formatPrice(latestData?.close_price || 0) }}
                        </span>
                        <div class="price-change">
                            <el-tag :type="getChangeTagType(priceChangePercent)" size="large" effect="dark">
                                {{ formatChange(priceChange) }}
                            </el-tag>
                            <span class="change-percent" :class="getPriceClass(latestData?.close_price, previousClose)">
                                {{ formatChange(priceChangePercent) }}
                            </span>
                        </div>
                    </div>

                    <div class="price-details">
                        <div class="price-item">
                            <span class="label">开盘</span>
                            <span class="value">{{ formatPrice(latestData?.open_price || 0) }}</span>
                        </div>
                        <div class="price-item">
                            <span class="label">最高</span>
                            <span class="value text-success">{{ formatPrice(latestData?.high_price || 0) }}</span>
                        </div>
                        <div class="price-item">
                            <span class="label">最低</span>
                            <span class="value text-danger">{{ formatPrice(latestData?.low_price || 0) }}</span>
                        </div>
                        <div class="price-item">
                            <span class="label">昨收</span>
                            <span class="value">{{ formatPrice(previousClose || 0) }}</span>
                        </div>
                    </div>

                    <div class="volume-info">
                        <div class="volume-item">
                            <span class="label">成交量</span>
                            <span class="value">{{ formatVolume(latestData?.volume || 0) }}</span>
                        </div>
                        <div class="volume-item">
                            <span class="label">成交额</span>
                            <span class="value">{{ formatVolume(latestData?.turnover || 0) }}</span>
                        </div>
                        <div class="volume-item">
                            <span class="label">换手率</span>
                            <span class="value">{{ formatChange(turnoverRate || 0) }}</span>
                        </div>
                    </div>
                </div>
            </el-card>

            <!-- 图表和指标 -->
            <div class="chart-section">
                <el-card class="chart-card">
                    <template #header>
                        <div class="card-header">
                            <span>价格走势</span>
                            <div class="chart-controls">
                                <el-radio-group v-model="chartPeriod" size="small">
                                    <el-radio-button label="1d">1日</el-radio-button>
                                    <el-radio-button label="1w">1周</el-radio-button>
                                    <el-radio-button label="1m">1月</el-radio-button>
                                    <el-radio-button label="3m">3月</el-radio-button>
                                    <el-radio-button label="1y">1年</el-radio-button>
                                </el-radio-group>
                            </div>
                        </div>
                    </template>

                    <StockChart :chart-data="chartData" :symbol="stock.symbol" :time-period="chartPeriod" height="400px"
                        @refresh="fetchChartData" />
                </el-card>
            </div>

            <!-- 技术指标 -->
            <div class="indicators-section">
                <el-row :gutter="16">
                    <el-col :span="8">
                        <el-card class="indicator-card">
                            <template #header>
                                <span>移动平均线</span>
                            </template>
                            <div class="indicator-list">
                                <div class="indicator-item">
                                    <span class="label">MA5</span>
                                    <span class="value">{{ formatPrice(ma5 || 0) }}</span>
                                </div>
                                <div class="indicator-item">
                                    <span class="label">MA10</span>
                                    <span class="value">{{ formatPrice(ma10 || 0) }}</span>
                                </div>
                                <div class="indicator-item">
                                    <span class="label">MA20</span>
                                    <span class="value">{{ formatPrice(ma20 || 0) }}</span>
                                </div>
                                <div class="indicator-item">
                                    <span class="label">MA60</span>
                                    <span class="value">{{ formatPrice(ma60 || 0) }}</span>
                                </div>
                            </div>
                        </el-card>
                    </el-col>

                    <el-col :span="8">
                        <el-card class="indicator-card">
                            <template #header>
                                <span>技术指标</span>
                            </template>
                            <div class="indicator-list">
                                <div class="indicator-item">
                                    <span class="label">RSI(14)</span>
                                    <span class="value" :class="getRSIClass(rsi)">{{ rsi ? rsi.toFixed(2) : '--'
                                        }}</span>
                                </div>
                                <div class="indicator-item">
                                    <span class="label">MACD</span>
                                    <span class="value" :class="getMACDClass(macd)">{{ macd ? macd.toFixed(2) : '--'
                                        }}</span>
                                </div>
                                <div class="indicator-item">
                                    <span class="label">布林带上轨</span>
                                    <span class="value">{{ formatPrice(bollUpper || 0) }}</span>
                                </div>
                                <div class="indicator-item">
                                    <span class="label">布林带下轨</span>
                                    <span class="value">{{ formatPrice(bollLower || 0) }}</span>
                                </div>
                            </div>
                        </el-card>
                    </el-col>

                    <el-col :span="8">
                        <el-card class="indicator-card">
                            <template #header>
                                <span>交易信号</span>
                            </template>
                            <div class="signal-info">
                                <div class="signal-item">
                                    <span class="label">当前信号</span>
                                    <el-tag :type="getSignalType(currentSignal)" size="large">
                                        {{ getSignalText(currentSignal) }}
                                    </el-tag>
                                </div>
                                <div class="signal-item">
                                    <span class="label">置信度</span>
                                    <el-progress :percentage="confidence || 0" :status="getConfidenceStatus(confidence)"
                                        :show-text="true" />
                                </div>
                                <div class="signal-item">
                                    <span class="label">信号强度</span>
                                    <el-rate v-model="signalStrength" disabled show-score text-color="#ff9900"
                                        score-template="{value}" />
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </div>

            <!-- 历史数据表格 -->
            <div class="history-section">
                <el-card>
                    <template #header>
                        <div class="card-header">
                            <span>历史数据</span>
                            <el-button type="primary" link :icon="Download" @click="exportHistoryData">
                                导出数据
                            </el-button>
                        </div>
                    </template>

                    <StockTable :stocks="historyData" :loading="historyLoading" :show-pagination="true"
                        :current-page="historyPage" :page-size="historyPageSize" :total="historyTotal"
                        @current-change="handleHistoryPageChange" @size-change="handleHistorySizeChange" />
                </el-card>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-container">
            <el-empty description="暂无股票数据">
                <el-button type="primary" @click="handleRetry">重新加载</el-button>
            </el-empty>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Refresh, Star, Share, Download } from '@element-plus/icons-vue'
import { useStocksStore } from '@/store/stocks'
import StockChart from './StockChart.vue'
import StockTable from './StockTable.vue'
import {
    formatPrice,
    formatChange,
    formatVolume,
    formatDate,
    getChangeTagType,
    getSignalType,
    getSignalText,
    getConfidenceStatus,
    calculateMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands
} from '@/utils/stockUtils'
import type { Stock, StockDailyData } from '@/types/api'

interface Props {
    symbol: string
}

const props = defineProps<Props>()
const stocksStore = useStocksStore()

// 响应式数据
const loading = ref(true)
const error = ref<string | null>(null)
const refreshing = ref(false)
const isFavorite = ref(false)
const lastUpdateTime = ref<Date | null>(null)
const chartPeriod = ref('1m')
const chartData = ref<StockDailyData[]>([])
const historyData = ref<StockDailyData[]>([])
const historyLoading = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyTotal = ref(0)

// 计算属性
const stock = computed(() => stocksStore.getStockDetail)
const latestData = computed(() => {
    if (!chartData.value.length) return null
    return chartData.value[chartData.value.length - 1]
})

const previousClose = computed(() => {
    if (!chartData.value.length || chartData.value.length < 2) return 0
    return chartData.value[chartData.value.length - 2].close_price
})

const priceChange = computed(() => {
    if (!latestData.value || !previousClose.value) return 0
    return latestData.value.close_price - previousClose.value
})

const priceChangePercent = computed(() => {
    if (!latestData.value || !previousClose.value || previousClose.value === 0) return 0
    return (priceChange.value / previousClose.value) * 100
})

const turnoverRate = computed(() => {
    // 这里需要股票的总股本数据来计算换手率
    return 0
})

// 技术指标计算
const ma5 = computed(() => {
    if (!chartData.value.length) return 0
    const ma = calculateMA(chartData.value, 5)
    return ma[ma.length - 1] || 0
})

const ma10 = computed(() => {
    if (!chartData.value.length) return 0
    const ma = calculateMA(chartData.value, 10)
    return ma[ma.length - 1] || 0
})

const ma20 = computed(() => {
    if (!chartData.value.length) return 0
    const ma = calculateMA(chartData.value, 20)
    return ma[ma.length - 1] || 0
})

const ma60 = computed(() => {
    if (!chartData.value.length) return 0
    const ma = calculateMA(chartData.value, 60)
    return ma[ma.length - 1] || 0
})

const rsi = computed(() => {
    if (!chartData.value.length) return 0
    const rsiValues = calculateRSI(chartData.value, 14)
    return rsiValues[rsiValues.length - 1] || 0
})

const macd = computed(() => {
    if (!chartData.value.length) return 0
    const macdData = calculateMACD(chartData.value)
    return macdData.macd[macdData.macd.length - 1] || 0
})

const bollUpper = computed(() => {
    if (!chartData.value.length) return 0
    const boll = calculateBollingerBands(chartData.value, 20, 2)
    return boll.upperBand[boll.upperBand.length - 1] || 0
})

const bollLower = computed(() => {
    if (!chartData.value.length) return 0
    const boll = calculateBollingerBands(chartData.value, 20, 2)
    return boll.lowerBand[boll.lowerBand.length - 1] || 0
})

// 模拟数据
const currentSignal = ref('BUY')
const confidence = ref(85)
const signalStrength = ref(4)

// 监听 symbol 变化
watch(() => props.symbol, (newSymbol) => {
    if (newSymbol) {
        loadStockData()
    }
})

// 生命周期
onMounted(() => {
    loadStockData()
})

// 方法

// 加载股票数据
const loadStockData = async () => {
    loading.value = true
    error.value = null

    try {
        await Promise.all([
            fetchStockInfo(),
            fetchChartData(),
            fetchHistoryData()
        ])
        lastUpdateTime.value = new Date()
    } catch (err) {
        error.value = err instanceof Error ? err.message : '加载股票数据失败'
        console.error('加载股票数据失败:', err)
    } finally {
        loading.value = false
    }
}

// 获取股票信息
const fetchStockInfo = async () => {
    await stocksStore.fetchStock(props.symbol)
}

// 获取图表数据
const fetchChartData = async () => {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date()

    switch (chartPeriod.value) {
        case '1d':
            startDate.setDate(startDate.getDate() - 1)
            break
        case '1w':
            startDate.setDate(startDate.getDate() - 7)
            break
        case '1m':
            startDate.setMonth(startDate.getMonth() - 1)
            break
        case '3m':
            startDate.setMonth(startDate.getMonth() - 3)
            break
        case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1)
            break
    }

    const startDateStr = startDate.toISOString().split('T')[0]

    try {
        const data = await stocksStore.fetchStockData(props.symbol, {
            start_date: startDateStr,
            end_date: endDate,
            include_features: false
        })
        chartData.value = data
    } catch (err) {
        console.error('获取图表数据失败:', err)
    }
}

// 获取历史数据
const fetchHistoryData = async () => {
    historyLoading.value = true
    try {
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date('2020-01-01').toISOString().split('T')[0]

        const data = await stocksStore.fetchStockData(props.symbol, {
            start_date: startDate,
            end_date: endDate,
            include_features: false,
            skip: (historyPage.value - 1) * historyPageSize.value,
            limit: historyPageSize.value
        })

        historyData.value = data
        historyTotal.value = data.length // 这里应该是总记录数，需要从API获取
    } catch (err) {
        console.error('获取历史数据失败:', err)
    } finally {
        historyLoading.value = false
    }
}

// 获取价格样式
const getPriceClass = (current: number, previous: number) => {
    if (!current || !previous) return ''
    return current > previous ? 'text-success' : current < previous ? 'text-danger' : ''
}

// 获取 RSI 样式
const getRSIClass = (rsiValue: number) => {
    if (rsiValue > 70) return 'text-danger'
    if (rsiValue < 30) return 'text-success'
    return ''
}

// 获取 MACD 样式
const getMACDClass = (macdValue: number) => {
    if (macdValue > 0) return 'text-success'
    if (