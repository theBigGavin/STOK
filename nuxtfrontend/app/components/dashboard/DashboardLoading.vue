<template>
    <div class="flex flex-col items-center justify-center py-12">
        <!-- 加载动画 -->
        <div class="relative mb-6">
            <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <UIcon name="i-lucide-bar-chart-3" class="absolute inset-0 m-auto size-8 text-primary" />
        </div>

        <!-- 加载文本 -->
        <div class="text-center">
            <h3 class="text-lg font-semibold text-highlighted mb-2">加载仪表盘数据</h3>
            <p class="text-muted">正在获取系统状态和决策数据...</p>
        </div>

        <!-- 进度指示器 -->
        <div class="w-64 mt-6">
            <div class="flex justify-between text-xs text-muted mb-1">
                <span>初始化</span>
                <span>{{ progress }}%</span>
            </div>
            <UProgress :value="progress" :max="100" size="sm" color="primary" class="mb-2" />
            <div class="text-xs text-muted text-center">
                {{ loadingSteps[currentStep] }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'

// Nuxt运行时配置
const isClient = typeof window !== 'undefined'

// 状态
const progress = ref(0)
const currentStep = ref(0)

// 加载步骤
const loadingSteps = [
    '正在连接数据服务...',
    '获取股票数据...',
    '加载模型信息...',
    '获取决策历史...',
    '检查系统状态...',
    '完成初始化...'
]

// 模拟加载进度
onBeforeMount(() => {
    if (!isClient) return

    const interval = setInterval(() => {
        progress.value += Math.random() * 15
        currentStep.value = Math.floor(progress.value / (100 / loadingSteps.length))

        if (progress.value >= 100) {
            progress.value = 100
            currentStep.value = loadingSteps.length - 1
            clearInterval(interval)
        }
    }, 300)
})
</script>

<style scoped>
/* 自定义加载动画 */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.loading-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>