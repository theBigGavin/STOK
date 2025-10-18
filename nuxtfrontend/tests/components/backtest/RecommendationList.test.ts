/**
 * 推荐列表组件测试
 * 测试推荐显示组件的功能和交互
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { useDecisionsStore } from '~/stores/decisions';
import RecommendationList from '~/components/backtest/RecommendationList.vue';

// 模拟数据
const mockRecommendations = [
  {
    id: '1',
    stock: {
      id: 'stock-1',
      symbol: '000001',
      name: '平安银行',
      market: 'A股',
      industry: '银行',
      currentPrice: 15.2,
      priceChange: 0.25,
      priceChangePercent: 1.67,
      volume: 50000000,
      marketCap: 300000000000,
      peRatio: 8.5,
      pbRatio: 0.9,
      dividendYield: 3.2,
    },
    decision_type: 'buy',
    confidence: 0.85,
    target_price: 16.5,
    stop_loss_price: 14.0,
    time_horizon: 30,
    reasoning: '技术面和基本面共振，多模型一致看好',
  },
  {
    id: '2',
    stock: {
      id: 'stock-2',
      symbol: '000002',
      name: '万科A',
      market: 'A股',
      industry: '房地产',
      currentPrice: 18.5,
      priceChange: -0.15,
      priceChangePercent: -0.8,
      volume: 30000000,
      marketCap: 200000000000,
      peRatio: 6.8,
      pbRatio: 0.7,
      dividendYield: 4.1,
    },
    decision_type: 'hold',
    confidence: 0.65,
    target_price: 19.0,
    stop_loss_price: 17.0,
    time_horizon: 45,
    reasoning: '基本面稳健但技术面偏弱，建议观望',
  },
  {
    id: '3',
    stock: {
      id: 'stock-3',
      symbol: '000858',
      name: '五粮液',
      market: 'A股',
      industry: '白酒',
      currentPrice: 145.8,
      priceChange: -2.5,
      priceChangePercent: -1.68,
      volume: 15000000,
      marketCap: 560000000000,
      peRatio: 25.3,
      pbRatio: 4.2,
      dividendYield: 1.8,
    },
    decision_type: 'sell',
    confidence: 0.72,
    target_price: 135.0,
    stop_loss_price: 155.0,
    time_horizon: 20,
    reasoning: '估值偏高，技术面出现卖出信号',
  },
];

describe('RecommendationList', () => {
  let wrapper: any;
  let decisionsStore: any;

  beforeEach(() => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });

    decisionsStore = useDecisionsStore(pinia);
    decisionsStore.recommendations = mockRecommendations;
    decisionsStore.loading = false;

    wrapper = mount(RecommendationList, {
      global: {
        plugins: [pinia],
        stubs: {
          UCard: true,
          UButton: true,
          UBadge: true,
          UTable: true,
          UTableRow: true,
          UTableCell: true,
          UProgress: true,
          UIcon: true,
        },
      },
    });
  });

  it('应该正确渲染组件', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-testid="recommendation-list"]').exists()).toBe(true);
  });

  it('应该显示推荐列表', () => {
    const recommendationItems = wrapper.findAll('[data-testid="recommendation-item"]');
    expect(recommendationItems.length).toBe(mockRecommendations.length);
  });

  it('应该正确显示股票信息', () => {
    const firstItem = wrapper.find('[data-testid="recommendation-item"]');
    expect(firstItem.text()).toContain('000001');
    expect(firstItem.text()).toContain('平安银行');
    expect(firstItem.text()).toContain('银行');
  });

  it('应该正确显示决策类型和置信度', () => {
    const firstItem = wrapper.find('[data-testid="recommendation-item"]');

    // 检查决策类型
    expect(firstItem.text()).toContain('买入');

    // 检查置信度
    expect(firstItem.text()).toContain('85%');
  });

  it('应该根据决策类型显示正确的颜色', () => {
    const badges = wrapper.findAll('[data-testid="decision-badge"]');

    // 买入 - 绿色
    expect(badges[0].attributes('color')).toBe('green');

    // 持有 - 黄色
    expect(badges[1].attributes('color')).toBe('yellow');

    // 卖出 - 红色
    expect(badges[2].attributes('color')).toBe('red');
  });

  it('应该显示价格信息', () => {
    const firstItem = wrapper.find('[data-testid="recommendation-item"]');
    expect(firstItem.text()).toContain('15.20');
    expect(firstItem.text()).toContain('+1.67%');
  });

  it('应该显示目标价格和止损价格', () => {
    const firstItem = wrapper.find('[data-testid="recommendation-item"]');
    expect(firstItem.text()).toContain('16.50');
    expect(firstItem.text()).toContain('14.00');
  });

  it('应该显示时间周期', () => {
    const firstItem = wrapper.find('[data-testid="recommendation-item"]');
    expect(firstItem.text()).toContain('30天');
  });

  it('应该显示决策理由', () => {
    const firstItem = wrapper.find('[data-testid="recommendation-item"]');
    expect(firstItem.text()).toContain('技术面和基本面共振，多模型一致看好');
  });

  it('应该处理加载状态', async () => {
    decisionsStore.loading = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="loading-indicator"]').exists()).toBe(true);
  });

  it('应该处理空推荐列表', async () => {
    decisionsStore.recommendations = [];
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('暂无推荐');
  });

  it('应该支持股票选择功能', async () => {
    const firstItem = wrapper.find('[data-testid="recommendation-item"]');
    await firstItem.trigger('click');

    // 验证是否触发了选择事件
    expect(wrapper.emitted('select')).toBeTruthy();
    if (wrapper.emitted('select')) {
      expect(wrapper.emitted('select')[0]).toEqual([mockRecommendations[0]]);
    }
  });

  it('应该支持刷新功能', async () => {
    const refreshButton = wrapper.find('[data-testid="refresh-button"]');
    await refreshButton.trigger('click');

    // 验证是否调用了刷新方法
    expect(decisionsStore.fetchRecommendations).toHaveBeenCalled();
  });

  it('应该支持筛选功能', async () => {
    const filterInput = wrapper.find('[data-testid="filter-input"]');
    await filterInput.setValue('平安');

    // 验证筛选逻辑
    const visibleItems = wrapper.findAll('[data-testid="recommendation-item"]');
    expect(visibleItems.length).toBe(1);
    expect(visibleItems[0].text()).toContain('平安银行');
  });

  it('应该支持排序功能', async () => {
    const sortSelect = wrapper.find('[data-testid="sort-select"]');
    await sortSelect.setValue('confidence');

    // 验证排序逻辑
    const confidenceValues = wrapper.findAll('[data-testid="confidence-value"]');
    const confidences = confidenceValues.map((el: any) => parseFloat(el.text().replace('%', '')));

    // 检查是否按置信度降序排列
    for (let i = 0; i < confidences.length - 1; i++) {
      expect(confidences[i]).toBeGreaterThanOrEqual(confidences[i + 1]);
    }
  });

  it('应该正确格式化数字', () => {
    const numberFormatter = wrapper.vm.formatNumber;

    expect(numberFormatter(15000000)).toBe('1,500万');
    expect(numberFormatter(300000000000)).toBe('3,000亿');
    expect(numberFormatter(15.2)).toBe('15.20');
  });

  it('应该正确计算涨跌颜色', () => {
    const getChangeColor = wrapper.vm.getChangeColor;

    expect(getChangeColor(1.67)).toBe('text-green-500');
    expect(getChangeColor(-1.68)).toBe('text-red-500');
    expect(getChangeColor(0)).toBe('text-gray-500');
  });

  it('应该处理错误状态', async () => {
    decisionsStore.error = '获取推荐失败';
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('获取推荐失败');
  });

  it('应该支持分页功能', () => {
    const pagination = wrapper.find('[data-testid="pagination"]');
    expect(pagination.exists()).toBe(true);

    // 测试分页按钮
    const pageButtons = pagination.findAll('button');
    expect(pageButtons.length).toBeGreaterThan(0);
  });

  it('应该响应式显示不同数量的推荐', async () => {
    // 测试不同屏幕尺寸下的显示
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768, // 平板宽度
    });

    window.dispatchEvent(new Event('resize'));
    await wrapper.vm.$nextTick();

    // 验证响应式行为
    expect(wrapper.vm.itemsPerPage).toBe(8); // 平板应该显示更多项目
  });

  it('应该支持导出功能', async () => {
    const exportButton = wrapper.find('[data-testid="export-button"]');
    await exportButton.trigger('click');

    // 验证导出逻辑
    expect(wrapper.vm.exportRecommendations).toHaveBeenCalled();
  });

  it('应该正确计算风险等级', () => {
    const getRiskLevel = wrapper.vm.getRiskLevel;

    expect(getRiskLevel(0.9)).toBe('high');
    expect(getRiskLevel(0.7)).toBe('medium');
    expect(getRiskLevel(0.5)).toBe('low');
  });
});

// 测试工具函数
describe('RecommendationList 工具函数', () => {
  it('应该正确格式化决策类型', () => {
    const formatDecisionType = (type: string) => {
      const map: Record<string, string> = {
        buy: '买入',
        sell: '卖出',
        hold: '持有',
      };
      return map[type] || type;
    };

    expect(formatDecisionType('buy')).toBe('买入');
    expect(formatDecisionType('sell')).toBe('卖出');
    expect(formatDecisionType('hold')).toBe('持有');
    expect(formatDecisionType('unknown')).toBe('unknown');
  });

  it('应该正确计算加权置信度', () => {
    const calculateWeightedConfidence = (votes: Array<{ confidence: number; weight: number }>) => {
      let totalWeight = 0;
      let weightedSum = 0;

      for (const vote of votes) {
        weightedSum += vote.confidence * vote.weight;
        totalWeight += vote.weight;
      }

      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    };

    const votes = [
      { confidence: 0.8, weight: 0.6 },
      { confidence: 0.9, weight: 0.4 },
    ];

    const result = calculateWeightedConfidence(votes);
    expect(result).toBeCloseTo(0.84); // (0.8*0.6 + 0.9*0.4) / 1.0
  });
});
