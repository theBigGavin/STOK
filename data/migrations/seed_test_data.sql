-- 股票 AI 策略回测决策系统测试数据种子脚本（修正版）
-- 根据新的数据库结构更新
-- 创建时间: 2025-10-18

-- 插入股票基本信息
INSERT INTO stocks (symbol, name, industry, market, current_price, price_change, price_change_percent, volume, market_cap, pe_ratio, pb_ratio, dividend_yield) VALUES
('000001', '平安银行', '银行', 'SZ', 15.23, 0.25, 1.67, 15678900, 295000000000.00, 8.50, 0.85, 3.20),
('000002', '万科A', '房地产', 'SZ', 18.45, -0.15, -0.81, 23456700, 214000000000.00, 6.80, 0.92, 4.50),
('000858', '五粮液', '食品饮料', 'SZ', 168.50, 2.30, 1.38, 9876500, 654000000000.00, 32.50, 8.20, 1.20),
('600036', '招商银行', '银行', 'SH', 35.67, 0.42, 1.19, 34567800, 896000000000.00, 9.20, 1.25, 3.80),
('600519', '贵州茅台', '食品饮料', 'SH', 1750.00, 25.00, 1.45, 4567800, 2198000000000.00, 45.60, 12.30, 1.50),
('601318', '中国平安', '保险', 'SH', 48.90, -0.35, -0.71, 56789000, 892000000000.00, 12.30, 1.45, 2.80),
('000333', '美的集团', '家电', 'SZ', 56.78, 0.68, 1.21, 23456000, 402000000000.00, 18.90, 3.20, 2.50),
('000651', '格力电器', '家电', 'SZ', 38.90, -0.25, -0.64, 19876000, 234000000000.00, 15.60, 2.80, 5.20),
('600276', '恒瑞医药', '医药', 'SH', 42.35, 0.85, 2.05, 16789000, 267000000000.00, 65.80, 8.90, 0.80),
('601888', '中国中免', '旅游零售', 'SH', 95.60, 1.20, 1.27, 12345000, 186000000000.00, 28.40, 4.50, 1.10),
('TEST001', '测试股票A', '测试', 'TEST', 50.00, 0.50, 1.00, 1000000, 50000000.00, 15.00, 2.00, 2.00),
('TEST002', '测试股票B', '测试', 'TEST', 75.00, -0.75, -1.00, 1500000, 75000000.00, 20.00, 2.50, 1.50),
('TEST003', '测试股票C', '测试', 'TEST', 25.00, 0.25, 1.00, 500000, 25000000.00, 10.00, 1.50, 3.00)
ON CONFLICT (symbol) DO NOTHING;

-- 插入 AI 模型数据
INSERT INTO ai_models (name, model_type, description, weight, is_active, performance_score, last_trained_at) VALUES
('移动平均线策略', 'technical', '基于双移动平均线的趋势跟踪策略', 0.30, true, 0.75, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('RSI策略', 'technical', '基于相对强弱指数的超买超卖策略', 0.25, true, 0.68, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('MACD策略', 'technical', '基于MACD指标的趋势判断策略', 0.25, true, 0.72, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('布林带策略', 'technical', '基于布林带的价格突破策略', 0.20, true, 0.65, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('随机森林分类器', 'ml', '基于随机森林的股票涨跌分类模型', 0.40, true, 0.82, CURRENT_TIMESTAMP - INTERVAL '14 days'),
('梯度提升树', 'ml', '基于XGBoost的回归预测模型', 0.35, true, 0.78, CURRENT_TIMESTAMP - INTERVAL '14 days'),
('支持向量机', 'ml', '基于SVM的分类模型', 0.25, true, 0.70, CURRENT_TIMESTAMP - INTERVAL '14 days')
ON CONFLICT DO NOTHING;

-- 插入股票价格数据（最近365天的模拟数据）
INSERT INTO stock_prices (stock_id, date, open_price, high_price, low_price, close_price, volume, adjusted_close)
SELECT 
    s.id,
    CURRENT_DATE - (n || ' days')::INTERVAL as date,
    CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END as open_price,
    (CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END) * (1 + random() * 0.05) as high_price,
    (CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END) * (1 - random() * 0.05) as low_price,
    ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END) + ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END) * (1 + random() * 0.05)) + ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END) * (1 - random() * 0.05))) / 3 as close_price,
    floor(random() * 9000000 + 1000000) as volume,
    ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END) + ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END) * (1 + random() * 0.05)) + ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE s.current_price * (0.95 + random() * 0.1)
    END) * (1 - random() * 0.05))) / 3 as adjusted_close
FROM 
    stocks s,
    generate_series(0, 365) n
WHERE 
    EXTRACT(DOW FROM CURRENT_DATE - (n || ' days')::INTERVAL) BETWEEN 1 AND 5  -- 只插入工作日
ON CONFLICT (stock_id, date) DO NOTHING;

-- 插入决策数据（最近30天的模拟数据）
INSERT INTO decisions (stock_id, decision_type, confidence, target_price, stop_loss_price, time_horizon, reasoning, generated_at, expires_at)
SELECT 
    s.id,
    (ARRAY['buy', 'sell', 'hold'])[floor(random() * 3 + 1)],
    (random() * 0.35 + 0.6)::numeric(5,4),
    CASE 
        WHEN s.market = 'TEST' THEN 50.0 * (0.9 + random() * 0.2)
        ELSE s.current_price * (0.9 + random() * 0.2)
    END,
    CASE 
        WHEN s.market = 'TEST' THEN 50.0 * (0.8 + random() * 0.1)
        ELSE s.current_price * (0.8 + random() * 0.1)
    END,
    floor(random() * 30 + 5),
    '基于技术分析和基本面分析的综合判断',
    CURRENT_DATE - (n || ' days')::INTERVAL,
    CURRENT_DATE - (n || ' days')::INTERVAL + INTERVAL '30 days'
FROM 
    stocks s,
    generate_series(0, 29) n
WHERE 
    EXTRACT(DOW FROM CURRENT_DATE - (n || ' days')::INTERVAL) BETWEEN 1 AND 5
ON CONFLICT DO NOTHING;

-- 插入投票结果数据
INSERT INTO vote_results (decision_id, model_id, vote_type, confidence, signal_strength, reasoning)
SELECT 
    d.id,
    m.id,
    (ARRAY['buy', 'sell', 'hold'])[floor(random() * 3 + 1)],
    (random() * 0.35 + 0.6)::numeric(5,4),
    (random() * 0.4 + 0.5)::numeric(5,4),
    '模型基于历史数据和特征工程生成信号'
FROM 
    decisions d,
    ai_models m
WHERE 
    d.generated_at >= CURRENT_DATE - INTERVAL '7 days'
    AND m.is_active = true
ON CONFLICT (decision_id, model_id) DO NOTHING;

-- 插入回测结果数据
INSERT INTO backtest_results (stock_id, model_id, start_date, end_date, total_return, annual_return, sharpe_ratio, max_drawdown, win_rate, profit_factor, total_trades, avg_trade_return)
SELECT 
    s.id,
    m.id,
    CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE,
    (random() * 0.5 - 0.1)::numeric(8,4),
    (random() * 0.4 - 0.05)::numeric(8,4),
    (random() * 3.0 - 0.5)::numeric(8,4),
    (random() * 0.25 - 0.15)::numeric(8,4),
    (random() * 0.4 + 0.5)::numeric(5,4),
    (random() * 2.0 + 0.5)::numeric(8,4),
    floor(random() * 100 + 20),
    (random() * 0.1 - 0.02)::numeric(8,4)
FROM 
    stocks s,
    ai_models m
WHERE 
    s.market != 'TEST'
    AND m.is_active = true
ON CONFLICT (stock_id, model_id, start_date, end_date) DO NOTHING;

-- 插入交易记录数据
INSERT INTO trade_records (stock_id, decision_id, trade_type, entry_price, exit_price, quantity, entry_date, exit_date, holding_period, return_amount, return_percent)
SELECT 
    d.stock_id,
    d.id,
    CASE WHEN d.decision_type = 'buy' THEN 'buy' ELSE 'sell' END,
    CASE 
        WHEN s.market = 'TEST' THEN 50.0 * (0.9 + random() * 0.2)
        ELSE s.current_price * (0.9 + random() * 0.2)
    END,
    CASE 
        WHEN s.market = 'TEST' THEN 50.0 * (0.95 + random() * 0.3)
        ELSE s.current_price * (0.95 + random() * 0.3)
    END,
    floor(random() * 900 + 100),
    d.generated_at,
    d.generated_at + INTERVAL '1 day' * floor(random() * 30 + 1),
    floor(random() * 30 + 1),
    (CASE 
        WHEN s.market = 'TEST' THEN 50.0 * (0.95 + random() * 0.3) - 50.0 * (0.9 + random() * 0.2)
        ELSE s.current_price * (0.95 + random() * 0.3) - s.current_price * (0.9 + random() * 0.2)
    END) * floor(random() * 900 + 100),
    (random() * 0.3 - 0.05)::numeric(8,4)
FROM 
    decisions d
    JOIN stocks s ON d.stock_id = s.id
WHERE 
    d.generated_at >= CURRENT_DATE - INTERVAL '7 days'
    AND random() < 0.3  -- 只插入部分决策的交易记录
ON CONFLICT DO NOTHING;

-- 输出种子数据统计
SELECT '股票数据: ' || COUNT(*) || ' 条记录' FROM stocks;
SELECT 'AI 模型: ' || COUNT(*) || ' 个模型' FROM ai_models;
SELECT '股票价格数据: ' || COUNT(*) || ' 条记录' FROM stock_prices;
SELECT '决策数据: ' || COUNT(*) || ' 条记录' FROM decisions;
SELECT '投票结果: ' || COUNT(*) || ' 条记录' FROM vote_results;
SELECT '回测结果: ' || COUNT(*) || ' 条记录' FROM backtest_results;
SELECT '交易记录: ' || COUNT(*) || ' 条记录' FROM trade_records;