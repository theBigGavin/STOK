<template>
  <div class="model-config">
    <!-- 配置头部 -->
    <div class="config-header">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">模型配置</h3>
      </slot>

      <!-- 配置操作 -->
      <div class="config-actions">
        <slot name="actions">
          <div class="flex items-center space-x-3">
            <button
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="resetConfig"
            >
              重置
            </button>
            <button
              :disabled="!isFormValid || saving"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="saveConfig"
            >
              <svg
                v-if="saving"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ saving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </slot>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-10 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-1/3"></div>
        <div class="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">加载失败</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置表单 -->
    <div v-else class="config-form">
      <form @submit.prevent="saveConfig">
        <!-- 基本信息配置 -->
        <div class="config-section">
          <h4 class="text-md font-medium text-gray-900 mb-4">基本信息</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 模型名称 -->
            <div class="form-group">
              <label for="modelName" class="block text-sm font-medium text-gray-700 mb-2">
                模型名称 <span class="text-red-500">*</span>
              </label>
              <input
                id="modelName"
                v-model="config.name"
                type="text"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :class="{ 'border-red-300': errors.name }"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
            </div>

            <!-- 模型类型 -->
            <div class="form-group">
              <label for="modelType" class="block text-sm font-medium text-gray-700 mb-2">
                模型类型 <span class="text-red-500">*</span>
              </label>
              <select
                id="modelType"
                v-model="config.modelType"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :class="{ 'border-red-300': errors.modelType }"
              >
                <option value="technical">技术指标</option>
                <option value="ml">机器学习</option>
                <option value="dl">深度学习</option>
              </select>
              <p v-if="errors.modelType" class="mt-1 text-sm text-red-600">
                {{ errors.modelType }}
              </p>
            </div>

            <!-- 模型描述 -->
            <div class="form-group md:col-span-2">
              <label for="modelDescription" class="block text-sm font-medium text-gray-700 mb-2">
                模型描述
              </label>
              <textarea
                id="modelDescription"
                v-model="config.description"
                rows="3"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 权重配置 -->
        <div class="config-section">
          <h4 class="text-md font-medium text-gray-900 mb-4">投票权重</h4>
          <div class="form-group">
            <label for="modelWeight" class="block text-sm font-medium text-gray-700 mb-2">
              权重值 (0.0 - 1.0) <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center space-x-4">
              <input
                id="modelWeight"
                v-model.number="config.weight"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span class="text-sm font-medium text-gray-700 min-w-12">
                {{ config.weight.toFixed(1) }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-500">权重越高，模型在投票决策中的影响力越大</p>
          </div>
        </div>

        <!-- 参数配置 -->
        <div class="config-section">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-md font-medium text-gray-900">模型参数</h4>
            <button
              type="button"
              class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="addParameter"
            >
              <svg class="-ml-1 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              添加参数
            </button>
          </div>

          <div class="parameters-list space-y-3">
            <div
              v-for="(param, index) in config.parameters"
              :key="index"
              class="parameter-item flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
            >
              <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    v-model="param.key"
                    type="text"
                    placeholder="参数名"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <input
                    v-model="param.value"
                    type="text"
                    placeholder="参数值"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                class="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                @click="removeParameter(index)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="config.parameters.length === 0" class="empty-parameters">
            <div class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="mt-2 text-sm text-gray-500">暂无参数配置</p>
            </div>
          </div>
        </div>

        <!-- 状态配置 -->
        <div class="config-section">
          <h4 class="text-md font-medium text-gray-900 mb-4">模型状态</h4>
          <div class="flex items-center">
            <input
              id="modelActive"
              v-model="config.isActive"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="modelActive" class="ml-2 block text-sm text-gray-700"> 启用模型 </label>
          </div>
          <p class="mt-1 text-sm text-gray-500">启用后模型将参与投票决策，停用后模型将不参与决策</p>
        </div>

        <!-- 自定义配置插槽 -->
        <slot name="custom-config" :config="config" :errors="errors"></slot>
      </form>
    </div>

    <!-- 保存成功提示 -->
    <div v-if="saveSuccess" class="success-state">
      <div class="bg-green-50 border border-green-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">保存成功</h3>
            <p class="text-sm text-green-700 mt-1">模型配置已成功保存</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelInfo } from '~/types/models';

interface ParameterItem {
  key: string;
  value: string;
}

interface EditableModelConfig extends Omit<ModelInfo, 'parameters'> {
  parameters: ParameterItem[];
}

interface Props {
  model?: ModelInfo;
  loading?: boolean;
  error?: string;
  saving?: boolean;
  saveSuccess?: boolean;
}

interface Emits {
  (e: 'config-save', config: ModelInfo): void;
  (e: 'config-reset'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  saving: false,
  saveSuccess: false,
});

const emit = defineEmits<Emits>();

// 默认配置
const defaultConfig: EditableModelConfig = {
  modelId: 0,
  name: '',
  description: '',
  modelType: 'technical',
  parameters: [],
  weight: 0.5,
  isActive: true,
};

// 配置状态
const config = reactive<EditableModelConfig>({ ...defaultConfig });

// 错误状态
const errors = reactive<Record<string, string>>({});

// 表单验证
const isFormValid = computed(() => {
  return (
    config.name.trim() !== '' && config.weight >= 0 && config.weight <= 1
  );
});

// 重置配置
const resetConfig = () => {
  Object.assign(config, props.model ? { ...props.model } : { ...defaultConfig });
  // 清空错误对象而不是动态删除属性
  Object.keys(errors).forEach(key => {
    errors[key] = '';
  });
  emit('config-reset');
};

// 保存配置
const saveConfig = () => {
  // 验证表单
  errors.name = config.name.trim() === '' ? '模型名称不能为空' : '';
  errors.weight = config.weight < 0 || config.weight > 1 ? '权重必须在0到1之间' : '';

  // 如果有错误，不提交
  if (Object.values(errors).some(error => error !== '')) {
    return;
  }

  // 转换参数为对象格式
  const parameters: Record<string, unknown> = {};
  config.parameters.forEach(param => {
    if (param.key && param.value) {
      // 尝试解析数值
      const numValue = Number(param.value);
      parameters[param.key] = isNaN(numValue) ? param.value : numValue;
    }
  });

  const configToSave: ModelInfo = {
    ...config,
    parameters,
  };

  emit('config-save', configToSave);
};

// 添加参数
const addParameter = () => {
  config.parameters.push({ key: '', value: '' });
};

// 移除参数
const removeParameter = (index: number) => {
  config.parameters.splice(index, 1);
};

// 监听模型变化
watch(
  () => props.model,
  newModel => {
    if (newModel) {
      Object.assign(config, { ...newModel });

      // 转换参数为数组格式用于编辑
      config.parameters = Object.entries(newModel.parameters).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    } else {
      resetConfig();
    }
  },
  { immediate: true, deep: true }
);

// 监听保存成功状态
watch(
  () => props.saveSuccess,
  success => {
    if (success) {
      // 可以添加保存成功后的逻辑，比如自动重置表单等
    }
  }
);
</script>

<style scoped>
.model-config {
  @apply bg-white shadow rounded-lg p-6;
}

.config-header {
  @apply flex justify-between items-center mb-6 pb-4 border-b border-gray-200;
}

.config-actions {
  @apply flex items-center space-x-3;
}

.loading-state {
  @apply space-y-4;
}

.error-state {
  @apply mb-6;
}

.config-form {
  @apply space-y-6;
}

.config-section {
  @apply p-4 border border-gray-200 rounded-lg;
}

.form-group {
  @apply space-y-2;
}

.parameters-list {
  @apply space-y-3;
}

.parameter-item {
  @apply flex items-center space-x-3 p-3 border border-gray-200 rounded-lg;
}

.empty-parameters {
  @apply border-2 border-dashed border-gray-300 rounded-lg;
}

.success-state {
  @apply mt-6;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .config-header {
    @apply flex-col items-start space-y-4;
  }

  .config-actions {
    @apply w-full justify-start;
  }

  .parameter-item {
    @apply flex-col items-start space-y-3;
  }

  .parameter-item .flex-1 {
    @apply w-full;
  }
}
</style>
