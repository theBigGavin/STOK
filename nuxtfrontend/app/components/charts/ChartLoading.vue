<template>
    <div class="chart-loading">
        <div class="loading-content">
            <div class="loading-spinner">
                <div class="spinner-circle"></div>
            </div>
            <h3 class="loading-title">{{ title }}</h3>
            <p class="loading-message">{{ message }}</p>
            <div v-if="showProgress" class="loading-progress">
                <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
                </div>
                <span class="progress-text">{{ progress }}%</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title?: string;
    message?: string;
    showProgress?: boolean;
    progress?: number;
}

const props = withDefaults(defineProps<Props>(), {
    title: '加载中',
    message: '正在加载图表数据...',
    showProgress: false,
    progress: 0,
});
</script>

<style scoped>
.chart-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px 20px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.loading-content {
    text-align: center;
    max-width: 300px;
}

.loading-spinner {
    margin-bottom: 20px;
}

.spinner-circle {
    width: 48px;
    height: 48px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
}

.loading-message {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 20px;
}

.loading-progress {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
}

.progress-bar {
    width: 200px;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
}
</style>