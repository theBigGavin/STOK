<template>
    <div class="backtest">
        <div class="page-header">
            <h1>回测分析</h1>
            <p>历史数据回测和性能评估</p>
        </div>

        <!-- 回测配置 -->
        <BacktestConfig @backtestStarted="handleBacktestStarted" />

        <!-- 回测进度 -->
        <BacktestProgress v-if="backtestStore.running" />

        <!-- 回测结果 -->
        <BacktestResult v-if="backtestStore.currentBacktest" />

        <!-- 回测历史 -->
        <BacktestHistory v-else />

        <!-- 回测比较 -->
        <BacktestCompare v-if="backtestStore.comparisonResults" />
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBacktestStore } from '@/store/backtest'
import BacktestConfig from '@/components/backtest/BacktestConfig.vue'
import BacktestProgress from '@/components/backtest/BacktestProgress.vue'
import BacktestResult from '@/components/backtest/BacktestResult.vue'
import BacktestHistory from '@/components/backtest/BacktestHistory.vue'
import BacktestCompare from '@/components/backtest/BacktestCompare.vue'

// Store
const backtestStore = useBacktestStore()

// 方法
const handleBacktestStarted = () => {
    // 回测开始后的处理逻辑
    console.log('回测已开始')
}

// 生命周期
onMounted(() => {
    // 初始化时加载回测历史
    backtestStore.fetchBacktestResults()
})
</script>

<style scoped>
.backtest {
    padding: 0;
}

.page-header {
    margin-bottom: 24px;
}

.page-header h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #303133;
}

.page-header p {
    margin: 0;
    color: #909399;
    font-size: 14px;
}
</style>