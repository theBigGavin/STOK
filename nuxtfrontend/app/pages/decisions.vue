<template>
    <div>
        <UDashboardPage>
            <UDashboardPanel grow>
                <UDashboardNavbar title="决策分析" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <UButton label="批量生成" color="primary" variant="solid" icon="i-lucide-play" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <div class="space-y-6">
                        <!-- 决策历史区域 -->
                        <UDashboardSection title="决策历史" description="查看历史决策记录">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    决策历史功能开发中...
                                </p>
                            </div>
                        </UDashboardSection>

                        <!-- 投票详情区域 -->
                        <UDashboardSection title="投票详情" description="查看模型投票详情">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    投票详情功能开发中...
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
    title: '决策分析',
    description: '决策分析和投票详情页面'
})
</script>