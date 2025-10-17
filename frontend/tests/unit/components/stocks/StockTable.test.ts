import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StockTable from '@/components/stocks/StockTable.vue'
import type { StockDailyData } from '@/types/api'
import { createMockStockDailyData, createMockStockDataArray } from '../../../utils/test-utils'

describe('StockTable 组件', () => {
  const mockStocks = createMockStockDataArray(5)

  describe('基础渲染', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.stock-table').exists()).toBe(true)
      expect(wrapper.find('.table-toolbar').exists()).toBe(true)
      expect(wrapper.find('.stock-data-table').exists()).toBe(true)
    })

    it('应该显示表格标题和信息', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          title: '测试表格',
          showToolbar: true
        }
      })

      expect(wrapper.find('.table-title').text()).toBe('测试表格')
      expect(wrapper.find('.table-info').text()).toContain('5 只股票')
    })

    it('应该显示加载状态', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: [],
          loading: true
        }
      })

      expect(wrapper.find('.el-table').attributes('v-loading')).toBeDefined()
    })

    it('应该显示空数据提示', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: [],
          emptyText: '暂无数据'
        }
      })

      expect(wrapper.find('.el-table').attributes('empty-text')).toBe('暂无数据')
    })
  })

  describe('表格列显示控制', () => {
    it('应该显示默认列', () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      const columns = wrapper.findAll('.el-table-column')
      expect(columns.length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('股票代码')
      expect(wrapper.text()).toContain('股票名称')
      expect(wrapper.text()).toContain('当前价格')
      expect(wrapper.text()).toContain('涨跌幅')
      expect(wrapper.text()).toContain('成交量')
    })

    it('应该控制成交额列的显示', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showTurnover: false
        }
      })

      expect(wrapper.text()).not.toContain('成交额')
    })

    it('应该控制最高/最低价列的显示', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showHighLow: false
        }
      })

      expect(wrapper.text()).not.toContain('最高')
      expect(wrapper.text()).not.toContain('最低')
    })

    it('应该控制开盘价列的显示', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showOpen: false
        }
      })

      expect(wrapper.text()).not.toContain('开盘')
    })

    it('应该控制交易信号列的显示', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showSignal: false
        }
      })

      expect(wrapper.text()).not.toContain('交易信号')
    })

    it('应该控制置信度列的显示', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showConfidence: false
        }
      })

      expect(wrapper.text()).not.toContain('置信度')
    })

    it('应该控制操作列的显示', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showActions: false
        }
      })

      expect(wrapper.text()).not.toContain('操作')
    })
  })

  describe('分页功能', () => {
    it('应该显示分页组件', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showPagination: true,
          total: 100,
          currentPage: 1,
          pageSize: 20
        }
      })

      expect(wrapper.find('.table-pagination').exists()).toBe(true)
      expect(wrapper.find('.el-pagination').exists()).toBe(true)
    })

    it('应该正确分页显示数据', () => {
      const largeData = createMockStockDataArray(25)
      const wrapper = mount(StockTable, {
        props: {
          stocks: largeData,
          showPagination: true,
          currentPage: 2,
          pageSize: 10,
          total: 25
        }
      })

      // 第二页应该显示第11-20条数据
      const displayedStocks = wrapper.vm.displayStocks
      expect(displayedStocks).toHaveLength(10)
    })

    it('应该处理分页大小变化', async () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showPagination: true,
          total: 100
        }
      })

      await wrapper.vm.handleSizeChange(50)

      expect(wrapper.emitted('size-change')).toBeDefined()
      expect(wrapper.emitted('size-change')?.[0]).toEqual([50])
      expect(wrapper.vm.pageSize).toBe(50)
      expect(wrapper.vm.currentPage).toBe(1)
    })

    it('应该处理当前页变化', async () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showPagination: true,
          total: 100
        }
      })

      await wrapper.vm.handleCurrentChange(3)

      expect(wrapper.emitted('current-change')).toBeDefined()
      expect(wrapper.emitted('current-change')?.[0]).toEqual([3])
      expect(wrapper.vm.currentPage).toBe(3)
    })
  })

  describe('事件处理', () => {
    it('应该触发刷新事件', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      await wrapper.find('.el-button[icon="Refresh"]').trigger('click')

      expect(wrapper.emitted('refresh')).toBeDefined()
    })

    it('应该触发导出事件', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      await wrapper.find('.el-button[icon="Download"]').trigger('click')

      expect(wrapper.emitted('export')).toBeDefined()
    })

    it('应该触发行点击事件', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      // 模拟行点击
      await wrapper.vm.handleRowClick(mockStocks[0])

      expect(wrapper.emitted('row-click')).toBeDefined()
      expect(wrapper.emitted('row-click')?.[0]).toEqual([mockStocks[0]])
    })

    it('应该触发查看详情事件', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      await wrapper.vm.handleView(mockStocks[0])

      expect(wrapper.emitted('view')).toBeDefined()
      expect(wrapper.emitted('view')?.[0]).toEqual([mockStocks[0]])
    })

    it('应该触发分析事件', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      await wrapper.vm.handleAnalyze(mockStocks[0])

      expect(wrapper.emitted('analyze')).toBeDefined()
      expect(wrapper.emitted('analyze')?.[0]).toEqual([mockStocks[0]])
    })

    it('应该触发刷新股票事件', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      await wrapper.vm.handleRefreshStock(mockStocks[0])

      expect(wrapper.emitted('refresh-stock')).toBeDefined()
      expect(wrapper.emitted('refresh-stock')?.[0]).toEqual([mockStocks[0]])
      expect(wrapper.vm.refreshingStocks).toContain(mockStocks[0].symbol)
    })

    it('应该触发选择变化事件', async () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          selectable: true
        }
      })

      const selection = [mockStocks[0], mockStocks[1]]
      await wrapper.vm.handleSelectionChange(selection)

      expect(wrapper.emitted('selection-change')).toBeDefined()
      expect(wrapper.emitted('selection-change')?.[0]).toEqual([selection])
    })

    it('应该触发排序变化事件', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      const sortInfo = { prop: 'close_price', order: 'ascending' }
      await wrapper.vm.handleSortChange(sortInfo)

      expect(wrapper.emitted('sort-change')).toBeDefined()
      expect(wrapper.emitted('sort-change')?.[0]).toEqual([sortInfo])
    })
  })

  describe('工具函数', () => {
    it('应该正确获取价格样式类名', () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      const upRow = createMockStockDailyData({ change_percent: 5 })
      const downRow = createMockStockDailyData({ change_percent: -5 })
      const unchangedRow = createMockStockDailyData({ change_percent: 0 })

      expect(wrapper.vm.getPriceClass(upRow)).toBe('price-up')
      expect(wrapper.vm.getPriceClass(downRow)).toBe('price-down')
      expect(wrapper.vm.getPriceClass(unchangedRow)).toBe('price-unchanged')
    })

    it('应该正确获取股票代码样式类名', () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      const row = createMockStockDailyData({ symbol: 'AAPL' })
      expect(wrapper.vm.getSymbolClass(row)).toBe('symbol-aapl')
    })

    it('应该正确获取行类名', () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      const highIncreaseRow = { row: createMockStockDailyData({ change_percent: 6 }) }
      const highDecreaseRow = { row: createMockStockDailyData({ change_percent: -6 }) }
      const normalRow = { row: createMockStockDailyData({ change_percent: 3 }) }

      expect(wrapper.vm.getRowClassName(highIncreaseRow)).toContain('row-high-increase')
      expect(wrapper.vm.getRowClassName(highDecreaseRow)).toContain('row-high-decrease')
      expect(wrapper.vm.getRowClassName(normalRow)).toBe('')
    })
  })

  describe('列设置功能', () => {
    it('应该显示列设置对话框', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      await wrapper.find('.el-button[icon="Setting"]').trigger('click')

      expect(wrapper.vm.showColumnSettings).toBe(true)
      expect(wrapper.find('.el-dialog').exists()).toBe(true)
    })

    it('应该应用列设置', async () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      wrapper.vm.showColumnSettings = true
      await wrapper.vm.$nextTick()

      wrapper.vm.visibleColumns = ['symbol', 'name', 'price']
      await wrapper.vm.applyColumnSettings()

      expect(wrapper.vm.showColumnSettings).toBe(false)
    })
  })

  describe('暴露的方法', () => {
    it('应该暴露 clearSelection 方法', () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      expect(wrapper.vm.clearSelection).toBeDefined()
      expect(typeof wrapper.vm.clearSelection).toBe('function')
    })

    it('应该暴露 getSelectedRows 方法', () => {
      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      expect(wrapper.vm.getSelectedRows).toBeDefined()
      expect(typeof wrapper.vm.getSelectedRows).toBe('function')
      expect(wrapper.vm.getSelectedRows()).toEqual([])
    })
  })

  describe('响应式数据', () => {
    it('应该响应分页属性变化', async () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showPagination: true,
          currentPage: 1,
          pageSize: 20
        }
      })

      await wrapper.setProps({ currentPage: 2, pageSize: 50 })

      expect(wrapper.vm.currentPage).toBe(2)
      expect(wrapper.vm.pageSize).toBe(50)
    })

    it('应该正确计算显示的数据', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: mockStocks,
          showPagination: false
        }
      })

      expect(wrapper.vm.displayStocks).toEqual(mockStocks)
    })
  })

  describe('边界情况', () => {
    it('应该处理空数据', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: []
        }
      })

      expect(wrapper.vm.displayStocks).toEqual([])
    })

    it('应该处理未定义的数据', () => {
      const wrapper = mount(StockTable, {
        props: {
          stocks: undefined as any
        }
      })

      expect(wrapper.vm.displayStocks).toEqual([])
    })

    it('应该处理刷新状态超时', async () => {
      vi.useFakeTimers()

      const wrapper = mount(StockTable, {
        props: { stocks: mockStocks }
      })

      await wrapper.vm.handleRefreshStock(mockStocks[0])

      expect(wrapper.vm.refreshingStocks).toContain(mockStocks[0].symbol)

      // 快进时间
      vi.advanceTimersByTime(2000)

      expect(wrapper.vm.refreshingStocks).not.toContain(mockStocks[0].symbol)

      vi.useRealTimers()
    })
  })
})