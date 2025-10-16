# 测试数据种子脚本设计文档

## 1. 测试数据概述

### 1.1 数据目标

为股票回测决策系统提供完整的测试数据环境，包括：

- 股票基本信息
- 历史交易数据
- 回测模型配置
- 模拟决策记录
- 性能评估数据

### 1.2 数据规模

| 数据类型 | 记录数量   | 时间范围    | 说明                  |
| -------- | ---------- | ----------- | --------------------- |
| 股票信息 | 50 只      | -           | 沪深 300 成分股样本   |
| 日线数据 | 15,000 条  | 最近 1 年   | 每只股票 300 个交易日 |
| 回测模型 | 7 个       | -           | 技术分析+机器学习模型 |
| 决策记录 | 105,000 条 | 最近 3 个月 | 每日每只股票每个模型  |
| 综合决策 | 4,500 条   | 最近 3 个月 | 每日每只股票最终决策  |

## 2. 种子数据脚本设计

### 2.1 主种子脚本 (run_seeds.py)

```python
#!/usr/bin/env python3
"""
测试数据种子脚本主程序
"""

import asyncio
import os
import sys
import logging
from datetime import datetime, timedelta
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.src.config.database import get_db_session
from backend.src.models.database import (
    Stock, StockDailyData, BacktestModel,
    ModelDecision, FinalDecision, ModelPerformance
)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataSeeder:
    def __init__(self):
        self.db_session = None

    async def initialize(self):
        """初始化数据库连接"""
        self.db_session = await get_db_session()
        logger.info("数据库连接初始化完成")

    async def seed_stocks(self):
        """种子股票基本信息"""
        logger.info("开始种子股票数据...")

        stocks_data = [
            # 沪深300成分股样本
            {"symbol": "000001", "name": "平安银行", "market": "SZ"},
            {"symbol": "000002", "name": "万科A", "market": "SZ"},
            {"symbol": "000858", "name": "五粮液", "market": "SZ"},
            {"symbol": "600036", "name": "招商银行", "market": "SH"},
            {"symbol": "600519", "name": "贵州茅台", "market": "SH"},
            {"symbol": "601318", "name": "中国平安", "market": "SH"},
            {"symbol": "000333", "name": "美的集团", "market": "SZ"},
            {"symbol": "000651", "name": "格力电器", "market": "SZ"},
            {"symbol": "600276", "name": "恒瑞医药", "market": "SH"},
            {"symbol": "601888", "name": "中国国旅", "market": "SH"},

            # 测试股票
            {"symbol": "TEST001", "name": "测试股票A", "market": "TEST"},
            {"symbol": "TEST002", "name": "测试股票B", "market": "TEST"},
            {"symbol": "TEST003", "name": "测试股票C", "market": "TEST"},
        ]

        for stock_data in stocks_data:
            stock = Stock(**stock_data)
            self.db_session.add(stock)

        await self.db_session.commit()
        logger.info(f"成功种子 {len(stocks_data)} 只股票数据")

    async def seed_daily_data(self):
        """种子股票日线数据"""
        logger.info("开始种子日线数据...")

        # 获取所有股票
        stocks = await self.db_session.execute(
            select(Stock).where(Stock.is_active == True)
        )
        stocks = stocks.scalars().all()

        # 生成最近300个交易日的模拟数据
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=400)  # 包含周末

        daily_data = []
        for stock in stocks:
            base_price = 50.0 if stock.market == 'TEST' else 10.0
            price_variance = 20.0 if stock.market == 'TEST' else 5.0

            current_date = start_date
            while current_date <= end_date:
                # 跳过周末（简单模拟）
                if current_date.weekday() < 5:  # 周一到周五
                    open_price = round(base_price + (random.random() - 0.5) * price_variance, 2)
                    high_price = round(open_price + random.random() * 3, 2)
                    low_price = round(open_price - random.random() * 3, 2)
                    close_price = round((open_price + high_price + low_price) / 3 + (random.random() - 0.5) * 2, 2)

                    volume = random.randint(1000000, 10000000)
                    turnover = round(close_price * volume, 2)

                    daily_data.append(StockDailyData(
                        stock_id=stock.id,
                        trade_date=current_date,
                        open_price=open_price,
                        high_price=high_price,
                        low_price=low_price,
                        close_price=close_price,
                        volume=volume,
                        turnover=turnover
                    ))

                current_date += timedelta(days=1)

        # 批量插入
        self.db_session.add_all(daily_data)
        await self.db_session.commit()
        logger.info(f"成功种子 {len(daily_data)} 条日线数据")

    async def seed_backtest_models(self):
        """种子回测模型数据"""
        logger.info("开始种子回测模型数据...")

        models_data = [
            {
                "name": "移动平均线策略",
                "description": "基于双移动平均线的趋势跟踪策略",
                "model_type": "technical",
                "parameters": {"fast_period": 5, "slow_period": 20, "threshold": 0.02},
                "weight": 0.3
            },
            {
                "name": "RSI策略",
                "description": "基于相对强弱指数的超买超卖策略",
                "model_type": "technical",
                "parameters": {"period": 14, "overbought": 70, "oversold": 30},
                "weight": 0.25
            },
            {
                "name": "MACD策略",
                "description": "基于MACD指标的趋势判断策略",
                "model_type": "technical",
                "parameters": {"fast_period": 12, "slow_period": 26, "signal_period": 9},
                "weight": 0.25
            },
            {
                "name": "布林带策略",
                "description": "基于布林带的价格突破策略",
                "model_type": "technical",
                "parameters": {"period": 20, "std_dev": 2},
                "weight": 0.2
            },
            {
                "name": "随机森林分类器",
                "description": "基于随机森林的股票涨跌分类模型",
                "model_type": "ml",
                "parameters": {"n_estimators": 100, "max_depth": 10, "random_state": 42},
                "weight": 0.4
            },
            {
                "name": "梯度提升树",
                "description": "基于XGBoost的回归预测模型",
                "model_type": "ml",
                "parameters": {"n_estimators": 200, "learning_rate": 0.1, "max_depth": 6},
                "weight": 0.35
            },
            {
                "name": "支持向量机",
                "description": "基于SVM的分类模型",
                "model_type": "ml",
                "parameters": {"kernel": "rbf", "C": 1.0, "gamma": "scale"},
                "weight": 0.25
            }
        ]

        for model_data in models_data:
            model = BacktestModel(**model_data)
            self.db_session.add(model)

        await self.db_session.commit()
        logger.info(f"成功种子 {len(models_data)} 个回测模型")

    async def seed_model_decisions(self):
        """种子模型决策数据"""
        logger.info("开始种子模型决策数据...")

        # 获取活跃的股票和模型
        stocks = await self.db_session.execute(
            select(Stock).where(Stock.is_active == True)
        )
        stocks = stocks.scalars().all()

        models = await self.db_session.execute(
            select(BacktestModel).where(BacktestModel.is_active == True)
        )
        models = models.scalars().all()

        # 生成最近90天的决策数据
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=90)

        decisions = []
        for stock in stocks:
            current_date = start_date
            while current_date <= end_date:
                if current_date.weekday() < 5:  # 交易日
                    for model in models:
                        # 模拟决策逻辑
                        decision_type = random.choice(['BUY', 'SELL', 'HOLD'])
                        confidence = round(random.uniform(0.6, 0.95), 4)
                        signal_strength = round(random.uniform(0.5, 0.9), 4)

                        decisions.append(ModelDecision(
                            stock_id=stock.id,
                            model_id=model.id,
                            trade_date=current_date,
                            decision=decision_type,
                            confidence=confidence,
                            signal_strength=signal_strength
                        ))

                current_date += timedelta(days=1)

        # 批量插入
        self.db_session.add_all(decisions)
        await self.db_session.commit()
        logger.info(f"成功种子 {len(decisions)} 条模型决策数据")

    async def seed_final_decisions(self):
        """种子综合决策数据"""
        logger.info("开始种子综合决策数据...")

        # 获取活跃股票
        stocks = await self.db_session.execute(
            select(Stock).where(Stock.is_active == True)
        )
        stocks = stocks.scalars().all()

        # 生成最近90天的综合决策
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=90)

        final_decisions = []
        for stock in stocks:
            current_date = start_date
            while current_date <= end_date:
                if current_date.weekday() < 5:  # 交易日
                    # 模拟投票结果
                    buy_votes = random.randint(0, 3)
                    sell_votes = random.randint(0, 3)
                    hold_votes = random.randint(0, 3)

                    # 确定最终决策
                    votes = [('BUY', buy_votes), ('SELL', sell_votes), ('HOLD', hold_votes)]
                    final_decision = max(votes, key=lambda x: x[1])[0]
                    confidence_score = round(random.uniform(0.7, 0.95), 4)

                    final_decisions.append(FinalDecision(
                        stock_id=stock.id,
                        trade_date=current_date,
                        buy_votes=buy_votes,
                        sell_votes=sell_votes,
                        hold_votes=hold_votes,
                        final_decision=final_decision,
                        confidence_score=confidence_score
                    ))

                current_date += timedelta(days=1)

        # 批量插入
        self.db_session.add_all(final_decisions)
        await self.db_session.commit()
        logger.info(f"成功种子 {len(final_decisions)} 条综合决策数据")

    async def seed_model_performance(self):
        """种子模型性能数据"""
        logger.info("开始种子模型性能数据...")

        # 获取所有模型
        models = await self.db_session.execute(select(BacktestModel))
        models = models.scalars().all()

        # 生成最近30天的性能数据
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)

        performance_data = []
        for model in models:
            current_date = start_date
            while current_date <= end_date:
                if current_date.weekday() < 5:  # 交易日
                    performance_data.append(ModelPerformance(
                        model_id=model.id,
                        backtest_date=current_date,
                        accuracy=round(random.uniform(0.55, 0.85), 4),
                        precision=round(random.uniform(0.5, 0.8), 4),
                        recall=round(random.uniform(0.5, 0.8), 4),
                        f1_score=round(random.uniform(0.5, 0.8), 4),
                        total_return=round(random.uniform(-0.1, 0.2), 4),
                        sharpe_ratio=round(random.uniform(-1.0, 2.0), 4),
                        max_drawdown=round(random.uniform(-0.2, -0.05), 4)
                    ))

                current_date += timedelta(days=1)

        # 批量插入
        self.db_session.add_all(performance_data)
        await self.db_session.commit()
        logger.info(f"成功种子 {len(performance_data)} 条模型性能数据")

    async def run_all_seeds(self):
        """运行所有种子数据"""
        try:
            await self.initialize()

            # 按依赖关系顺序执行种子
            await self.seed_stocks()
            await self.seed_backtest_models()
            await self.seed_daily_data()
            await self.seed_model_decisions()
            await self.seed_final_decisions()
            await self.seed_model_performance()

            logger.info("所有种子数据执行完成")

        except Exception as e:
            logger.error(f"种子数据执行失败: {e}")
            raise
        finally:
            if self.db_session:
                await self.db_session.close()

async def main():
    """主函数"""
    seeder = DataSeeder()
    await seeder.run_all_seeds()

if __name__ == "__main__":
    import random
    from sqlalchemy import select

    asyncio.run(main())
```

### 2.2 数据验证脚本 (validate_data.py)

```python
#!/usr/bin/env python3
"""
测试数据验证脚本
"""

import asyncio
import logging
from sqlalchemy import select, func

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataValidator:
    def __init__(self, db_session):
        self.db_session = db_session

    async def validate_stocks(self):
        """验证股票数据完整性"""
        logger.info("验证股票数据...")

        # 检查股票数量
        result = await self.db_session.execute(select(func.count(Stock.id)))
        stock_count = result.scalar()

        logger.info(f"股票总数: {stock_count}")
        assert stock_count >= 10, "股票数量不足"

        # 检查市场分布
        result = await self.db_session.execute(
            select(Stock.market, func.count(Stock.id)).group_by(Stock.market)
        )
        market_dist = result.all()

        logger.info("市场分布:")
        for market, count in market_dist:
            logger.info(f"  {market}: {count}只")

    async def validate_daily_data(self):
        """验证日线数据完整性"""
        logger.info("验证日线数据...")

        # 检查日线数据数量
        result = await self.db_session.execute(select(func.count(StockDailyData.id)))
        daily_count = result.scalar()

        logger.info(f"日线数据总数: {daily_count}")
        assert daily_count >= 1000, "日线数据数量不足"

        # 检查数据完整性
        result = await self.db_session.execute(
            select(
                Stock.symbol,
                func.count(StockDailyData.id).label('data_count'),
                func.min(StockDailyData.trade_date).label('start_date'),
                func.max(StockDailyData.trade_date).label('end_date')
            )
            .join(StockDailyData, Stock.id == StockDailyData.stock_id)
            .group_by(Stock.id, Stock.symbol)
        )

        stock_stats = result.all()

        logger.info("股票数据统计:")
        for symbol, count, start_date, end_date in stock_stats:
            logger.info(f"  {symbol}: {count}条记录 ({start_date} 到 {end_date})")

    async def validate_models(self):
        """验证模型数据完整性"""
        logger.info("验证模型数据...")

        # 检查模型数量
        result = await self.db_session.execute(select(func.count(BacktestModel.id)))
        model_count = result.scalar()

        logger.info(f"模型总数: {model_count}")
        assert model_count >= 5, "模型数量不足"

        # 检查模型类型分布
        result = await self.db_session.execute(
            select(BacktestModel.model_type, func.count(BacktestModel.id))
            .group_by(BacktestModel.model_type)
        )
        type_dist = result.all()

        logger.info("模型类型分布:")
        for model_type, count in type_dist:
            logger.info(f"  {model_type}: {count}个")

    async def validate_decisions(self):
        """验证决策数据完整性"""
        logger.info("验证决策数据...")

        # 检查模型决策数量
        result = await self.db_session.execute(select(func.count(ModelDecision.id)))
        decision_count = result.scalar()

        logger.info(f"模型决策总数: {decision_count}")

        # 检查综合决策数量
        result = await self.db_session.execute(select(func.count(FinalDecision.id)))
        final_count = result.scalar()

        logger.info(f"综合决策总数: {final_count}")

    async def run_all_validations(self):
        """运行所有验证"""
        try:
            await self.validate_stocks()
            await self.validate_models()
            await self.validate
```
