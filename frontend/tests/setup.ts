import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// 全局测试配置
// 模拟 Element Plus 组件
const mockElementPlusComponents = {
  ElButton: {
    template: '<button><slot /></button>',
    props: ['type', 'size', 'loading', 'icon']
  },
  ElCard: {
    template: '<div class="el-card"><slot name="header" /><slot /></div>'
  },
  ElTable: {
    template: '<table><slot /></table>',
    props: ['data', 'loading', 'empty-text', 'row-class-name', 'stripe', 'border', 'height', 'max-height']
  },
  ElTableColumn: {
    template: '<td><slot /></td>',
    props: ['prop', 'label', 'width', 'sortable', 'fixed', 'align']
  },
  ElTag: {
    template: '<span class="el-tag"><slot /></span>',
    props: ['type', 'size', 'effect']
  },
  ElProgress: {
    template: '<div class="el-progress"><slot /></div>',
    props: ['percentage', 'show-text', 'stroke-width', 'status']
  },
  ElPagination: {
    template: '<div class="el-pagination"><slot /></div>',
    props: ['current-page', 'page-size', 'total', 'page-sizes', 'layout']
  },
  ElDialog: {
    template: '<div class="el-dialog"><slot name="footer" /><slot /></div>',
    props: ['model-value', 'title', 'width']
  },
  ElForm: {
    template: '<form><slot /></form>',
    props: ['model', 'inline']
  },
  ElFormItem: {
    template: '<div class="el-form-item"><slot /></div>',
    props: ['label']
  },
  ElSelect: {
    template: '<select><slot /></select>',
    props: ['model-value', 'placeholder', 'clearable']
  },
  ElOption: {
    template: '<option><slot /></option>',
    props: ['label', 'value']
  },
  ElCheckboxGroup: {
    template: '<div class="el-checkbox-group"><slot /></div>',
    props: ['model-value']
  },
  ElCheckbox: {
    template: '<label class="el-checkbox"><input type="checkbox" /><slot /></label>',
    props: ['label']
  }
}

// 配置 Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key
}

config.global.stubs = {
  ...mockElementPlusComponents,
  RouterLink: {
    template: '<a><slot /></a>'
  }
}

// 模拟 localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// 模拟 console 方法
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
}

// 模拟 IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// 模拟 ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// 测试环境变量
process.env.VITE_API_BASE_URL = 'http://localhost:8099'
process.env.VITE_APP_TITLE = 'STOK Test'