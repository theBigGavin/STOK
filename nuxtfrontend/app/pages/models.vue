<template>
    <div>
        <UDashboardPage>
            <UDashboardPanel grow>
                <UDashboardNavbar title="模型管理" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <UButton label="添加模型" color="primary" variant="solid" icon="i-lucide-plus" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <div class="space-y-6">
                        <!-- 模型列表区域 -->
                        <UDashboardSection title="模型列表" description="查看和管理活跃模型">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    模型列表功能开发中...
                                </p>
                            </div>
                        </UDashboardSection>

                        <!-- 性能监控区域 -->
                        <UDashboardSection title="性能监控" description="模型性能指标监控">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    性能监控功能开发中...
                                </p>
                            </div>
                        </UDashboardSection>
                    </div>
                </UDashboardPanelContent>
            </UDashboardPanel>
        </UDashboardPage>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    title: '模型管理',
    description: '模型管理和性能监控页面'
})
</script>