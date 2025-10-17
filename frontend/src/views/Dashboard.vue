<template>
    <div class="dashboard">
        <div class="dashboard-header">
            <h1>仪表盘</h1>
            <p>股票交易决策系统概览</p>
        </div>

        <!-- 统计卡片 -->
        <el-row :gutter="20" class="stats-cards">
            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon" style="background-color: #409eff;">
                            <el-icon>
                                <TrendCharts />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">156</div>
                            <div class="stat-label">监控股票数</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon" style="background-color: #67c23a;">
                            <el-icon>
                                <DataAnalysis />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">89%</div>
                            <div class="stat-label">模型准确率</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon" style="background-color: #e6a23c;">
                            <el-icon>
                                <Histogram />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">23</div>
                            <div class="stat-label">今日信号</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon" style="background-color: #f56c6c;">
                            <el-icon>
                                <Odometer />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">12.5%</div>
                            <div class="stat-label">平均收益率</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 图表区域 -->
        <el-row :gutter="20" class="charts-section">
            <el-col :span="16">
                <el-card class="chart-card">
                    <template #header>
                        <span>股票价格趋势</span>
                    </template>
                    <div class="chart-container">
                        <div class="chart-placeholder">
                            <el-icon>
                                <TrendCharts />
                            </el-icon>
                            <p>股票价格趋势图表</p>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card class="chart-card">
                    <template #header>
                        <span>模型分布</span>
                    </template>
                    <div class="chart-container">
                        <div class="chart-placeholder">
                            <el-icon>
                                <PieChart />
                            </el-icon>
                            <p>模型分布图表</p>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 最近信号 -->
        <el-card class="recent-signals">
            <template #header>
                <span>最近交易信号</span>
            </template>
            <el-table :data="recentSignals" style="width: 100%">
                <el-table-column prop="symbol" label="股票代码" width="120" />
                <el-table-column prop="name" label="股票名称" width="150" />
                <el-table-column prop="signal" label="信号类型" width="100">
                    <template #default="scope">
                        <el-tag :type="scope.row.signal === 'BUY' ? 'success' : 'danger'" size="small">
                            {{ scope.row.signal === 'BUY' ? '买入' : '卖出' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="confidence" label="置信度" width="100">
                    <template #default="scope">
                        <el-progress :percentage="scope.row.confidence" :show-text="false" :stroke-width="8" />
                        <span style="margin-left: 8px">{{ scope.row.confidence }}%</span>
                    </template>
                </el-table-column>
                <el-table-column prop="model" label="模型" width="120" />
                <el-table-column prop="timestamp" label="时间" width="180" />
                <el-table-column label="操作" width="120">
                    <template #default>
                        <el-button type="primary" link size="small">查看详情</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 最近信号数据
const recentSignals = ref([
    {
        symbol: 'AAPL',
        name: '苹果公司',
        signal: 'BUY',
        confidence: 85,
        model: '技术分析模型',
        timestamp: '2024-01-15 14:30:25'
    },
    {
        symbol: 'GOOGL',
        name: '谷歌公司',
        signal: 'SELL',
        confidence: 72,
        model: '机器学习模型',
        timestamp: '2024-01-15 13:45:10'
    },
    {
        symbol: 'MSFT',
        name: '微软公司',
        signal: 'BUY',
        confidence: 91,
        model: '技术分析模型',
        timestamp: '2024-01-15 12:20:35'
    },
    {
        symbol: 'TSLA',
        name: '特斯拉',
        signal: 'BUY',
        confidence: 68,
        model: '混合模型',
        timestamp: '2024-01-15 11:15:40'
    },
    {
        symbol: 'AMZN',
        name: '亚马逊',
        signal: 'SELL',
        confidence: 79,
        model: '机器学习模型',
        timestamp: '2024-01-15 10:05:15'
    }
])
</script>

<style scoped>
.dashboard {
    padding: 0;
}

.dashboard-header {
    margin-bottom: 24px;
}

.dashboard-header h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #303133;
}

.dashboard-header p {
    margin: 0;
    color: #909399;
    font-size: 14px;
}

.stats-cards {
    margin-bottom: 24px;
}

.stat-card {
    border-radius: 8px;
}

.stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.stat-icon .el-icon {
    font-size: 24px;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    line-height: 1;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 14px;
    color: #909399;
}

.charts-section {
    margin-bottom: 24px;
}

.chart-card {
    border-radius: 8px;
}

.chart-container {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chart-placeholder {
    text-align: center;
    color: #909399;
}

.chart-placeholder .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #dcdfe6;
}

.recent-signals {
    border-radius: 8px;
}
</style>