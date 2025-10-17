<template>
    <el-card class="model-card" :body-style="{ padding: '16px' }">
        <!-- 卡片头部 -->
        <div class="card-header">
            <div class="model-info">
                <h3 class="model-name">{{ model.name }}</h3>
                <el-tag :type="getModelTypeTag(model.model_type)" size="small">
                    {{ model.model_type }}
                </el-tag>
            </div>
            <div class="model-status">
                <el-tag :type="getStatusType(model.is_active)" size="small">
                    {{ getStatusText(model.is_active) }}
                </el-tag>
            </div>
        </div>

        <!-- 模型描述 -->
        <div class="model-description">
            {{ model.description || '暂无描述' }}
        </div>

        <!-- 性能指标 -->
        <div v-if="model.performance_metrics" class="performance-metrics">
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-label">准确率</div>
                    <div class="metric-value">
                        {{ (model.performance_metrics.accuracy * 100).toFixed(1) }}%
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">总收益</div>
                    <div class="metric-value" :class="getReturnClass(model.performance_metrics.total_return)">
                        {{ (model.performance_metrics.total_return * 100).toFixed(2) }}%
                    </div>
                </div>
            </div>
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-label">夏普比率</div>
                    <div class="metric-value">
                        {{ model.performance_metrics.sharpe_ratio.toFixed(2) }}
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">最大回撤</div>
                    <div class="metric-value" :class="getDrawdownClass(model.performance_metrics.max_drawdown)">
                        {{ (model.performance_metrics.max_drawdown * 100).toFixed(2) }}%
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="no-performance">
            <el-empty description="暂无性能数据" :image-size="60" />
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
            <div class="update-time">
                更新: {{ formatDate(model.updated_at) }}
            </div>
            <div class="card-actions">
                <el-button type="primary" link size="small" @click="handleViewDetail">
                    详情
                </el-button>
                <el-button type="success" link size="small" @click="handleToggleStatus">
                    {{ model.is_active ? '停用' : '启用' }}
                </el-button>
                <el-dropdown @command="handleCommand">
                    <el-button type="info" link size="small">
                        更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="backtest">回测</el-dropdown-item>
                            <el-dropdown-item command="performance">性能分析</el-dropdown-item>
                            <el-dropdown-item command="edit" divided>编辑</el-dropdown-item>
                            <el-dropdown-item command="delete">删除</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import type { BacktestModel } from '@/types/api'

// Props
interface Props {
    model: BacktestModel
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'view-detail': [model: BacktestModel]
    'toggle-status': [model: BacktestModel]
    'backtest': [model: BacktestModel]
    'performance': [model: BacktestModel]
    'edit': [model: BacktestModel]
    'delete': [model: BacktestModel]
}>()

// 方法
const getModelTypeTag = (type: string) => {
    const typeMap: Record<string, string> = {
        'technical': '',
        'machine_learning': 'success',
        'deep_learning': 'warning',
        'fundamental': 'info',
        'hybrid': 'danger'
    }
    return typeMap[type] || ''
}

const getStatusType = (isActive: boolean) => {
    return isActive ? 'success' : 'info'
}

const getStatusText = (isActive: boolean) => {
    return isActive ? '活跃' : '停用'
}

const getReturnClass = (returnValue: number) => {
    return returnValue > 0 ? 'positive-return' : 'negative-return'
}

const getDrawdownClass = (drawdown: number) => {
    return drawdown < -0.1 ? 'high-drawdown' : 'normal-drawdown'
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
}

const handleViewDetail = () => {
    emit('view-detail', props.model)
}

const handleToggleStatus = () => {
    emit('toggle-status', props.model)
}

const handleCommand = (command: string) => {
    switch (command) {
        case 'backtest':
            emit('backtest', props.model)
            break
        case 'performance':
            emit('performance', props.model)
            break
        case 'edit':
            emit('edit', props.model)
            break
        case 'delete':
            emit('delete', props.model)
            break
    }
}
</script>

<style scoped>
.model-card {
    border-radius: 8px;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.model-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.model-info {
    flex: 1;
}

.model-name {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
}

.model-status {
    flex-shrink: 0;
    margin-left: 8px;
}

.model-description {
    color: #606266;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.performance-metrics {
    margin-bottom: 16px;
}

.metric-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
}

.metric-item {
    flex: 1;
    text-align: center;
}

.metric-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
}

.metric-value {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.no-performance {
    margin-bottom: 16px;
    text-align: center;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
}

.update-time {
    font-size: 12px;
    color: #909399;
}

.card-actions {
    display: flex;
    gap: 4px;
    align-items: center;
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

/* 响应式设计 */
@media (max-width: 768px) {
    .card-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .model-status {
        margin-left: 0;
        margin-top: 8px;
    }

    .metric-row {
        flex-direction: column;
        gap: 8px;
    }

    .metric-item {
        text-align: left;
    }

    .card-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .card-actions {
        justify-content: space-between;
    }
}
</style>