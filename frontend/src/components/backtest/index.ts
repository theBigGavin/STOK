// 回测组件索引文件
export { default as BacktestConfig } from './BacktestConfig.vue'
export { default as BacktestProgress } from './BacktestProgress.vue'
export { default as BacktestResult } from './BacktestResult.vue'
export { default as BacktestHistory } from './BacktestHistory.vue'
export { default as BacktestCompare } from './BacktestCompare.vue'
export { default as BacktestCharts } from './BacktestCharts.vue'

// 导出类型
export type { BacktestValidationResult, BacktestChartData, BacktestComparisonData } from '@/utils/backtestUtils'

// 导出工具函数
export * from '@/utils/backtestUtils'