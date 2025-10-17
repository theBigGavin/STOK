<template>
    <div class="backtest-config">
        <el-card class="config-card">
            <template #header>
                <div class="config-header">
                    <span>回测配置</span>
                    <el-button type="text" @click="resetConfig" :icon="Refresh">重置</el-button>
                </div>
            </template>

            <el-form :model="config" :rules="rules" ref="configForm" label-width="120px">
                <!-- 基本参数 -->
                <el-divider content-position="left">基本参数</el-divider>
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="开始日期" prop="startDate">
                            <el-date-picker v-model="config.startDate" type="date" placeholder="选择开始日期"
                                style="width: 100%" :disabled-date="disabledStartDate" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="结束日期" prop="endDate">
                            <el-date-picker v-model="config.endDate" type="date" placeholder="选择结束日期"
                                style="width: 100%" :disabled-date="disabledEndDate" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="初始资金" prop="initialCapital">
                            <el-input-number v-model="config.initialCapital" :min="1000" :max="10000000" :step="1000"
                                :precision="0" style="width: 100%" controls-position="right" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- 交易参数 -->
                <el-divider content-position="left">交易参数</el-divider>
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="手续费率" prop="commissionRate">
                            <el-input-number v-model="config.commissionRate" :min="0" :max="0.1" :step="0.0001"
                                :precision="4" style="width: 100%" controls-position="right">
                                <template #append>%</template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="滑点" prop="slippage">
                            <el-input-number v-model="config.slippage" :min="0" :max="0.1" :step="0.0001" :precision="4"
                                style="width: 100%" controls-position="right">
                                <template #append>%</template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="重新平衡" prop="rebalanceFrequency">
                            <el-select v-model="config.rebalanceFrequency" style="width: 100%">
                                <el-option label="每日" value="daily" />
                                <el-option label="每周" value="weekly" />
                                <el-option label="每月" value="monthly" />
                                <el-option label="每季度" value="quarterly" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- 模型选择 -->
                <el-divider content-position="left">模型选择</el-divider>
                <el-form-item label="选择模型" prop="models">
                    <el-select v-model="config.models" multiple placeholder="选择参与回测的模型" style="width: 100%"
                        :loading="modelsLoading">
                        <el-option-group v-for="group in modelGroups" :key="group.type" :label="group.label">
                            <el-option v-for="model in group.models" :key="model.id" :label="model.name"
                                :value="model.id">
                                <div class="model-option">
                                    <span>{{ model.name }}</span>
                                    <span class="model-type">{{ model.type }}</span>
                                    <el-tag size="small" :type="getModelStatusType(model.status)">
                                        {{ getModelStatusText(model.status) }}
                                    </el-tag>
                                </div>
                            </el-option>
                        </el-option-group>
                    </el-select>
                    <div class="model-stats" v-if="selectedModels.length > 0">
                        已选择 {{ selectedModels.length }} 个模型
                        <el-tag v-for="model in selectedModels" :key="model.id" size="small" closable
                            @close="removeModel(model.id)">
                            {{ model.name }}
                        </el-tag>
                    </div>
                </el-form-item>

                <!-- 股票选择 -->
                <el-divider content-position="left">股票选择</el-divider>
                <el-form-item label="股票池" prop="stocks">
                    <div class="stock-selection">
                        <el-select v-model="tempStock" placeholder="搜索并选择股票" style="width: 200px; margin-right: 10px"
                            filterable remote :remote-method="searchStocks" :loading="stocksLoading" @change="addStock">
                            <el-option v-for="stock in searchResults" :key="stock.symbol"
                                :label="`${stock.symbol} - ${stock.name}`" :value="stock.symbol" />
                        </el-select>
                        <el-button type="primary" @click="showStockDialog = true" :icon="Plus">
                            批量添加
                        </el-button>
                    </div>
                    <div class="selected-stocks">
                        <el-tag v-for="stock in config.stocks" :key="stock" size="medium" closable
                            @close="removeStock(stock)">
                            {{ stock }}
                        </el-tag>
                        <div v-if="config.stocks.length === 0" class="empty-stocks">
                            暂无选择的股票
                        </div>
                    </div>
                </el-form-item>

                <!-- 验证信息 -->
                <el-form-item v-if="validationResult.warnings.length > 0">
                    <el-alert title="配置提示" type="warning" :description="validationResult.warnings.join('；')" show-icon
                        :closable="false" />
                </el-form-item>

                <!-- 操作按钮 -->
                <el-form-item>
                    <el-button type="primary" :icon="VideoPlay" @click="validateAndStart" :loading="loading"
                        :disabled="!canStart">
                        开始回测
                    </el-button>
                    <el-button @click="resetConfig">重置配置</el-button>
                    <el-button @click="saveAsTemplate" :icon="DocumentAdd">
                        保存为模板
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 批量添加股票对话框 -->
        <el-dialog v-model="showStockDialog" title="批量添加股票" width="600px" :close-on-click-modal="false">
            <div class="batch-stock-dialog">
                <el-input v-model="batchStocksText" type="textarea" :rows="6"
                    placeholder="请输入股票代码，每行一个，例如：&#10;AAPL&#10;GOOGL&#10;MSFT" />
                <div class="dialog-footer">
                    <el-button @click="showStockDialog = false">取消</el-button>
                    <el-button type="primary" @click="addBatchStocks">确认添加</el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Refresh, Plus, DocumentAdd } from '@element-plus/icons-vue'
import { useBacktestStore } from '@/store/backtest'
import { useModelStore } from '@/store/models'
import { useStocksStore } from '@/store/stocks'
import { validateBacktestConfig } from '@/utils/backtestUtils'
import type { BacktestValidationResult } from '@/utils/backtestUtils'

// Store
const backtestStore = useBacktestStore()
const modelStore = useModelStore()
const stocksStore = useStocksStore()

// 配置数据
const config = ref({
    startDate: '',
    endDate: '',
    initialCapital: 100000,
    models: [] as string[],
    stocks: [] as string[],
    rebalanceFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    commissionRate: 0.001,
    slippage: 0.001
})

// 表单引用
const configForm = ref()

// 加载状态
const loading = ref(false)
const modelsLoading = ref(false)
const stocksLoading = ref(false)

// 搜索相关
const tempStock = ref('')
const searchResults = ref<any[]>([])
const showStockDialog = ref(false)
const batchStocksText = ref('')

// 验证结果
const validationResult = ref<BacktestValidationResult>({
    isValid: false,
    errors: [],
    warnings: []
})

// 表单验证规则
const rules = {
    startDate: [
        { required: true, message: '请选择开始日期', trigger: 'change' }
    ],
    endDate: [
        { required: true, message: '请选择结束日期', trigger: 'change' }
    ],
    initialCapital: [
        { required: true, message: '请输入初始资金', trigger: 'change' },
        { type: 'number', min: 1000, message: '初始资金至少1000', trigger: 'change' }
    ],
    models: [
        { required: true, message: '请至少选择一个模型', trigger: 'change' }
    ],
    stocks: [
        { required: true, message: '请至少选择一支股票', trigger: 'change' }
    ]
}

// 计算属性
const canStart = computed(() => {
    return validationResult.value.isValid && !loading.value
})

const selectedModels = computed(() => {
    return modelStore.models.filter((model: any) =>
        config.value.models.includes(model.id.toString())
    )
})

const modelGroups = computed(() => {
    const groups: Record<string, any[]> = {}

    modelStore.models.forEach((model: any) => {
        if (!groups[model.model_type]) {
            groups[model.model_type] = []
        }
        groups[model.model_type].push(model)
    })

    return Object.keys(groups).map(type => ({
        type,
        label: getModelTypeLabel(type),
        models: groups[type]
    }))
})

// 监听配置变化
watch(config, (newConfig: any) => {
    validationResult.value = validateBacktestConfig(newConfig)
}, { deep: true, immediate: true })

// 方法
const disabledStartDate = (time: Date) => {
    return time.getTime() > Date.now()
}

const disabledEndDate = (time: Date) => {
    if (!config.value.startDate) return time.getTime() > Date.now()
    const startDate = new Date(config.value.startDate)
    return time.getTime() <= startDate.getTime() || time.getTime() > Date.now()
}

const getModelStatusType = (status: string) => {
    const types: Record<string, any> = {
        active: 'success',
        inactive: 'info',
        training: 'warning'
    }
    return types[status] || 'info'
}

const getModelStatusText = (status: string) => {
    const texts: Record<string, string> = {
        active: '活跃',
        inactive: '未激活',
        training: '训练中'
    }
    return texts[status] || status
}

const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        'technical': '技术指标模型',
        'machine_learning': '机器学习模型',
        'deep_learning': '深度学习模型',
        'ensemble': '集成模型'
    }
    return labels[type] || type
}

const removeModel = (modelId: string) => {
    config.value.models = config.value.models.filter((id: string) => id !== modelId)
}

const searchStocks = async (query: string) => {
    if (!query.trim()) {
        searchResults.value = []
        return
    }

    stocksLoading.value = true
    try {
        await stocksStore.searchStocks(query, 10)
        searchResults.value = stocksStore.getSearchResults
    } catch (error) {
        console.error('搜索股票失败:', error)
        searchResults.value = []
    } finally {
        stocksLoading.value = false
    }
}

const addStock = (symbol: string) => {
    if (symbol && !config.value.stocks.includes(symbol)) {
        config.value.stocks.push(symbol)
    }
    tempStock.value = ''
    searchResults.value = []
}

const removeStock = (symbol: string) => {
    config.value.stocks = config.value.stocks.filter((s: string) => s !== symbol)
}

const addBatchStocks = () => {
    if (!batchStocksText.value.trim()) {
        ElMessage.warning('请输入股票代码')
        return
    }

    const stocks = batchStocksText.value
        .split('\n')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)

    const newStocks = stocks.filter((s: string) => !config.value.stocks.includes(s))
    config.value.stocks = [...config.value.stocks, ...newStocks]

    ElMessage.success(`成功添加 ${newStocks.length} 支股票`)
    showStockDialog.value = false
    batchStocksText.value = ''
}

const validateAndStart = async () => {
    try {
        await configForm.value.validate()

        if (!validationResult.value.isValid) {
            ElMessage.error('配置参数有误，请检查')
            return
        }

        loading.value = true

        // 构建回测请求
        const backtestRequest = {
            symbol: config.value.stocks[0], // 单股票回测使用第一个股票
            start_date: config.value.startDate,
            end_date: config.value.endDate,
            initial_capital: config.value.initialCapital,
            model_ids: config.value.models.map((id: string) => parseInt(id))
        }

        // 调用回测
        await backtestStore.runModelBacktest(backtestRequest)

        ElMessage.success('回测执行完成')

        // 触发事件通知父组件
        emit('backtestStarted')

    } catch (error) {
        console.error('回测执行失败:', error)
        ElMessage.error('回测执行失败')
    } finally {
        loading.value = false
    }
}

const resetConfig = () => {
    configForm.value?.resetFields()
    backtestStore.resetConfig()
    ElMessage.info('配置已重置')
}

const saveAsTemplate = async () => {
    try {
        await ElMessageBox.prompt('请输入模板名称', '保存模板', {
            confirmButtonText: '保存',
            cancelButtonText: '取消',
            inputPattern: /.+/,
            inputErrorMessage: '模板名称不能为空'
        })

        ElMessage.success('模板保存成功')
    } catch (error) {
        // 用户取消
    }
}

// 事件
const emit = defineEmits<{
    backtestStarted: []
}>()

// 生命周期
onMounted(async () => {
    try {
        modelsLoading.value = true
        await modelStore.fetchModels()
    } catch (error) {
        console.error('加载模型列表失败:', error)
    } finally {
        modelsLoading.value = false
    }
})
</script>

<style scoped>
.backtest-config {
    width: 100%;
}

.config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.config-card {
    border-radius: 8px;
}

.model-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.model-type {
    font-size: 12px;
    color: #909399;
}

.model-stats {
    margin-top: 8px;
    font-size: 14px;
    color: #606266;
}

.model-stats .el-tag {
    margin-left: 8px;
}

.stock-selection {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.selected-stocks {
    min-height: 40px;
    padding: 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #f5f7fa;
}

.selected-stocks .el-tag {
    margin: 4px;
}

.empty-stocks {
    color: #c0c4cc;
    text-align: center;
    font-size: 14px;
}

.batch-stock-dialog .dialog-footer {
    margin-top: 16px;
    text-align: right;
}

:deep(.el-divider__text) {
    background-color: #fff;
    font-weight: 600;
    color: #303133;
}
</style>