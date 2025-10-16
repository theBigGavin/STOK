-- 股票回测决策系统测试数据种子脚本（修复版）
-- 创建时间: 2025-10-16

-- 插入股票基本信息
INSERT INTO stocks (symbol, name, market, is_active) VALUES
('000001', '平安银行', 'SZ', true),
('000002', '万科A', 'SZ', true),
('000858', '五粮液', 'SZ', true),
('600036', '招商银行', 'SH', true),
('600519', '贵州茅台', 'SH', true),
('601318', '中国平安', 'SH', true),
('000333', '美的集团', 'SZ', true),
('000651', '格力电器', 'SZ', true),
('600276', '恒瑞医药', 'SH', true),
('601888', '中国国旅', 'SH', true),
('TEST001', '测试股票A', 'TEST', true),
('TEST002', '测试股票B', 'TEST', true),
('TEST003', '测试股票C', 'TEST', true)
ON CONFLICT (symbol) DO NOTHING;

-- 插入回测模型数据
INSERT INTO backtest_models (name, description, model_type, parameters, weight, is_active) VALUES
('移动平均线策略', '基于双移动平均线的趋势跟踪策略', 'technical', '{"fast_period": 5, "slow_period": 20, "threshold": 0.02}', 0.30, true),
('RSI策略', '基于相对强弱指数的超买超卖策略', 'technical', '{"period": 14, "overbought": 70, "oversold": 30}', 0.25, true),
('MACD策略', '基于MACD指标的趋势判断策略', 'technical', '{"fast_period": 12, "slow_period": 26, "signal_period": 9}', 0.25, true),
('布林带策略', '基于布林带的价格突破策略', 'technical', '{"period": 20, "std_dev": 2}', 0.20, true),
('随机森林分类器', '基于随机森林的股票涨跌分类模型', 'ml', '{"n_estimators": 100, "max_depth": 10, "random_state": 42}', 0.40, true),
('梯度提升树', '基于XGBoost的回归预测模型', 'ml', '{"n_estimators": 200, "learning_rate": 0.1, "max_depth": 6}', 0.35, true),
('支持向量机', '基于SVM的分类模型', 'ml', '{"kernel": "rbf", "C": 1.0, "gamma": "scale"}', 0.25, true)
ON CONFLICT DO NOTHING;

-- 插入股票日线数据（最近30天的模拟数据）
INSERT INTO stock_daily_data (stock_id, trade_date, open_price, high_price, low_price, close_price, volume, turnover)
SELECT 
    s.id,
    CURRENT_DATE - (n || ' days')::INTERVAL as trade_date,
    CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END as open_price,
    (CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END) + random() * 3 as high_price,
    (CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END) - random() * 3 as low_price,
    ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END) + ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END) + random() * 3) + ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END) - random() * 3)) / 3 + (random() - 0.5) * 2 as close_price,
    floor(random() * 9000000 + 1000000) as volume,
    (((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END) + ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END) + random() * 3) + ((CASE 
        WHEN s.market = 'TEST' THEN 50.0 + (random() - 0.5) * 20.0
        ELSE 10.0 + (random() - 0.5) * 5.0
    END) - random() * 3)) / 3 + (random() - 0.5) * 2) * floor(random() * 9000000 + 1000000) as turnover
FROM 
    stocks s,
    generate_series(0, 365) n
WHERE 
    s.is_active = true
    AND EXTRACT(DOW FROM CURRENT_DATE - (n || ' days')::INTERVAL) BETWEEN 1 AND 5  -- 只插入工作日
ON CONFLICT (stock_id, trade_date) DO NOTHING;

-- 插入模型决策数据（最近7天的模拟数据）
INSERT INTO model_decisions (stock_id, model_id, trade_date, decision, confidence, signal_strength)
SELECT 
    s.id,
    m.id,
    CURRENT_DATE - (n || ' days')::INTERVAL as trade_date,
    (ARRAY['BUY', 'SELL', 'HOLD'])[floor(random() * 3 + 1)],
    (random() * 0.35 + 0.6)::numeric(5,4),
    (random() * 0.4 + 0.5)::numeric(5,4)
FROM 
    stocks s,
    backtest_models m,
    generate_series(0, 6) n
WHERE 
    s.is_active = true
    AND m.is_active = true
    AND EXTRACT(DOW FROM CURRENT_DATE - (n || ' days')::INTERVAL) BETWEEN 1 AND 5
ON CONFLICT (stock_id, model_id, trade_date) DO NOTHING;

-- 插入综合决策数据（最近7天的模拟数据）
WITH vote_data AS (
    SELECT 
        s.id as stock_id,
        CURRENT_DATE - (n || ' days')::INTERVAL as trade_date,
        floor(random() * 4) as buy_votes,
        floor(random() * 4) as sell_votes,
        floor(random() * 4) as hold_votes
    FROM 
        stocks s,
        generate_series(0, 6) n
    WHERE 
        s.is_active = true
        AND EXTRACT(DOW FROM CURRENT_DATE - (n || ' days')::INTERVAL) BETWEEN 1 AND 5
)
INSERT INTO final_decisions (stock_id, trade_date, buy_votes, sell_votes, hold_votes, final_decision, confidence_score)
SELECT 
    stock_id,
    trade_date,
    buy_votes,
    sell_votes,
    hold_votes,
    CASE 
        WHEN buy_votes > sell_votes AND buy_votes > hold_votes THEN 'BUY'
        WHEN sell_votes > buy_votes AND sell_votes > hold_votes THEN 'SELL'
        ELSE 'HOLD'
    END,
    (random() * 0.25 + 0.7)::numeric(5,4)
FROM 
    vote_data
ON CONFLICT (stock_id, trade_date) DO NOTHING;

-- 插入模型性能数据（最近7天的模拟数据）
INSERT INTO model_performance (model_id, backtest_date, accuracy, precision, recall, f1_score, total_return, sharpe_ratio, max_drawdown)
SELECT 
    m.id,
    CURRENT_DATE - (n || ' days')::INTERVAL as backtest_date,
    (random() * 0.3 + 0.55)::numeric(5,4) as accuracy,
    (random() * 0.3 + 0.5)::numeric(5,4) as precision,
    (random() * 0.3 + 0.5)::numeric(5,4) as recall,
    (random() * 0.3 + 0.5)::numeric(5,4) as f1_score,
    (random() * 0.3 - 0.1)::numeric(8,4) as total_return,
    (random() * 3.0 - 1.0)::numeric(8,4) as sharpe_ratio,
    (random() * 0.15 - 0.2)::numeric(8,4) as max_drawdown
FROM 
    backtest_models m,
    generate_series(0, 6) n
WHERE 
    m.is_active = true
    AND EXTRACT(DOW FROM CURRENT_DATE - (n || ' days')::INTERVAL) BETWEEN 1 AND 5
ON CONFLICT (model_id, backtest_date) DO NOTHING;

-- 输出种子数据统计
SELECT '股票数据: ' || COUNT(*) || ' 条记录' FROM stocks;
SELECT '回测模型: ' || COUNT(*) || ' 个模型' FROM backtest_models;
SELECT '日线数据: ' || COUNT(*) || ' 条记录' FROM stock_daily_data;
SELECT '模型决策: ' || COUNT(*) || ' 条记录' FROM model_decisions;
SELECT '综合决策: ' || COUNT(*) || ' 条记录' FROM final_decisions;
SELECT '性能数据: ' || COUNT(*) || ' 条记录' FROM model_performance;