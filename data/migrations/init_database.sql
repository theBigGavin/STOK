-- 股票 AI 策略回测决策系统数据库初始化脚本
-- 创建时间: 2025-10-18
-- 根据数据模型文档更新

-- 创建股票实体表
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    industry VARCHAR(50),
    market VARCHAR(10) NOT NULL,
    current_price NUMERIC(10,4),
    price_change NUMERIC(10,4),
    price_change_percent NUMERIC(8,4),
    volume BIGINT,
    market_cap NUMERIC(15,2),
    pe_ratio NUMERIC(8,4),
    pb_ratio NUMERIC(8,4),
    dividend_yield NUMERIC(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建股票价格实体表
CREATE TABLE IF NOT EXISTS stock_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open_price NUMERIC(10,4),
    high_price NUMERIC(10,4),
    low_price NUMERIC(10,4),
    close_price NUMERIC(10,4),
    volume BIGINT,
    adjusted_close NUMERIC(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, date)
);

-- 创建 AI 模型实体表
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    description TEXT,
    weight NUMERIC(3,2) CHECK (weight >= 0 AND weight <= 1),
    is_active BOOLEAN DEFAULT TRUE,
    performance_score NUMERIC(5,4) CHECK (performance_score >= 0 AND performance_score <= 1),
    last_trained_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建决策实体表
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    decision_type VARCHAR(10) NOT NULL CHECK (decision_type IN ('buy', 'sell', 'hold')),
    confidence NUMERIC(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    target_price NUMERIC(10,4),
    stop_loss_price NUMERIC(10,4),
    time_horizon INTEGER,
    reasoning TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建投票结果实体表
CREATE TABLE IF NOT EXISTS vote_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('buy', 'sell', 'hold')),
    confidence NUMERIC(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    signal_strength NUMERIC(5,4) CHECK (signal_strength >= -1 AND signal_strength <= 1),
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(decision_id, model_id)
);

-- 创建回测结果实体表
CREATE TABLE IF NOT EXISTS backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_return NUMERIC(8,4),
    annual_return NUMERIC(8,4),
    sharpe_ratio NUMERIC(8,4),
    max_drawdown NUMERIC(8,4),
    win_rate NUMERIC(5,4),
    profit_factor NUMERIC(8,4),
    total_trades INTEGER,
    avg_trade_return NUMERIC(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, model_id, start_date, end_date)
);

-- 创建交易记录实体表
CREATE TABLE IF NOT EXISTS trade_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    entry_price NUMERIC(10,4),
    exit_price NUMERIC(10,4),
    quantity INTEGER,
    entry_date TIMESTAMP,
    exit_date TIMESTAMP,
    holding_period INTEGER,
    return_amount NUMERIC(10,4),
    return_percent NUMERIC(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询性能

-- 股票表索引
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_market ON stocks(market);
CREATE INDEX IF NOT EXISTS idx_stocks_industry ON stocks(industry);

-- 股票价格表索引
CREATE INDEX IF NOT EXISTS idx_stock_prices_stock_date ON stock_prices(stock_id, date);
CREATE INDEX IF NOT EXISTS idx_stock_prices_date ON stock_prices(date);
CREATE INDEX IF NOT EXISTS idx_stock_prices_stock ON stock_prices(stock_id);

-- AI 模型表索引
CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_weight ON ai_models(weight);

-- 决策表索引
CREATE INDEX IF NOT EXISTS idx_decisions_stock ON decisions(stock_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_confidence ON decisions(confidence);
CREATE INDEX IF NOT EXISTS idx_decisions_generated_at ON decisions(generated_at);

-- 投票结果表索引
CREATE INDEX IF NOT EXISTS idx_vote_results_decision_model ON vote_results(decision_id, model_id);
CREATE INDEX IF NOT EXISTS idx_vote_results_model ON vote_results(model_id);
CREATE INDEX IF NOT EXISTS idx_vote_results_type ON vote_results(vote_type);

-- 回测结果表索引
CREATE INDEX IF NOT EXISTS idx_backtest_results_stock_model ON backtest_results(stock_id, model_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_date_range ON backtest_results(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_backtest_results_performance ON backtest_results(total_return, sharpe_ratio);

-- 交易记录表索引
CREATE INDEX IF NOT EXISTS idx_trade_records_stock ON trade_records(stock_id);
CREATE INDEX IF NOT EXISTS idx_trade_records_decision ON trade_records(decision_id);
CREATE INDEX IF NOT EXISTS idx_trade_records_type ON trade_records(trade_type);
CREATE INDEX IF NOT EXISTS idx_trade_records_entry_date ON trade_records(entry_date);

-- 输出创建结果
SELECT '数据库表结构创建完成' as message;