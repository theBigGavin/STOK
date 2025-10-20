<template>
    <div class="chart-error">
        <div class="error-content">
            <UIcon name="i-heroicons-exclamation-triangle" class="error-icon" />
            <h3 class="error-title">{{ title }}</h3>
            <p class="error-message">{{ message }}</p>
            <div class="error-actions">
                <UButton v-if="showRetry" @click="$emit('retry')" variant="solid" color="primary">
                    重试
                </UButton>
                <UButton v-if="showReload" @click="handleReload" variant="outline">
                    重新加载
                </UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title?: string;
    message: string;
    showRetry?: boolean;
    showReload?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    title: '图表加载失败',
    showRetry: true,
    showReload: false,
});

const emit = defineEmits<{
    retry: [];
    reload: [];
}>();

const handleReload = () => {
    emit('reload');
    // 强制刷新页面
    window.location.reload();
};
</script>

<style scoped>
.chart-error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px 20px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.error-content {
    text-align: center;
    max-width: 300px;
}

.error-icon {
    width: 48px;
    height: 48px;
    color: #ef4444;
    margin-bottom: 16px;
}

.error-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
}

.error-message {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 20px;
}

.error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}
</style>