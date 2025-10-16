#!/usr/bin/env python3
"""
数据库环境端到端测试
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class E2ETester:
    """端到端测试器"""

    def __init__(self, db_session):
        self.db_session = db_session

    async def test_stock_operations(self):
        """测试股票相关操作"""
        logger.info("测试股票操作...")

        try:
            from sqlalchemy import select

            # 测试查询股票
            result = await self.db_session.execute(
                select(Stock).where(Stock.is_active == True).limit(5)
            )
            stocks = result.scalars().all()

            assert len(stocks) > 0, "没有找到活跃股票"
            logger.info(f"成功查询到 {len(stocks)} 只股票")

            # 测试查询日线数据
            for stock in stocks:
                result = await self.db_session.execute(
                    select(StockDailyData)
                    .where(StockDailyData.stock_id == stock.id)
                    .order_by(StockDailyData.trade_date.desc())
                    .limit(1)
                )
                latest_data = result.scalar_one_or_none()

                if latest_data:
                    logger.info(f"股票 {stock.symbol} 最新价格: {latest_data.close_price}")

            return True

        except Exception as e:
            logger.error(f"股票操作测试失败: {e}")
            return False

    async def test_model_operations(self):
        """测试模型相关操作"""
        logger.info("测试模型操作...")

        try:
            from sqlalchemy import select, func

            # 测试查询模型
            result = await self.db_session.execute(
                select(BacktestModel).where(BacktestModel.is_active == True)
            )
            models = result.scalars().all()

            assert len(models) > 0, "没有找到活跃模型"
            logger.info(f"成功查询到 {len(models)} 个模型")

            # 测试模型决策统计
            for model in models:
                result = await self.db_session.execute(
                    select(func.count(ModelDecision.id))
                    .where(ModelDecision.model_id == model.id)
                )
                decision_count = result.scalar()

                logger.info(f"模型 {model.name} 决策数量: {decision_count}")

            return True

        except Exception as e:
            logger.error(f"模型操作测试失败: {e}")
            return False

    async def test_decision_aggregation(self):
        """测试决策聚合功能"""
        logger.info("测试决策聚合...")

        try:
            from sqlalchemy import select, func

            # 测试综合决策查询
            result = await self.db_session.execute(
                select(FinalDecision)
                .order_by(FinalDecision.trade_date.desc())
                .limit(10)
            )
            recent_decisions = result.scalars().all()

            for decision in recent_decisions:
                logger.info(
                    f"决策日期: {decision.trade_date}, "
                    f"买入票: {decision.buy_votes}, "
                    f"最终决策: {decision.final_decision}"
                )

            return True

        except Exception as e:
            logger.error(f"决策聚合测试失败: {e}")
            return False

    async def test_performance_metrics(self):
        """测试性能指标功能"""
        logger.info("测试性能指标...")

        try:
            from sqlalchemy import select

            # 测试模型性能查询
            result = await self.db_session.execute(
                select(ModelPerformance)
                .order_by(ModelPerformance.backtest_date.desc())
                .limit(5)
            )
            performances = result.scalars().all()

            for perf in performances:
                logger.info(
                    f"回测日期: {perf.backtest_date}, "
                    f"准确率: {perf.accuracy:.2%}, "
                    f"总收益: {perf.total_return:.2%}"
                )

            return True

        except Exception as e:
            logger.error(f"性能指标测试失败: {e}")
            return False

    async def test_complex_queries(self):
        """测试复杂查询"""
        logger.info("测试复杂查询...")

        try:
            from sqlalchemy import select, func

            # 测试多表关联查询
            result = await self.db_session.execute(
                select(
                    Stock.symbol,
                    Stock.name,
                    func.avg(StockDailyData.close_price).label('avg_price'),
                    func.max(StockDailyData.volume).label('max_volume')
                )
                .join(StockDailyData, Stock.id == StockDailyData.stock_id)
                .group_by(Stock.id, Stock.symbol, Stock.name)
                .order_by(func.avg(StockDailyData.close_price).desc())
                .limit(5)
            )
            top_stocks = result.all()

            logger.info("平均价格最高的5只股票:")
            for symbol, name, avg_price, max_volume in top_stocks:
                logger.info(f"  {symbol} {name}: 均价 {avg_price:.2f}, 最大成交量 {max_volume}")

            # 测试模型性能排名
            result = await self.db_session.execute(
                select(
                    BacktestModel.name,
                    func.avg(ModelPerformance.accuracy).label('avg_accuracy'),
                    func.avg(ModelPerformance.total_return).label('avg_return')
                )
                .join(ModelPerformance, BacktestModel.id == ModelPerformance.model_id)
                .group_by(BacktestModel.id, BacktestModel.name)
                .order_by(func.avg(ModelPerformance.accuracy).desc())
                .limit(3)
            )
            top_models = result.all()

            logger.info("准确率最高的3个模型:")
            for name, avg_accuracy, avg_return in top_models:
                logger.info(f"  {name}: 准确率 {avg_accuracy:.2%}, 收益 {avg_return:.2%}")

            return True

        except Exception as e:
            logger.error(f"复杂查询测试失败: {e}")
            return False

    async def test_data_consistency(self):
        """测试数据一致性"""
        logger.info("测试数据一致性...")

        try:
            from sqlalchemy import select, func

            # 检查决策数据一致性
            result = await self.db_session.execute(
                select(
                    FinalDecision.trade_date,
                    func.count(FinalDecision.id).label('final_count'),
                    func.count(ModelDecision.id).label('model_count')
                )
                .join(Stock, FinalDecision.stock_id == Stock.id)
                .join(ModelDecision, Stock.id == ModelDecision.stock_id)
                .where(FinalDecision.trade_date == ModelDecision.trade_date)
                .group_by(FinalDecision.trade_date)
                .order_by(FinalDecision.trade_date.desc())
                .limit(5)
            )
            consistency_data = result.all()

            logger.info("最近5个交易日的数据一致性:")
            for trade_date, final_count, model_count in consistency_data:
                logger.info(f"  {trade_date}: 综合决策 {final_count} 条, 模型决策 {model_count} 条")

            return True

        except Exception as e:
            logger.error(f"数据一致性测试失败: {e}")
            return False

    async def run_all_tests(self):
        """运行所有测试"""
        logger.info("开始端到端测试...")

        tests = [
            ("股票操作", self.test_stock_operations),
            ("模型操作", self.test_model_operations),
            ("决策聚合", self.test_decision_aggregation),
            ("性能指标", self.test_performance_metrics),
            ("复杂查询", self.test_complex_queries),
            ("数据一致性", self.test_data_consistency),
        ]

        results = {}
        all_passed = True

        for test_name, test_func in tests:
            try:
                result = await test_func()
                results[test_name] = result

                if result:
                    logger.info(f"✓ {test_name} 测试通过")
                else:
                    logger.error(f"✗ {test_name} 测试失败")
                    all_passed = False

            except Exception as e:
                logger.error(f"✗ {test_name} 测试异常: {e}")
                results[test_name] = False
                all_passed = False

        if all_passed:
            logger.info("🎉 所有端到端测试通过！")
        else:
            logger.error("❌ 部分端到端测试失败")

        return all_passed

async def main():
    """主函数"""
    from backend.src.config.database import get_db_session
    
    async for session in get_db_session():
        tester = E2ETester(session)
        success = await tester.run_all_tests()
        
        if not success:
            exit(1)

if __name__ == "__main__":
    # 导入模型
    from backend.src.models.database import (
        Stock, StockDailyData, BacktestModel,
        ModelDecision, FinalDecision, ModelPerformance
    )
    
    asyncio.run(main())