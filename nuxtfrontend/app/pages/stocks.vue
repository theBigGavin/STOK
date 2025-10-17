<template>
    <div>
        <UDashboardPage>
            <UDashboardPanel grow>
                <UDashboardNavbar title="股票监控" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <UButton label="刷新数据" color="primary" variant="solid" icon="i-lucide-refresh-cw" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <div class="space-y-6">
                        <!-- 股票列表区域 -->
                        <UDashboardSection title="股票列表" description="查看和管理活跃股票">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    股票列表功能开发中...
                                </p>
                            </div>
                        </UDashboardSection>

                        <!-- 数据图表区域 -->
                        <UDashboardSection title="数据图表" description="股票历史数据可视化">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    数据图表功能开发中...
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
    title: '股票监控',
    description: '股票数据监控和管理页面'
})
</script>