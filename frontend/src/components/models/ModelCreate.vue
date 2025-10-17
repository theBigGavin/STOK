<template>
    <el-dialog v-model="visible" title="创建新模型" width="60%" top="5vh" destroy-on-close @close="handleClose">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="left"
            :disabled="loading">
            <!-- 基本信息 -->
            <el-card class="form-section">
                <template #header>
                    <span>基本信息</span>
                </template>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="模型名称" prop="name">
                            <el-input v-model="form.name" placeholder="请输入模型名称" maxlength="50" show-word-limit />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="模型类型" prop="model_type">
                            <el-select v-model="form.model_type" placeholder="请选择模型类型" style="width: 100%"
                                @change="handleModelTypeChange">
                                <el-option v-for="type in modelTypes" :key="type.value" :label="type.label"
                                    :value="type.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="模型描述" prop="description">
                    <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入模型描述" maxlength="200"
                        show-word-limit />
                </el-form-item>
            </el-card>

            <!-- 参数配置 -->
            <el-card class="form-section">
                <template #header>
                    <span>参数配置</span>
                </template>

                <div v-if="form.model_type">
                    <!-- 技术指标模型参数 -->
                    <div v-if="form.model_type === 'technical'" class="parameters-grid">
                        <el-form-item label="技术指标" prop="parameters.indicators">
                            <el-select v-model="form.parameters.indicators" multiple placeholder="请选择技术指标"
                                style="width: 100%">
                                <el-option label="移动平均线 (MA)" value="MA" />
                                <el-option label="相对强弱指数 (RSI)" value="RSI" />
                                <el-option label="MACD" value="MACD" />
                                <el-option label="布林带" value="BOLL" />
                                <el-option label="随机指标" value="KDJ" />
                                <el-option label="成交量" value="VOLUME" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="回看周期" prop="parameters.lookback">
                            <el-input-number v-model="form.parameters.lookback" :min="5" :max="100" :step="5"
                                placeholder="回看周期" />
                        </el-form-item>

                        <el-form-item label="信号阈值" prop="parameters.threshold">
                            <el-input-number v-model="form.parameters.threshold" :min="0.1" :max="0.9" :step="0.1"
                                :precision="2" placeholder="信号阈值" />
                        </el-form-item>
                    </div>

                    <!-- 机器学习模型参数 -->
                    <div v-else-if="form.model_type === 'machine_learning'" class="parameters-grid">
                        <el-form-item label="算法类型" prop="parameters.algorithm">
                            <el-select v-model="form.parameters.algorithm" placeholder="请选择算法" style="width: 100%">
                                <el-option label="随机森林" value="RandomForest" />
                                <el-option label="梯度提升树" value="GradientBoosting" />
                                <el-option label="支持向量机" value="SVM" />
                                <el-option label="逻辑回归" value="LogisticRegression" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="特征数量" prop="parameters.features">
                            <el-input-number v-model="form.parameters.features" :min="10" :max="200" :step="10"
                                placeholder="特征数量" />
                        </el-form-item>

                        <el-form-item label="估计器数量" prop="parameters.estimators">
                            <el-input-number v-model="form.parameters.estimators" :min="50" :max="500" :step="50"
                                placeholder="估计器数量" />
                        </el-form-item>

                        <el-form-item label="学习率" prop="parameters.learning_rate">
                            <el-input-number v-model="form.parameters.learning_rate" :min="0.01" :max="0.5" :step="0.01"
                                :precision="2" placeholder="学习率" />
                        </el-form-item>
                    </div>

                    <!-- 深度学习模型参数 -->
                    <div v-else-if="form.model_type === 'deep_learning'" class="parameters-grid">
                        <el-form-item label="网络结构" prop="parameters.architecture">
                            <el-select v-model="form.parameters.architecture" placeholder="请选择网络结构" style="width: 100%">
                                <el-option label="LSTM" value="LSTM" />
                                <el-option label="GRU" value="GRU" />
                                <el-option label="CNN-LSTM" value="CNN_LSTM" />
                                <el-option label="Transformer" value="Transformer" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="隐藏层数" prop="parameters.layers">
                            <el-input-number v-model="form.parameters.layers" :min="1" :max="5" placeholder="隐藏层数" />
                        </el-form-item>

                        <el-form-item label="隐藏单元数" prop="parameters.units">
                            <el-input-number v-model="form.parameters.units" :min="32" :max="512" :step="32"
                                placeholder="隐藏单元数" />
                        </el-form-item>

                        <el-form-item label="训练轮数" prop="parameters.epochs">
                            <el-input-number v-model="form.parameters.epochs" :min="10" :max="500" :step="10"
                                placeholder="训练轮数" />
                        </el-form-item>

                        <el-form-item label="批大小" prop="parameters.batch_size">
                            <el-input-number v-model="form.parameters.batch_size" :min="16" :max="256" :step="16"
                                placeholder="批大小" />
                        </el-form-item>
                    </div>

                    <!-- 基本面模型参数 -->
                    <div v-else-if="form.model_type === 'fundamental'" class="parameters-grid">
                        <el-form-item label="财务指标" prop="parameters.metrics">
                            <el-select v-model="form.parameters.metrics" multiple placeholder="请选择财务指标"
                                style="width: 100%">
                                <el-option label="市盈率 (PE)" value="PE" />
                                <el-option label="市净率 (PB)" value="PB" />
                                <el-option label="净资产收益率 (ROE)" value="ROE" />
                                <el-option label="营收增长率" value="REVENUE_GROWTH" />
                                <el-option label="净利润增长率" value="PROFIT_GROWTH" />
                                <el-option label="股息率" value="DIVIDEND_YIELD" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="考虑行业" prop="parameters.industry_analysis">
                            <el-switch v-model="form.parameters.industry_analysis" />
                        </el-form-item>

                        <el-form-item label="宏观经济" prop="parameters.macro_economic">
                            <el-switch v-model="form.parameters.macro_economic" />
                        </el-form-item>
                    </div>

                    <!-- 混合模型参数 -->
                    <div v-else-if="form.model_type === 'hybrid'" class="parameters-grid">
                        <el-form-item label="技术权重" prop="parameters.weight_technical">
                            <el-input-number v-model="form.parameters.weight_technical" :min="0" :max="1" :step="0.1"
                                :precision="1" placeholder="技术权重" />
                        </el-form-item>

                        <el-form-item label="机器学习权重" prop="parameters.weight_ml">
                            <el-input-number v-model="form.parameters.weight_ml" :min="0" :max="1" :step="0.1"
                                :precision="1" placeholder="机器学习权重" />
                        </el-form-item>

                        <el-form-item label="基本面权重" prop="parameters.weight_fundamental">
                            <el-input-number v-model="form.parameters.weight_fundamental" :min="0" :max="1" :step="0.1"
                                :precision="1" placeholder="基本面权重" />
                        </el-form-item>

                        <el-form-item label="深度学习权重" prop="parameters.weight_dl">
                            <el-input-number v-model="form.parameters.weight_dl" :min="0" :max="1" :step="0.1"
                                :precision="1" placeholder="深度学习权重" />
                        </el-form-item>
                    </div>

                    <div v-else class="no-parameters">
                        <el-empty description="该模型类型暂无特定参数配置" :image-size="80" />
                    </div>
                </div>

                <div v-else class="select-type-first">
                    <el-empty description="请先选择模型类型" :image-size="80" />
                </div>
            </el-card>

            <!-- 高级配置 -->
            <el-card class="form-section">
                <template #header>
                    <span>高级配置</span>
                </template>

                <el-form-item label="初始训练数据">
                    <el-date-picker v-model="trainingDateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>

                <el-form-item label="验证集比例">
                    <el-slider v-model="form.validation_split" :min="0.1" :max="0.4" :step="0.05"
                        :format-tooltip="(value: number) => `${(value * 100).toFixed(0)}%`" show-stops />
                </el-form-item>

                <el-form-item label="自动启用">
                    <el-switch v-model="form.auto_activate" />
                    <span class="form-tip">创建完成后自动启用模型</span>
                </el-form-item>
            </el-card>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose" :disabled="loading">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">
                    创建模型
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useModelStore } from '@/store/models'
import type { BacktestModelCreate } from '@/types/api'

// Props
interface Props {
    visible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'update:visible': [value: boolean]
    'success': []
}>()

// Store
const modelStore = useModelStore()

// 表单引用
const formRef = ref<FormInstance>()

// 响应式数据
const loading = ref(false)
const trainingDateRange = ref<string[]>([])

// 表单数据
const form = reactive<BacktestModelCreate & {
    validation_split: number
    auto_activate: boolean
}>({
    name: '',
    description: '',
    model_type: '',
    parameters: {},
    validation_split: 0.2,
    auto_activate: true
})

// 表单验证规则
const rules: FormRules = {
    name: [
        { required: true, message: '请输入模型名称', trigger: 'blur' },
        { min: 2, max: 50, message: '模型名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    model_type: [
        { required: true, message: '请选择模型类型', trigger: 'change' }
    ],
    description: [
        { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
    ]
}

// 计算属性
const visible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value)
})

const modelTypes = computed(() => [
    { label: '技术指标模型', value: 'technical' },
    { label: '机器学习模型', value: 'machine_learning' },
    { label: '深度学习模型', value: 'deep_learning' },
    { label: '基本面分析模型', value: 'fundamental' },
    { label: '混合模型', value: 'hybrid' }
])

// 方法
const handleModelTypeChange = (type: string) => {
    // 根据模型类型初始化默认参数
    form.parameters = getDefaultParameters(type)
}

const getDefaultParameters = (type: string): Record<string, any> => {
    const defaults: Record<string, Record<string, any>> = {
        technical: {
            indicators: ['MA', 'RSI', 'MACD'],
            lookback: 20,
            threshold: 0.5
        },
        machine_learning: {
            algorithm: 'RandomForest',
            features: 50,
            estimators: 100,
            learning_rate: 0.1
        },
        deep_learning: {
            architecture: 'LSTM',
            layers: 2,
            units: 128,
            epochs: 100,
            batch_size: 32
        },
        fundamental: {
            metrics: ['PE', 'PB', 'ROE'],
            industry_analysis: true,
            macro_economic: false
        },
        hybrid: {
            weight_technical: 0.4,
            weight_ml: 0.3,
            weight_fundamental: 0.2,
            weight_dl: 0.1
        }
    }
    return defaults[type] || {}
}

const resetForm = () => {
    form.name = ''
    form.description = ''
    form.model_type = ''
    form.parameters = {}
    form.validation_split = 0.2
    form.auto_activate = true
    trainingDateRange.value = []

    if (formRef.value) {
        formRef.value.clearValidate()
    }
}

const handleClose = () => {
    visible.value = false
    resetForm()
}

const handleSubmit = async () => {
    if (!formRef.value) return

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    loading.value = true
    try {
        // 准备提交数据
        const submitData: BacktestModelCreate = {
            name: form.name,
            description: form.description,
            model_type: form.model_type,
            parameters: form.parameters
        }

        await modelStore.addModel(submitData)
        ElMessage.success('模型创建成功')
        emit('success')
        handleClose()
    } catch (error) {
        ElMessage.error('模型创建失败')
        console.error('创建模型失败:', error)
    } finally {
        loading.value = false
    }
}

// 监听器
watch(() => props.visible, (newVisible: boolean) => {
    if (!newVisible) {
        resetForm()
    }
})
</script>

<style scoped>
.form-section {
    margin-bottom: 20px;
}

.parameters-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 20px;
}

.no-parameters,
.select-type-first {
    text-align: center;
    padding: 40px 0;
}

.form-tip {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .parameters-grid {
        grid-template-columns: 1fr;
    }
}
</style>