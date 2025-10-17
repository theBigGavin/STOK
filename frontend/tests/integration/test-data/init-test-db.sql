-- 集成测试数据库初始化脚本
-- 创建测试专用的数据库结构和测试数据

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建测试专用的表结构（与生产环境相同）
-- 注意：这里应该与后端数据库迁移保持一致

-- 创建股票表
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    market VARCHAR(50),
    industry VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建股票日线数据表
CREATE TABLE IF NOT EXISTS stock_daily_data (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    open_price DECIMAL(10, 4),
    high_price DECIMAL(10, 4),
    low_price DECIMAL(10, 4),
    close_price DECIMAL(10, 4),
    volume BIGINT,
    turnover DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, trade_date)
);

-- 创建回测模型表
CREATE TABLE IF NOT EXISTS backtest_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    model_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建模型性能表
CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES backtest_models(id) ON DELETE CASCADE,
    backtest_date DATE NOT NULL,
    accuracy DECIMAL(5, 4),
    precision DECIMAL(5, 4),
    recall DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    total_return DECIMAL(8, 6),
    sharpe_ratio DECIMAL(8, 6),
    max_drawdown DECIMAL(8, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, backtest_date)
);

-- 创建最终决策表
CREATE TABLE IF NOT EXISTS final_decisions (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    buy_votes INTEGER DEFAULT 0,
    sell_votes INTEGER DEFAULT 0,
    hold_votes INTEGER DEFAULT 0,
    final_decision VARCHAR(10),
    confidence_score DECIMAL(5, 4),
    risk_level VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, trade_date)
);

-- 创建模型决策表
CREATE TABLE IF NOT EXISTS model_decisions (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    model_id INTEGER REFERENCES backtest_models(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    decision VARCHAR(10),
    confidence DECIMAL(5, 4),
    signal_strength DECIMAL(5, 4),
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, model_id, trade_date)
);

-- 插入测试数据

-- 插入测试股票
INSERT INTO stocks (symbol, name, market, industry, is_active) VALUES
('TEST001', '测试股票001', 'NASDAQ', 'Technology', true),
('TEST002', '测试股票002', 'NYSE', 'Finance', true),
('TEST003', '测试股票003', 'NASDAQ', 'Healthcare', true),
('AAPL', 'Apple Inc.', 'NASDAQ', 'Technology', true),
('GOOGL', 'Alphabet Inc.', 'NASDAQ', 'Technology', true),
('MSFT', 'Microsoft Corporation', 'NASDAQ', 'Technology', true)
ON CONFLICT (symbol) DO NOTHING;

-- 插入测试模型
INSERT INTO backtest_models (name, description, model_type, parameters, is_active) VALUES
('移动平均交叉模型', '基于移动平均线交叉信号的交易模型', 'technical', '{"short_window": 5, "long_window": 20}', true),
('RSI模型', '基于相对强弱指数的交易模型', 'technical', '{"period": 14, "overbought": 70, "oversold": 30}', true),
('MACD模型', '基于MACD指标的交易模型', 'technical', '{"fast_period": 12, "slow_period": 26, "signal_period": 9}', true),
('基本面分析模型', '基于财务指标的基本面分析模型', 'fundamental', '{"metrics": ["pe_ratio", "pb_ratio", "roe"]}', true),
('机器学习模型', '基于随机森林的机器学习模型', 'ml', '{"n_estimators": 100, "max_depth": 10}', true)
ON CONFLICT DO NOTHING;

-- 为测试股票生成历史数据
DO $$
DECLARE
    stock_record RECORD;
    current_date DATE := '2023-01-01';
    end_date DATE := '2023-03-31';
    base_price DECIMAL(10, 4);
    daily_data_count INTEGER;
BEGIN
    FOR stock_record IN SELECT id FROM stocks WHERE symbol LIKE 'TEST%' OR symbol IN ('AAPL', 'GOOGL', 'MSFT') LOOP
        base_price := 100.0 + (random() * 50); -- 基础价格在100-150之间
        
        WHILE current_date <= end_date LOOP
            -- 跳过周末
            IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
                INSERT INTO stock_daily_data (
                    stock_id, trade_date, open_price, high_price, low_price, close_price, volume, turnover
                ) VALUES (
                    stock_record.id,
                    current_date,
                    base_price + (random() * 10 - 5), -- 开盘价
                    base_price + (random() * 15 - 2), -- 最高价
                    base_price + (random() * 15 - 10), -- 最低价
                    base_price + (random() * 10 - 5), -- 收盘价
                    1000000 + (random() * 4000000)::BIGINT, -- 成交量
                    (base_price * (1000000 + (random() * 4000000)::BIGINT)) -- 成交额
                ) ON CONFLICT (stock_id, trade_date) DO NOTHING;
                
                -- 更新基础价格用于下一天
                base_price := base_price + (random() * 4 - 2);
            END IF;
            
            current_date := current_date + INTERVAL '1 day';
        END LOOP;
        
        current_date := '2023-01-01'; -- 重置日期用于下一只股票
    END LOOP;
END $$;

-- 插入测试性能数据
INSERT INTO model_performance (model_id, backtest_date, accuracy, precision, recall, f1_score, total_return, sharpe_ratio, max_drawdown) VALUES
(1, '2023-03-31', 0.65, 0.68, 0.62, 0.65, 0.156, 0.956, -0.124),
(2, '2023-03-31', 0.72, 0.75, 0.69, 0.72, 0.234, 1.234, -0.089),
(3, '2023-03-31', 0.58, 0.61, 0.55, 0.58, 0.098, 0.756, -0.156),
(4, '2023-03-31', 0.69, 0.71, 0.67, 0.69, 0.187, 1.087, -0.102),
(5, '2023-03-31', 0.76, 0.78, 0.74, 0.76, 0.267, 1.456, -0.067)
ON CONFLICT DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_active ON stocks(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_daily_data_stock_id ON stock_daily_data(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_daily_data_trade_date ON stock_daily_data(trade_date);
CREATE INDEX IF NOT EXISTS idx_backtest_models_active ON backtest_models(is_active);
CREATE INDEX IF NOT EXISTS idx_model_performance_model_id ON model_performance(model_id);
CREATE INDEX IF NOT EXISTS idx_final_decisions_stock_date ON final_decisions(stock_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_model_decisions_stock_model_date ON model_decisions(stock_id, model_id, trade_date);

-- 更新统计信息
ANALYZE;

-- 输出初始化完成信息
\echo '集成测试数据库初始化完成'
\echo '测试股票: TEST001, TEST002, TEST003, AAPL, GOOGL, MSFT'
\echo '测试模型: 移动平均交叉模型, RSI模型, MACD模型, 基本面分析模型, 机器学习模型'
\echo '测试数据范围: 2023-01-01 到 2023-03-31'