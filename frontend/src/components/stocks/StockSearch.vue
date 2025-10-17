<template>
    <div class="stock-search">
        <!-- 搜索输入框 -->
        <el-autocomplete v-model="searchQuery" :fetch-suggestions="querySearch" :placeholder="placeholder"
            :trigger-on-focus="triggerOnFocus" :debounce="debounce" clearable @select="handleSelect"
            @change="handleChange" @clear="handleClear" class="search-input">
            <template #default="{ item }">
                <div class="suggestion-item">
                    <span class="symbol">{{ item.stock.symbol }}</span>
                    <span class="name">{{ item.stock.name }}</span>
                    <span class="market" v-if="item.stock.market">{{ item.stock.market }}</span>
                </div>
            </template>

            <template #append>
                <el-button :icon="Search" @click="handleSearch" :loading="loading">
                    搜索
                </el-button>
            </template>
        </el-autocomplete>

        <!-- 搜索历史 -->
        <div v-if="showHistory && searchHistory.length > 0" class="search-history">
            <div class="history-header">
                <span>搜索历史</span>
                <el-button type="text" size="small" @click="clearHistory">清空</el-button>
            </div>
            <div class="history-items">
                <el-tag v-for="item in searchHistory" :key="item" size="small" closable @close="removeHistoryItem(item)"
                    @click="selectHistoryItem(item)" class="history-tag">
                    {{ item }}
                </el-tag>
            </div>
        </div>

        <!-- 热门搜索 -->
        <div v-if="showHot && hotStocks.length > 0" class="hot-search">
            <div class="hot-header">
                <span>热门股票</span>
            </div>
            <div class="hot-items">
                <el-tag v-for="stock in hotStocks" :key="stock.symbol" size="small" @click="selectHotStock(stock)"
                    class="hot-tag">
                    {{ stock.symbol }}
                </el-tag>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useStocksStore } from '@/store/stocks'
import { generateSearchSuggestions } from '@/utils/stockUtils'
import type { Stock } from '@/types/api'

interface Props {
    placeholder?: string
    triggerOnFocus?: boolean
    debounce?: number
    showHistory?: boolean
    showHot?: boolean
    hotStocks?: Stock[]
    modelValue?: string
}

interface Emits {
    (e: 'update:modelValue', value: string): void
    (e: 'select', stock: Stock): void
    (e: 'search', query: string): void
    (e: 'change', query: string): void
    (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: '输入股票代码或名称搜索...',
    triggerOnFocus: true,
    debounce: 300,
    showHistory: true,
    showHot: true,
    hotStocks: () => [],
    modelValue: ''
})

const emit = defineEmits<Emits>()

const stocksStore = useStocksStore()
const searchQuery = ref(props.modelValue)
const loading = ref(false)
const searchHistory = ref<string[]>([])
const maxHistoryItems = 10

// 计算属性
const allStocks = computed(() => stocksStore.stockList)
const isLoading = computed(() => stocksStore.isSearchLoading)
const searchResults = computed(() => stocksStore.getSearchResults)

// 监听搜索查询变化
watch(() => props.modelValue, (newValue) => {
    searchQuery.value = newValue
})

// 监听搜索查询变化并更新父组件
watch(searchQuery, (newValue) => {
    emit('update:modelValue', newValue)
    emit('change', newValue)
})

// 组件挂载时加载搜索历史
onMounted(() => {
    loadSearchHistory()
})

// 加载搜索历史
const loadSearchHistory = () => {
    const history = localStorage.getItem('stock_search_history')
    if (history) {
        try {
            searchHistory.value = JSON.parse(history)
        } catch (error) {
            console.error('加载搜索历史失败:', error)
            searchHistory.value = []
        }
    }
}

// 保存搜索历史
const saveSearchHistory = () => {
    try {
        localStorage.setItem('stock_search_history', JSON.stringify(searchHistory.value))
    } catch (error) {
        console.error('保存搜索历史失败:', error)
    }
}

// 添加搜索历史
const addToHistory = (query: string) => {
    if (!query.trim()) return

    // 移除重复项
    const index = searchHistory.value.indexOf(query)
    if (index > -1) {
        searchHistory.value.splice(index, 1)
    }

    // 添加到开头
    searchHistory.value.unshift(query)

    // 限制历史记录数量
    if (searchHistory.value.length > maxHistoryItems) {
        searchHistory.value = searchHistory.value.slice(0, maxHistoryItems)
    }

    saveSearchHistory()
}

// 移除搜索历史项
const removeHistoryItem = (item: string) => {
    const index = searchHistory.value.indexOf(item)
    if (index > -1) {
        searchHistory.value.splice(index, 1)
        saveSearchHistory()
    }
}

// 清空搜索历史
const clearHistory = () => {
    searchHistory.value = []
    saveSearchHistory()
}

// 选择历史项
const selectHistoryItem = (item: string) => {
    searchQuery.value = item
    handleSearch()
}

// 选择热门股票
const selectHotStock = (stock: Stock) => {
    searchQuery.value = stock.symbol
    emit('select', stock)
    addToHistory(stock.symbol)
}

// 搜索建议
const querySearch = async (queryString: string, cb: (arg: any[]) => void) => {
    if (!queryString.trim()) {
        cb([])
        return
    }

    try {
        await stocksStore.searchStocks(queryString, 10)
        const suggestions = generateSearchSuggestions(
            searchResults.value,
            queryString,
            10
        )
        cb(suggestions)
    } catch (error) {
        console.error('获取搜索建议失败:', error)
        cb([])
    }
}

// 处理选择
const handleSelect = (item: any) => {
    if (item && item.stock) {
        emit('select', item.stock)
        addToHistory(item.stock.symbol)
    }
}

// 处理搜索
const handleSearch = () => {
    if (!searchQuery.value.trim()) return

    emit('search', searchQuery.value)
    addToHistory(searchQuery.value)
}

// 处理变化
const handleChange = (value: string) => {
    emit('change', value)
}

// 处理清除
const handleClear = () => {
    searchQuery.value = ''
    emit('clear')
}

// 暴露方法给父组件
defineExpose({
    focus: () => {
        // 这里可以添加聚焦逻辑
    },
    clear: () => {
        searchQuery.value = ''
        handleClear()
    },
    setQuery: (query: string) => {
        searchQuery.value = query
    }
})
</script>

<style scoped>
.stock-search {
    width: 100%;
}

.search-input {
    width: 100%;
}

.suggestion-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    width: 100%;
}

.suggestion-item .symbol {
    font-weight: bold;
    color: #409eff;
    min-width: 80px;
}

.suggestion-item .name {
    flex: 1;
    color: #606266;
    margin: 0 12px;
}

.suggestion-item .market {
    font-size: 12px;
    color: #909399;
    background: #f4f4f5;
    padding: 2px 6px;
    border-radius: 4px;
}

.search-history,
.hot-search {
    margin-top: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
}

.history-header,
.hot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    color: #606266;
}

.history-items,
.hot-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.history-tag,
.hot-tag {
    cursor: pointer;
    transition: all 0.3s ease;
}

.history-tag:hover,
.hot-tag:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-autocomplete) {
    width: 100%;
}

:deep(.el-input-group__append) {
    background-color: #409eff;
    border-color: #409eff;
}

:deep(.el-input-group__append .el-button) {
    color: white;
}

:deep(.el-input-group__append .el-button:hover) {
    background-color: #66b1ff;
}
</style>