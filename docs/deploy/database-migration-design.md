# 数据库迁移脚本设计文档

## 1. 迁移工具配置

### 1.1 Alembic 配置文件 (alembic.ini)

```ini
[alembic]
script_location = data/migrations
prepend_sys_path = .
version_path_separator = os

# 数据库连接配置
sqlalchemy.url = postgresql+asyncpg://stock_user:stock_pass@localhost:5432/stock_system

# 日志配置
[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

### 1.2 迁移环境配置 (env.py)

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入数据模型
from backend.src.models.database import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """在离线模式下运行迁移"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """在在线模式下运行迁移"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## 2. 初始迁移脚本设计

### 2.1 001_initial_schema.py

```python
"""initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2025-10-16 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 创建股票基本信息表
    op.create_table('stocks',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('market', sa.String(length=10), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('symbol')
    )

    # 创建股票日线数据表
    op.create_table('stock_daily_data',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('stock_id', sa.BigInteger(), nullable=False),
        sa.Column('trade_date', sa.Date(), nullable=False),
        sa.Column('open_price', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('high_price', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('low_price', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('close_price', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('volume', sa.BigInteger(), nullable=True),
        sa.Column('turnover', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['stock_id'], ['stocks.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('stock_id', 'trade_date', name='uq_stock_date')
    )

    # 创建回测模型表
    op.create_table('backtest_models',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('model_type', sa.String(length=50), nullable=True),
        sa.Column('parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('weight', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 创建模型决策记录表
    op.create_table('model_decisions',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('stock_id', sa.BigInteger(), nullable=False),
        sa.Column('model_id', sa.BigInteger(), nullable=False),
        sa.Column('trade_date', sa.Date(), nullable=False),
        sa.Column('decision', sa.String(length=10), nullable=False),
        sa.Column('confidence', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('signal_strength', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['stock_id'], ['stocks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_id'], ['backtest_models.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('stock_id', 'model_id', 'trade_date', name='uq_stock_model_date'),
        sa.CheckConstraint("decision IN ('BUY', 'SELL', 'HOLD')", name='chk_decision_type'),
        sa.CheckConstraint("confidence >= 0 AND confidence <= 1", name='chk_confidence_range'),
        sa.CheckConstraint("signal_strength >= 0 AND signal_strength <= 1", name='chk_signal_range')
    )

    # 创建综合决策表
    op.create_table('final_decisions',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('stock_id', sa.BigInteger(), nullable=False),
        sa.Column('trade_date', sa.Date(), nullable=False),
        sa.Column('buy_votes', sa.Integer(), nullable=True),
        sa.Column('sell_votes', sa.Integer(), nullable=True),
        sa.Column('hold_votes', sa.Integer(), nullable=True),
        sa.Column('final_decision', sa.String(length=10), nullable=True),
        sa.Column('confidence_score', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['stock_id'], ['stocks.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('stock_id', 'trade_date', name='uq_final_stock_date'),
        sa.CheckConstraint("final_decision IN ('BUY', 'SELL', 'HOLD')", name='chk_final_decision_type'),
        sa.CheckConstraint("confidence_score >= 0 AND confidence_score <= 1", name='chk_final_confidence_range')
    )

    # 创建模型性能表
    op.create_table('model_performance',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('model_id', sa.BigInteger(), nullable=False),
        sa.Column('backtest_date', sa.Date(), nullable=False),
        sa.Column('accuracy', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('precision', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('recall', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('f1_score', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('total_return', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('sharpe_ratio', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('max_drawdown', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['model_id'], ['backtest_models.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('model_id', 'backtest_date', name='uq_model_backtest_date')
    )

def downgrade() -> None:
    # 按依赖关系反向删除表
    op.drop_table('model_performance')
    op.drop_table('final_decisions')
    op.drop_table('model_decisions')
    op.drop_table('backtest_models')
    op.drop_table('stock_daily_data')
    op.drop_table('stocks')
```

### 2.2 索引优化脚本

```python
"""add_indexes

Revision ID: 002_add_indexes
Revises: 001_initial_schema
Create Date: 2025-10-16 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002_add_indexes'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 股票表索引
    op.create_index('idx_stocks_symbol', 'stocks', ['symbol'])
    op.create_index('idx_stocks_market', 'stocks', ['market'])
    op.create_index('idx_stocks_active', 'stocks', ['is_active'])

    # 日线数据表索引
    op.create_index('idx_daily_data_stock_date', 'stock_daily_data', ['stock_id', 'trade_date'])
    op.create_index('idx_daily_data_date', 'stock_daily_data', ['trade_date'])
    op.create_index('idx_daily_data_stock', 'stock_daily_data', ['stock_id'])

    # 模型表索引
    op.create_index('idx_models_type', 'backtest_models', ['model_type'])
    op.create_index('idx_models_active', 'backtest_models', ['is_active'])
    op.create_index('idx_models_parameters', 'backtest_models', ['parameters'], postgresql_using='gin')

    # 模型决策表索引
    op.create_index('idx_model_decisions_stock_date', 'model_decisions', ['stock_id', 'trade_date'])
    op.create_index('idx_model_decisions_model_date', 'model_decisions', ['model_id', 'trade_date'])
    op.create_index('idx_model_decisions_decision', 'model_decisions', ['decision'])

    # 综合决策表索引
    op.create_index('idx_final_decisions_stock_date', 'final_decisions', ['stock_id', 'trade_date'])
    op.create_index('idx_final_decisions_date', 'final_decisions', ['trade_date'])
    op.create_index('idx_final_decisions_decision', 'final_decisions', ['final_decision'])

    # 模型性能表索引
    op.create_index('idx_performance_model_date', 'model_performance', ['model_id', 'backtest_date'])
    op.create_index('idx_performance_date', 'model_performance', ['backtest_date'])

def downgrade() -> None:
    # 删除所有索引
    op.drop_index('idx_stocks_symbol')
    op.drop_index('idx_stocks_market')
    op.drop_index('idx_stocks_active')

    op.drop_index('idx_daily_data_stock_date')
    op.drop_index('idx_daily_data_date')
    op.drop_index('idx_daily_data_stock')

    op.drop_index('idx_models_type')
    op.drop_index('idx_models_active')
    op.drop_index('idx_models_parameters')

    op.drop_index('idx_model_decisions_stock_date')
    op.drop_index('idx_model_decisions_model_date')
    op.drop_index('idx_model_decisions_decision')

    op.drop_index('idx_final_decisions_stock_date')
    op.drop_index('idx_final_decisions_date')
    op.drop_index('idx_final_decisions_decision')

    op.drop_index('idx_performance_model_date')
    op.drop_index('idx_performance_date')
```

## 3. 种子数据设计

### 3.1 股票数据种子 (001_stocks_data.sql)

```sql
-- 插入沪深300成分股示例数据
INSERT INTO stocks (symbol, name, market, is_active, created_at) VALUES
('000001', '平安银行', 'SZ', true, NOW()),
('000002', '万科A', 'SZ', true, NOW()),
('000858', '五粮液', 'SZ', true, NOW()),
('600036', '招商银行', 'SH', true, NOW()),
('600519', '贵州茅台', 'SH', true, NOW()),
('601318', '中国平安', 'SH', true, NOW()),
('000333', '美的集团', 'SZ', true, NOW()),
('000651', '格力电器', 'SZ', true, NOW()),
('600276', '恒瑞医药', 'SH', true, NOW()),
('601888', '中国国旅', 'SH', true, NOW());

-- 创建测试股票
INSERT INTO stocks (symbol, name, market, is_active, created_at) VALUES
('TEST001', '测试股票A', 'TEST', true, NOW()),
('TEST002', '测试股票B', 'TEST', true, NOW()),
('TEST003', '测试股票C', 'TEST', true, NOW());
```

### 3.2 回测模型种子 (002_backtest_models.sql)

```sql
-- 插入技术分析模型
INSERT INTO backtest_models (name, description, model_type, parameters, weight, is_active, created_at) VALUES
('移动平均线策略', '基于双移动平均线的趋势跟踪策略', 'technical', '{"fast_period": 5, "slow_period": 20, "threshold": 0.02}', 0.3, true, NOW()),
('RSI策略', '基于相对强弱指数的超买超卖策略', 'technical', '{"period": 14, "overbought": 70, "oversold": 30}', 0.25, true, NOW()),
('MACD策略', '基于MACD指标的趋势判断策略', 'technical', '{"fast_period": 12, "slow_period": 26, "signal_period": 9}', 0.25, true, NOW()),
('布林带策略', '基于布林带的价格突破策略', 'technical', '{"period": 20, "std_dev": 2}', 0.2, true, NOW());

-- 插入机器学习模型
INSERT INTO backtest_models (name, description, model_type, parameters, weight, is_active, created_at) VALUES
('随机森林分类器', '基于随机森林的股票涨跌分类模型', 'ml', '{"n_estimators": 100, "max_depth": 10, "random_state": 42}', 0.4, true, NOW()),
('梯度提升树', '基于XGBoost的回归预测模型', 'ml', '{"n_estimators": 200, "learning_rate": 0.1, "max_depth": 6}', 0.35, true, NOW()),
('支持向量机', '基于SVM的分类模型', 'ml', '{"kernel": "rbf", "C": 1.0, "gamma": "scale"}', 0.25, true, NOW());
```

### 3.3 日线数据种子 (003_sample_daily_data.sql)

```sql
-- 为测试股票生成最近30个交易日的模拟数据
INSERT INTO stock_daily_data (stock_id, trade_date, open_price, high_price, low_price, close_price, volume, turnover, created_at)
SELECT
    s.id,
    date_series.trade_date,
    ROUND((50 + RANDOM() * 50)::numeric, 2) as open_price,
    ROUND((open_price + RANDOM() * 10)::numeric, 2) as high_price,
    ROUND((open_price - RANDOM() * 10)::numeric, 2) as low_price,
    ROUND((open_price + (RANDOM() - 0.5) * 5)::numeric, 2) as close_price,
    (1000000 + RANDOM() * 9000000)::bigint as volume,
    ROUND((close_price * volume)::numeric, 2) as turnover,
    NOW()
FROM
    stocks s,
    (SELECT CURRENT_DATE - (n || ' days')::interval as trade_date
     FROM generate_series(0, 29) n) date_series
WHERE s.market = 'TEST'
ORDER BY s.id, date_series.trade_date;
```

## 4. 迁移管理脚本

### 4.1 迁移执行脚本 (run_migrations.sh)

```bash
#!/bin/bash

# 数据库迁移执行脚本

set -e

echo "开始数据库迁移..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "错误: DATABASE_URL 环境变量未设置"
    exit 1
fi

# 进入迁移目录
cd data/migrations

# 运行迁移
echo "应用数据库迁移..."
alembic upgrade head

# 检查迁移状态
echo "迁移状态:"
alembic current

echo "数据库迁移完成"
```

### 4.2 种子数据执行脚本 (run_seeds.py)

```python
#!/usr/bin/env python3
"""
种子数据执行脚本
"""

import asyncio
import os
import sys
```
