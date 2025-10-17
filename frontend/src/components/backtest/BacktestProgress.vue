<template>
    <div class="backtest-progress">
        <el-card class="progress-card">
            <template #header>
                <div class="progress-header">
                    <span>回测执行进度</span>
                    <div class="header-actions">
                        <el-button type="danger" :icon="Close" @click="cancelBacktest" :loading="cancelling">
                            取消回测
                        </el-button>
                    </div>
                </div>
            </template>

            <!-- 进度条 -->
            <div class="progress-content">
                <div class="progress-info">
                    <el-progress :percentage="progress" :status="progressStatus" :stroke-width="8" :show-text="true" />
                    <div class="progress-details">
                        <div class="progress-message">{{ currentMessage }}</div>
                        <div class="progress-time">预计剩余时间: {{ estimatedTime }}</div>
                    </div>
                </div>

                <!-- 执行日志 -->
                <div class="execution-logs">
                    <div class="logs-header">
                        <span>执行日志</span>
                        <el-button type="text" :icon="Delete" @click="clearLogs">清空日志</el-button>
                    </div>
                    <div class="logs-content">
                        <div v-for="(log, index) in executionLogs" :key="index" class="log-item">
                            {{ log }}
                        </div>
                        <div v-if="executionLogs.length === 0" class="no-logs">
                            暂无执行日志
                        </div>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Delete } from '@element-plus/icons-vue'
import { useBacktestStore } from '@/store/backtest'

// Store
const backtestStore = useBacktestStore()

// 状态
const cancelling = ref(false)

// 计算属性
const progress = computed(() => backtestStore.progress)
const executionLogs = computed(() => backtestStore.executionLogs)

const progressStatus = computed(() => {
    if (backtestStore.error) return 'exception'
    if (progress.value >= 100) return 'success'
    return undefined
})

const currentMessage = computed(() => {
    if (backtestStore.error) return `执行失败: ${backtestStore.error}`
    if (progress.value >= 100) return '回测执行完成'

    const messages = [
        '初始化回测环境...',
        '加载历史数据...',
        '执行模型计算...',
        '生成回测结果...',
        '完成回测分析...'
    ]

    const index = Math.floor((progress.value / 100) * messages.length)
    return messages[Math.min(index, messages.length - 1)]
})

const estimatedTime = computed(() => {
    if (progress.value >= 100) return '已完成'
    if (progress.value === 0) return '计算中...'

    const elapsed = getElapsedTime()
    const remaining = (elapsed / progress.value) * (100 - progress.value)
    return formatTime(remaining)
})

// 方法
const getElapsedTime = () => {
    // 这里应该记录开始时间，简化处理
    return 30 // 假设已运行30秒
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    if (minutes > 0) {
        return `${minutes}分${remainingSeconds}秒`
    }
    return `${remainingSeconds}秒`
}

const cancelBacktest = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要取消当前回测吗？已完成的进度将丢失。',
            '确认取消',
            {
                confirmButtonText: '确定',
                cancelButtonText: '继续执行',
                type: 'warning'
            }
        )

        cancelling.value = true
        backtestStore.addLog('用户取消回测执行')

        // 模拟取消过程
        setTimeout(() => {
            backtestStore.setRunning(false)
            backtestStore.setProgress(0)
            backtestStore.addLog('回测已取消')
            cancelling.value = false
            ElMessage.info('回测已取消')
        }, 1000)

    } catch (error) {
        // 用户取消操作
    }
}

const clearLogs = () => {
    backtestStore.clearExecutionLogs()
    ElMessage.success('执行日志已清空')
}

// 生命周期
onUnmounted(() => {
    // 组件卸载时清理
    if (backtestStore.running) {
        backtestStore.setRunning(false)
        backtestStore.setProgress(0)
    }
})
</script>

<style scoped>
.backtest-progress {
    width: 100%;
    margin-bottom: 20px;
}

.progress-card {
    border-radius: 8px;
    border-left: 4px solid #409eff;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.progress-content {
    padding: 16px 0;
}

.progress-info {
    margin-bottom: 24px;
}

.progress-details {
    margin-top: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 4px;
}

.progress-message {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
}

.progress-time {
    font-size: 12px;
    color: #909399;
}

.execution-logs {
    border: 1px solid #e6e8eb;
    border-radius: 4px;
    overflow: hidden;
}

.logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #e6e8eb;
    font-size: 14px;
    font-weight: 500;
}

.logs-content {
    max-height: 200px;
    overflow-y: auto;
    background: #fff;
}

.log-item {
    padding: 8px 16px;
    font-size: 12px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    border-bottom: 1px solid #f0f0f0;
    line-height: 1.4;
}

.log-item:last-child {
    border-bottom: none;
}

.log-item:hover {
    background: #f8f9fa;
}

.no-logs {
    padding: 20px;
    text-align: center;
    color: #c0c4cc;
    font-size: 14px;
}

:deep(.el-progress__text) {
    font-size: 14px;
    font-weight: 500;
}

:deep(.el-progress-bar__inner) {
    transition: width 0.3s ease;
}
</style>