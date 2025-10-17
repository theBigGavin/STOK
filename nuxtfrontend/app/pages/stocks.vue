
<template>
    <div>
        <UDashboardPage>
            <UDashboardPanel grow>
                <UDashboardNavbar title="股票监控" :ui="{ right: 'gap-3' }">
                    <template #right>
                        <UButton label="刷新数据" color="primary" variant="solid" icon="i-lucide-refresh-cw"
                            :loading="loading" @click="refreshAllData" />
                        <UButton label="批量刷新" color="neutral" variant="outline" icon="i-lucide-download"
                            @click="showBatchRefreshModal = true" />
                        <UButton label="导出数据" color="neutral" variant="outline" icon="i-lucide-file-text"
                            @click="exportData" />
                    </template>
                </UDashboardNavbar>

                <UDashboardPanelContent>
                    <!-- 筛选工具栏 -->
                    <UDashboardSection title="筛选条件" description="按市场、状态和关键词筛选股票">
                        <div class="bg-white rounded-lg border border-gray-200 p-4">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <!-- 市场筛选 -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">市场</label>
                                    <USelect v-model="filters.market" :options="marketOptions" placeholder="全部市场"
                                        clearable />
                                </div>

                                <!-- 状态筛选 -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
                                    <USelect v-model="filters.status" :options="statusOptions" placeholder="全部状态"
                                        clearable />
                                </div>

                                <!-- 关键词搜索 -->
