import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Stocks from '@/views/Stocks.vue'
import { useStocksStore } from '@/store/stocks'
import type { Stock, StockDailyData } from '@/types/api'
import { createMockStock, createMockStockDailyData, createMockStockDataArray } from '../../utils/test-utils'

// Mock 子组件
vi.mock('@/components/stocks/StockSearch.vue', () => ({
  default: {
    template: '<div class="mock-stock-search"><slot /></div>',
    props: ['modelValue', 'placeholder', 'showHistory', 'showHot'],
    emits: ['select', 'search', 'change', 'update:modelValue']
  }
}))

vi.mock('@/components/stocks/StockTable.vue', () => ({
  default: {
    template: '<div class="mock-stock-table"><slot /></div>',
    props: ['stocks', 'loading', 'title', 'showToolbar', 'showPagination', 'selectable', 'currentPage', 'pageSize', 'total'],
    emits: ['refresh', 'export', 'view', 'analyze', 'refresh-stock', 'selection-change', 'size-change', 'current-change']
  }
}))

describe('Stocks 页面组件', () => {
  let stocksStore: ReturnType<typeof useStocksStore>
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    stocksStore = useStocksStore()
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/stocks', component: Stocks },
        { path: '/stocks/:symbol', component: { template: '<div>Stock Detail</div>' } }
      ]
    })

    // Mock store 方法
    vi.spyOn(stocksStore, 'fetchStocks').mockResolvedValue()
    vi.spyOn(stocksStore, 'refreshStockData').mockResolvedValue({ 
      symbol: 'AAPL', 
      updated_records: 10, 
      status: 'completed' 
    })
    vi.spyOn(stocksStore, 'updateFilters').mockImplementation()
    vi.spyOn(stocksStore, 'updatePagination').mockImplementation()
  })

  describe('基础渲染', () => {
    it('应该正确渲染页面', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.stocks').exists()).toBe(true)
      expect(wrapper.find('.page-header').exists()).toBe(true)
      expect(wrapper.find('.search-card').exists()).toBe(true)
      expect(wrapper.find('.filter-card').exists()).toBe(true)
      expect(wrapper.find('.mock-stock-table').exists()).toBe(true)
    })

    it('应该显示页面标题和描述', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.find('h1').text()).toBe('股票监控')
      expect(wrapper.find('.page-header p').text()).toBe('实时监控股票价格和交易信号')
    })

    it('应该渲染搜索组件', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const searchComponent = wrapper.find('.mock-stock-search')
      expect(searchComponent.exists()).toBe(true)
      expect(searchComponent.attributes('placeholder')).toBe('输入股票代码或名称搜索...')
    })

    it('应该渲染筛选表单', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.find('.el-form').exists()).toBe(true)
      expect(wrapper.text()).toContain('行业')
      expect(wrapper.text()).toContain('信号类型')
    })
  })

  describe('数据管理', () => {
    it('应该正确计算表格数据', () => {
      const mockStocks = [createMockStock(), createMockStock({ id: 2, symbol: 'GOOGL' })]
      stocksStore.stocks = mockStocks

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const tableData = wrapper.vm.tableData
      expect(tableData).toHaveLength(2)
      expect(tableData[0].symbol).toBe('AAPL')
      expect(tableData[1].symbol).toBe('GOOGL')
    })

    it('应该处理空股票列表', () => {
      stocksStore.stocks = []

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.vm.tableData).toEqual([])
    })
  })

  describe('搜索功能', () => {
    it('应该处理搜索操作', async () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.handleSearch()

      expect(stocksStore.fetchStocks).toHaveBeenCalledWith({
        skip: 0,
        limit: 20
      })
      expect(wrapper.vm.loading).toBe(false)
    })

    it('应该处理搜索失败', async () => {
      vi.mocked(stocksStore.fetchStocks).mockRejectedValue(new Error('搜索失败'))

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.handleSearch()

      expect(wrapper.vm.loading).toBe(false)
    })

    it('应该重置搜索条件', async () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      // 设置一些筛选条件
      wrapper.vm.filterForm.symbol = 'AAPL'
      wrapper.vm.filterForm.industry = 'tech'
      wrapper.vm.filterForm.signal = 'BUY'

      await wrapper.vm.handleReset()

      expect(wrapper.vm.filterForm.symbol).toBe('')
      expect(wrapper.vm.filterForm.industry).toBe('')
      expect(wrapper.vm.filterForm.signal).toBe('')
      expect(stocksStore.updateFilters).toHaveBeenCalledWith({
        symbol: '',
        market: '',
        industry: '',
        activeOnly: true
      })
      expect(stocksStore.fetchStocks).toHaveBeenCalled()
    })

    it('应该处理股票选择', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const mockStock = createMockStock()
      const consoleSpy = vi.spyOn(console, 'log')

      wrapper.vm.handleStockSelect(mockStock)

      expect(consoleSpy).toHaveBeenCalledWith('选择股票:', mockStock)
    })

    it('应该处理股票搜索', async () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.handleStockSearch('Apple')

      expect(wrapper.vm.filterForm.symbol).toBe('Apple')
      expect(stocksStore.fetchStocks).toHaveBeenCalled()
    })
  })

  describe('表格交互', () => {
    it('应该处理刷新数据', async () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.refreshData()

      expect(stocksStore.fetchStocks).toHaveBeenCalledWith({
        skip: 0,
        limit: 20
      })
      expect(wrapper.vm.loading).toBe(false)
    })

    it('应该处理查看详情', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const mockStock = createMockStockDailyData()
      const consoleSpy = vi.spyOn(console, 'log')

      wrapper.vm.viewDetails(mockStock)

      expect(consoleSpy).toHaveBeenCalledWith('查看股票详情:', mockStock)
    })

    it('应该处理分析股票', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const mockStock = createMockStockDailyData()
      const consoleSpy = vi.spyOn(console, 'log')

      wrapper.vm.analyzeStock(mockStock)

      expect(consoleSpy).toHaveBeenCalledWith('分析股票:', mockStock)
    })

    it('应该处理刷新单个股票', async () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const mockStock = createMockStockDailyData()

      await wrapper.vm.refreshStock(mockStock)

      expect(stocksStore.refreshStockData).toHaveBeenCalledWith('AAPL')
      expect(stocksStore.fetchStocks).toHaveBeenCalled()
    })

    it('应该处理刷新单个股票失败', async () => {
      vi.mocked(stocksStore.refreshStockData).mockRejectedValue(new Error('刷新失败'))

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const mockStock = createMockStockDailyData()
      const consoleSpy = vi.spyOn(console, 'error')

      await wrapper.vm.refreshStock(mockStock)

      expect(consoleSpy).toHaveBeenCalledWith(`刷新股票 ${mockStock.symbol} 失败:`, expect.any(Error))
    })
  })

  describe('分页功能', () => {
    it('应该处理分页大小变化', async () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.handleSizeChange(50)

      expect(wrapper.vm.pagination.size).toBe(50)
      expect(wrapper.vm.pagination.current).toBe(1)
      expect(stocksStore.updatePagination).toHaveBeenCalledWith(1, 50)
      expect(stocksStore.fetchStocks).toHaveBeenCalled()
    })

    it('应该处理当前页变化', async () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.handleCurrentChange(3)

      expect(wrapper.vm.pagination.current).toBe(3)
      expect(stocksStore.updatePagination).toHaveBeenCalledWith(3)
      expect(stocksStore.fetchStocks).toHaveBeenCalled()
    })
  })

  describe('选择功能', () => {
    it('应该处理选择变化', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const selectedStocks = createMockStockDataArray(2)
      wrapper.vm.handleSelectionChange(selectedStocks)

      expect(wrapper.vm.selectedStocks).toEqual(selectedStocks)
    })

    it('应该处理数据导出', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const selectedStocks = createMockStockDataArray(2)
      wrapper.vm.selectedStocks = selectedStocks
      const consoleSpy = vi.spyOn(console, 'log')

      wrapper.vm.handleExport()

      expect(consoleSpy).toHaveBeenCalledWith('导出选中的股票:', selectedStocks)
    })
  })

  describe('生命周期', () => {
    it('应该在挂载时初始化数据', async () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      // 等待 mounted 钩子执行
      await wrapper.vm.$nextTick()

      expect(stocksStore.fetchStocks).toHaveBeenCalledWith({
        skip: 0,
        limit: 20
      })
    })

    it('应该处理初始化数据失败', async () => {
      vi.mocked(stocksStore.fetchStocks).mockRejectedValue(new Error('初始化失败'))

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      // 等待 mounted 钩子执行
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('响应式数据', () => {
    it('应该响应分页状态变化', () => {
      stocksStore.pagination = {
        current: 2,
        size: 50,
        total: 100,
        skip: 50,
        limit: 50
      }

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.vm.pagination.current).toBe(2)
      expect(wrapper.vm.pagination.size).toBe(50)
      expect(wrapper.vm.pagination.total).toBe(100)
    })

    it('应该响应股票列表变化', () => {
      const mockStocks = [createMockStock(), createMockStock({ id: 2, symbol: 'GOOGL' })]
      stocksStore.stocks = mockStocks

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.vm.tableData).toHaveLength(2)
    })
  })

  describe('边界情况', () => {
    it('应该处理空筛选条件', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.vm.filterForm).toEqual({
        symbol: '',
        industry: '',
        signal: ''
      })
    })

    it('应该处理未定义的分页数据', () => {
      stocksStore.pagination.total = 0

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.vm.pagination.total).toBe(0)
    })

    it('应该处理表格数据转换错误', () => {
      // 模拟 store 返回无效数据
      stocksStore.stocks = undefined as any

      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      // 应该能够处理异常情况
      expect(Array.isArray(wrapper.vm.tableData)).toBe(true)
    })
  })

  describe('样式和布局', () => {
    it('应该应用正确的样式类名', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.find('.stocks').classes()).toContain('stocks')
      expect(wrapper.find('.page-header').exists()).toBe(true)
      expect(wrapper.find('.search-card').exists()).toBe(true)
      expect(wrapper.find('.filter-card').exists()).toBe(true)
    })

    it('应该正确设置页面布局', () => {
      const wrapper = mount(Stocks, {
        global: {
          plugins: [router]
        }
      })

      const stocksElement = wrapper.find('.stocks')
      expect(stocksElement.attributes('style')).toBe('padding: 0px;')
    })
  })
})