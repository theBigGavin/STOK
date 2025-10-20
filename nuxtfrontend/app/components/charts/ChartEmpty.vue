<template>
    <div class="chart-empty">
        <div class="empty-content">
            <UIcon :name="icon" class="empty-icon" />
            <h3 class="empty-title">{{ title }}</h3>
            <p class="empty-message">{{ message }}</p>
            <div class="empty-actions" v-if="showAction">
                <UButton @click="$emit('action')" :variant="actionVariant" :color="actionColor">
                    {{ actionText }}
                </UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title?: string;
    message: string;
    icon?: string;
    showAction?: boolean;
    actionText?: string;
    actionVariant?: 'solid' | 'outline' | 'soft' | 'ghost';
    actionColor?: 'primary' | 'secondary' | 'neutral' | 'error' | 'info' | 'success' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
    title: '暂无数据',
    icon: 'i-heroicons-chart-bar',
    showAction: false,
    actionText: '刷新数据',
    actionVariant: 'outline' as const,
    actionColor: 'primary' as const,
});

const emit = defineEmits<{
    action: [];
}>();
</script>

<style scoped>
.chart-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px 20px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.empty-content {
    text-align: center;
    max-width: 300px;
}

.empty-icon {
    width: 64px;
    height: 64px;
    color: #9ca3af;
    margin-bottom: 16px;
}

.empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
}

.empty-message {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 20px;
}

.empty-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}
</style>