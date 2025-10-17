<template>
    <div>
        <UDashboardPage>
            <UDashboardPanel grow>
                <UDashboardNavbar title="回测分析" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <UButton label="开始回测" color="primary" variant="solid" icon="i-lucide-play" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <div class="space-y-6">
                        <!-- 回测配置区域 -->
                        <UDashboardSection title="回测配置" description="设置回测参数">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    回测配置功能开发中...
                                </p>
                            </div>
                        </UDashboardSection>

                        <!-- 结果展示区域 -->
                        <UDashboardSection title="结果展示" description="回测性能指标展示">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    结果展示功能开发中...
                                </p>
                            </div>
                        </UDashboardSection>

                        <!-- 对比分析区域 -->
                        <UDashboardSection title="对比分析" description="多模型对比分析">
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <p class="text-gray-500 text-center py-8">
                                    对比分析功能开发中...
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
    title: '回测分析',
    description: '回测分析和性能对比页面'
})
</script>