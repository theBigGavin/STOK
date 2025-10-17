<template>
    <div class="not-found">
        <div class="error-content">
            <div class="error-code">404</div>
            <div class="error-message">页面未找到</div>
            <div class="error-description">
                抱歉，您访问的页面不存在或已被移动
            </div>
            <div class="action-buttons">
                <el-button type="primary" :icon="ArrowLeft" @click="goBack">
                    返回上页
                </el-button>
                <el-button :icon="House" @click="goHome">
                    返回首页
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, House } from '@element-plus/icons-vue'

const router = useRouter()

// 返回上页
const goBack = () => {
    router.back()
}

// 返回首页
const goHome = () => {
    router.push('/')
}
</script>

<style scoped>
.not-found {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 40px 20px;
}

.error-content {
    text-align: center;
    max-width: 500px;
}

.error-code {
    font-size: 120px;
    font-weight: bold;
    color: #409eff;
    line-height: 1;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(64, 158, 255, 0.2);
}

.error-message {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
}

.error-description {
    font-size: 16px;
    color: #909399;
    margin-bottom: 32px;
    line-height: 1.6;
}

.action-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
}

@media (max-width: 768px) {
    .error-code {
        font-size: 80px;
    }

    .error-message {
        font-size: 20px;
    }

    .action-buttons {
        flex-direction: column;
        align-items: center;
    }

    .action-buttons .el-button {
        width: 200px;
    }
}
</style>