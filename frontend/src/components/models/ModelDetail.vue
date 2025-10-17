<template>
    <el-dialog v-model="visible" :title="model ? `模型详情 - ${model.name}` : '模型详情'" width="90%" top="5vh" destroy-on-close
        @close="handleClose">
        <div v-loading="loading" class="model-detail">
            <!-- 基本信息 -->
            <el-card class="info-section">
                <template #header>
                    <div class="section-header">
                        <span>基本信息</span>
                        <el-button type="primary" size="small" @click="handleEdit">
                            编辑
                        </el-button>
                    </div>
                </template>

                <el-descriptions :column="2" border>
                    <el-descriptions-item label="模型名称">
                        {{ model?.name || 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="模型类型">
                        <el-tag :type="getModelTypeTag(model?.model_type)">
                            {{ model?.model_type || 'N/A' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getStatusType(model?.is_active)" size="small">
                            {{ getStatusText(model?.is_active) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">
                        {{ formatDate(model?.created_at) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="最后更新">
                        {{ formatDate(model?.updated_at) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="描述" :span="2">
                        {{ model?.description || '暂无描述' }}
                    </el-descriptions-item>
                </el-descriptions>
            </el-card>

            <!-- 性能指标 -->
            <el-card class="performance-section">
                <template #header>
                    <div class="section-header">
                        <span>性能指标</span>
                        <el-button type="primary" size="small" @click="runBacktest">
                            运行回测
                        </el-button>
                    </div>
                </template>

                <div v-if="model?.performance_metrics" class="performance-grid">
                    <div class="metric-card">
                        <div class="metric-value" :class="getReturnClass(model.performance_metrics.total_return)">
                            {{ (model.performance_metrics.total_return * 100).toFixed(2) }}%
                        </div>
                        <div class="metric-label">总收益</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            {{ (model.performance_metrics.accuracy * 100).toFixed(1) }}%
                        </div>
                        <div class="metric-label">准确率</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            {{ model.performance_metrics.sharpe_ratio.toFixed(2) }}
                        </div>
                        <div class="metric-label">夏普比率</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" :class="getDrawdownClass(model.performance_metrics.max_drawdown)">
                            {{ (model.performance_metrics.max_drawdown * 100).toFixed(2) }}%
                        </div>
                        <div class="metric-label">最大回撤</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            {{ (model.performance_metrics.precision * 100).toFixed(1) }}%
                        </div>
                        <div class="metric-label">精确率</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            {{ (model.performance_metrics.recall * 100).toFixed(1) }}%
                        </div>
                        <div class="metric-label">召回率</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            {{ (model.performance_metrics.f1_score * 100).toFixed(1) }}%
                        </div>
                        <div class="metric-label">F1分数</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            {{ (model.performance_metrics.win_rate * 100).toFixed(1) }}%
                        </div>
                        <div class="metric-label">胜率</div>
                    </div>
                </div>
                <div v-else class="no-performance">
                    <el-empty description="暂无性能数据" :image-size="100">
                        <el-button type="primary" @click="runBacktest">
                            运行回测获取数据
                        </el-button>
                    </el-empty>
                </div>
            </el-card>

            <!-- 参数配置 -->
            <el-card class="parameters-section">
                <template #header>
                    <span>参数配置</span>
                </template>

                <div v-if="model?.parameters && Object.keys(model.parameters).length > 0">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item v-for="(value, key) in model.parameters" :key="key"
                            :label="formatParameterKey(key)">
                            {{ formatParameterValue(value) }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
                <div v-else class="no-parameters">
                    <el-empty description="暂无参数配置" :image-size="80" />
                </div>
            </el-card>

            <!-- 性能历史图表 -->
            <el-card class="history-section">
                <template #header>
                    <span>性能历史</span>
                </template>

                <ModelPerformanceChart :model-id="modelId" :height="300" />
            </el-card>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="handleClose">
                    确定
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useModelStore } from '@/store/models'
import type { BacktestModel } from '@/types/api'
import ModelPerformanceChart from './ModelPerformanceChart.vue'

// Props
interface Props {
    modelId?: number
    visible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'update:visible': [value: boolean]
    'edit': [model: BacktestModel]
    'backtest': [model: BacktestModel]
}>()

// Store
const modelStore = useModelStore()

// 响应式数据
const loading = ref(false)

// 计算属性
const model = computed(() => {
    if (props.modelId) {
        return modelStore.currentModel
    }
    return null
})

// 方法
const getModelTypeTag = (type?: string) => {
    if (!type) return ''
    const typeMap: Record<string, string> = {
        '技术指标': '',
        '机器学习': 'success',
        '深度学习': 'warning',
        '基本面': 'info',
        '混合': 'danger'
    }
    return typeMap[type] || ''
}

const getStatusType = (isActive?: boolean) => {
    if (isActive === undefined) return 'info'
    return isActive ? 'success' : 'info'
}

const getStatusText = (isActive?: boolean) => {
    if (isActive === undefined) return '未知'
    return isActive ? '活跃' : '停用'
}

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('zh-CN')
}

const getReturnClass = (returnValue?: number) => {
    if (!returnValue) return ''
    return returnValue > 0 ? 'positive-return' : 'negative-return'
}

const getDrawdownClass = (drawdown?: number) => {
    if (!drawdown) return ''
    return drawdown < -0.1 ? 'high-drawdown' : 'normal-drawdown'
}

const formatParameterKey = (key: string) => {
    // 将 snake_case 转换为 Title Case
    return key.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

const formatParameterValue = (value: any) => {
    if (Array.isArray(value)) {
        return value.join(', ')
    }
    if (typeof value === 'boolean') {
        return value ? '是' : '否'
    }
    if (typeof value === 'number') {
        return value.toString()
    }
    if (typeof value === 'string') {
        return value
    }
    return JSON.stringify(value)
}

const handleClose = () => {
    emit('update:visible', false)
    modelStore.clearCurrentModel()
}

const handleEdit = () => {
    if (model.value) {
        emit('edit', model.value)
    }
}

const runBacktest = () => {
    if (model.value) {
        emit('backtest', model.value)
    }
}

// 监听器
watch(() => props.visible, async (newVisible: boolean) => {
    if (newVisible && props.modelId) {
        loading.value = true
        try {
            await modelStore.fetchModel(props.modelId)
            await modelStore.fetchModelPerformance(props.modelId)
        } catch (error) {
            console.error('加载模型详情失败:', error)
        } finally {
            loading.value = false
        }
    }
})

watch(() => props.modelId, (newModelId: number | undefined) => {
    if (newModelId && props.visible) {
        modelStore.fetchModel(newModelId)
        modelStore.fetchModelPerformance(newModelId)
    }
})
</script>

<style scoped>
.model-detail {
    max-height: 70vh;
    overflow-y: auto;
}

.info-section,
.performance-section,
.parameters-section,
.history-section {
    margin-bottom: 20px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.performance-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.metric-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    border: 1px solid #e9ecef;
}

.metric-value {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
}

.metric-label {
    font-size: 14px;
    color: #6c757d;
}

.positive-return {
    color: #67c23a;
}

.negative-return {
    color: #f56c6c;
}

.high-drawdown {
    color: #f56c6c;
}

.normal-drawdown {
    color: #e6a23c;
}

.no-performance,
.no-parameters {
    text-align: center;
    padding: 40px 0;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .performance-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .performance-grid {
        grid-template-columns: 1fr;
    }
}
</style>