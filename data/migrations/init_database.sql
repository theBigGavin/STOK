-- 股票回测决策系统数据库初始化脚本
-- 创建时间: 2025-10-16

-- 创建股票基本信息表
CREATE TABLE IF NOT EXISTS stocks (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    market VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建股票日线数据表
CREATE TABLE IF NOT EXISTS stock_daily_data (
    id BIGSERIAL PRIMARY KEY,
    stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    open_price NUMERIC(10,4),
    high_price NUMERIC(10,4),
    low_price NUMERIC(10,4),
    close_price NUMERIC(10,4),
    volume BIGINT,
    turnover NUMERIC(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, trade_date)
);

-- 创建回测模型表
CREATE TABLE IF NOT EXISTS backtest_models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    model_type VARCHAR(50),
    parameters JSONB,
    weight NUMERIC(3,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建模型决策记录表
CREATE TABLE IF NOT EXISTS model_decisions (
    id BIGSERIAL PRIMARY KEY,
    stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    model_id BIGINT NOT NULL REFERENCES backtest_models(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    decision VARCHAR(10) NOT NULL CHECK (decision IN ('BUY', 'SELL', 'HOLD')),
    confidence NUMERIC(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    signal_strength NUMERIC(5,4) CHECK (signal_strength >= 0 AND signal_strength <= 1),
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, model_id, trade_date)
);

-- 创建综合决策表
CREATE TABLE IF NOT EXISTS final_decisions (
    id BIGSERIAL PRIMARY KEY,
    stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    buy_votes INTEGER,
    sell_votes INTEGER,
    hold_votes INTEGER,
    final_decision VARCHAR(10) CHECK (final_decision IN ('BUY', 'SELL', 'HOLD')),
    confidence_score NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    risk_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, trade_date)
);

-- 创建模型性能表
CREATE TABLE IF NOT EXISTS model_performance (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL REFERENCES backtest_models(id) ON DELETE CASCADE,
    backtest_date DATE NOT NULL,
    accuracy NUMERIC(5,4),
    precision NUMERIC(5,4),
    recall NUMERIC(5,4),
    f1_score NUMERIC(5,4),
    total_return NUMERIC(8,4),
    sharpe_ratio NUMERIC(8,4),
    max_drawdown NUMERIC(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, backtest_date)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_market ON stocks(market);
CREATE INDEX IF NOT EXISTS idx_stocks_active ON stocks(is_active);

CREATE INDEX IF NOT EXISTS idx_daily_data_stock_date ON stock_daily_data(stock_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_daily_data_date ON stock_daily_data(trade_date);
CREATE INDEX IF NOT EXISTS idx_daily_data_stock ON stock_daily_data(stock_id);

CREATE INDEX IF NOT EXISTS idx_models_type ON backtest_models(model_type);
CREATE INDEX IF NOT EXISTS idx_models_active ON backtest_models(is_active);
CREATE INDEX IF NOT EXISTS idx_models_parameters ON backtest_models USING GIN(parameters);

CREATE INDEX IF NOT EXISTS idx_model_decisions_stock_date ON model_decisions(stock_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_model_decisions_model_date ON model_decisions(model_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_model_decisions_decision ON model_decisions(decision);

CREATE INDEX IF NOT EXISTS idx_final_decisions_stock_date ON final_decisions(stock_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_final_decisions_date ON final_decisions(trade_date);
CREATE INDEX IF NOT EXISTS idx_final_decisions_decision ON final_decisions(final_decision);

CREATE INDEX IF NOT EXISTS idx_performance_model_date ON model_performance(model_id, backtest_date);
CREATE INDEX IF NOT EXISTS idx_performance_date ON model_performance(backtest_date);

-- 输出创建结果
SELECT '数据库表结构创建完成' as message;