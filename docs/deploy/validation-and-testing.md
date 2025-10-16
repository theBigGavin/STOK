# 数据库环境验证和测试文档

## 1. 验证流程概述

### 1.1 验证目标

确保数据库环境搭建完整、数据一致、性能达标，包括：

- 数据库服务健康状态
- 数据表结构和约束
- 测试数据完整性
- 连接性能和稳定性
- 备份恢复功能

### 1.2 验证阶段

| 阶段     | 验证内容           | 执行时机   |
| -------- | ------------------ | ---------- |
| 环境验证 | 服务健康、连接测试 | 环境搭建后 |
| 结构验证 | 表结构、索引、约束 | 迁移完成后 |
| 数据验证 | 数据完整性、一致性 | 种子数据后 |
| 性能验证 | 查询性能、连接池   | 系统运行前 |
| 集成验证 | 应用集成、API 调用 | 部署完成后 |

## 2. 环境验证脚本

### 2.1 服务健康检查 (health_check.py)

```python
#!/usr/bin/env python3
"""
数据库服务健康检查脚本
"""

import asyncio
import logging
import sys
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HealthChecker:
    """健康检查器"""

    def __init__(self):
        self.checks = []
        self.start_time = datetime.now()

    def add_check(self, name, check_func):
        """添加检查项"""
        self.checks.append({"name": name, "func": check_func})

    async def check_postgres(self):
        """检查 PostgreSQL 服务"""
        try:
            from backend.src.config.database import db_config
            engine = db_config.create_engine()

            async with engine.connect() as conn:
                # 检查版本
                result = await conn.execute("SELECT version()")
                version = result.scalar()

                # 检查连接数
                result = await conn.execute("SELECT count(*) FROM pg_stat_activity")
                connections = result.scalar()

                # 检查数据库大小
                result = await conn.execute("""
                    SELECT pg_size_pretty(pg_database_size('stock_system'))
                """)
                db_size = result.scalar()

                await conn.close()

            logger.info(f"PostgreSQL 版本: {version.split(',')[0]}")
            logger.info(f"当前连接数: {connections}")
            logger.info(f"数据库大小: {db_size}")

            return True
        except Exception as e:
            logger.error(f"PostgreSQL 检查失败: {e}")
            return False

    async def check_redis(self):
        """检查 Redis 服务"""
        try:
            from backend.src.config.redis_config import redis_config
            client = await redis_config.get_redis_client()

            # 检查连接
            ping_result = await client.ping()

            # 检查内存使用
            info = await client.info("memory")
            used_memory = info.get("used_memory_human", "N/A")

            # 检查键数量
            key_count = await client.dbsize()

            await client.close()

            logger.info(f"Redis Ping: {ping_result}")
            logger.info(f"Redis 内存使用: {used_memory}")
            logger.info(f"Redis 键数量: {key_count}")

            return True
        except Exception as e:
            logger.error(f"Redis 检查失败: {e}")
            return False

    async def check_database_tables(self):
        """检查数据库表结构"""
        try:
            from backend.src.config.database import db_config
            from sqlalchemy import inspect

            engine = db_config.create_engine()

            async with engine.connect() as conn:
                inspector = inspect(engine)
                tables = inspector.get_table_names()

                required_tables = [
                    'stocks', 'stock_daily_data', 'backtest_models',
                    'model_decisions', 'final_decisions', 'model_performance'
                ]

                missing_tables = []
                for table in required_tables:
                    if table not in tables:
                        missing_tables.append(table)

                if missing_tables:
                    logger.error(f"缺少表: {missing_tables}")
                    return False

                logger.info(f"所有必需表存在: {required_tables}")

                # 检查表记录数
                for table in required_tables:
                    result = await conn.execute(f"SELECT COUNT(*) FROM {table}")
                    count = result.scalar()
                    logger.info(f"表 {table} 记录数: {count}")

                await conn.close()

            return True
        except Exception as e:
            logger.error(f"表结构检查失败: {e}")
            return False

    async def check_data_integrity(self):
        """检查数据完整性"""
        try:
            from backend.src.config.database import db_config

            engine = db_config.create_engine()

            async with engine.connect() as conn:
                # 检查外键约束
                integrity_checks = [
                    # 检查股票日线数据的外键
                    """
                    SELECT COUNT(*) FROM stock_daily_data sd
                    LEFT JOIN stocks s ON sd.stock_id = s.id
                    WHERE s.id IS NULL
                    """,
                    # 检查模型决策的外键
                    """
                    SELECT COUNT(*) FROM model_decisions md
                    LEFT JOIN stocks s ON md.stock_id = s.id
                    LEFT JOIN backtest_models bm ON md.model_id = bm.id
                    WHERE s.id IS NULL OR bm.id IS NULL
                    """,
                    # 检查综合决策的外键
                    """
                    SELECT COUNT(*) FROM final_decisions fd
                    LEFT JOIN stocks s ON fd.stock_id = s.id
                    WHERE s.id IS NULL
                    """
                ]

                for i, check_sql in enumerate(integrity_checks):
                    result = await conn.execute(check_sql)
                    invalid_count = result.scalar()

                    if invalid_count > 0:
                        logger.error(f"完整性检查 {i+1} 失败: 发现 {invalid_count} 条无效记录")
                        return False

                await conn.close()

            logger.info("所有数据完整性检查通过")
            return True
        except Exception as e:
            logger.error(f"数据完整性检查失败: {e}")
            return False

    async def check_performance(self):
        """检查性能基准"""
        try:
            from backend.src.config.database import db_config

            engine = db_config.create_engine()

            async with engine.connect() as conn:
                # 简单查询性能测试
                start_time = datetime.now()

                # 测试复杂查询
                test_queries = [
                    # 查询最近交易日的股票数据
                    """
                    SELECT s.symbol, s.name, sd.close_price, sd.volume
                    FROM stocks s
                    JOIN stock_daily_data sd ON s.id = sd.stock_id
                    WHERE sd.trade_date = (
                        SELECT MAX(trade_date) FROM stock_daily_data
                    )
                    ORDER BY sd.volume DESC
                    LIMIT 10
                    """,
                    # 查询模型决策统计
                    """
                    SELECT m.name, COUNT(*) as decision_count,
                           AVG(md.confidence) as avg_confidence
                    FROM backtest_models m
                    JOIN model_decisions md ON m.id = md.model_id
                    WHERE md.trade_date >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY m.id, m.name
                    ORDER BY decision_count DESC
                    """
                ]

                for i, query in enumerate(test_queries):
                    query_start = datetime.now()
                    result = await conn.execute(query)
                    rows = result.fetchall()
                    query_time = (datetime.now() - query_start).total_seconds()

                    logger.info(f"查询 {i+1} 执行时间: {query_time:.3f}秒, 返回 {len(rows)} 行")

                    if query_time > 5.0:  # 5秒阈值
                        logger.warning(f"查询 {i+1} 执行时间过长: {query_time:.3f}秒")

                total_time = (datetime.now() - start_time).total_seconds()
                logger.info(f"性能测试总时间: {total_time:.3f}秒")

                await conn.close()

            return True
        except Exception as e:
            logger.error(f"性能检查失败: {e}")
            return False

    async def run_all_checks(self):
        """运行所有检查"""
        logger.info("开始健康检查...")

        # 添加检查项
        self.add_check("PostgreSQL", self.check_postgres)
        self.add_check("Redis", self.check_redis)
        self.add_check("表结构", self.check_database_tables)
        self.add_check("数据完整性", self.check_data_integrity)
        self.add_check("性能基准", self.check_performance)

        results = {}
        all_passed = True

        for check in self.checks:
            logger.info(f"执行检查: {check['name']}")
            try:
                result = await check['func']()
                results[check['name']] = result

                if result:
                    logger.info(f"✓ {check['name']} 检查通过")
                else:
                    logger.error(f"✗ {check['name']} 检查失败")
                    all_passed = False

            except Exception as e:
                logger.error(f"✗ {check['name']} 检查异常: {e}")
                results[check['name']] = False
                all_passed = False

        # 生成报告
        total_time = (datetime.now() - self.start_time).total_seconds()
        logger.info(f"健康检查完成，总耗时: {total_time:.2f}秒")

        if all_passed:
            logger.info("🎉 所有健康检查通过！")
        else:
            logger.error("❌ 部分健康检查失败")
            # 输出失败详情
            for check_name, passed in results.items():
                if not passed:
                    logger.error(f"  失败项: {check_name}")

        return all_passed

async def main():
    """主函数"""
    checker = HealthChecker()
    success = await checker.run_all_checks()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
```

## 3. 自动化测试脚本

### 3.1 端到端测试 (e2e_test.py)

```python
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

    async def run_all_tests(self):
        """运行所有测试"""
        logger.info("开始端到端测试...")

        tests = [
            ("股票操作", self.test_stock_operations),
            ("模型操作", self.test_model_operations),
            ("决策聚合", self.test_decision_aggregation),
            ("性能指标", self.test_performance_metrics),
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

    async with get_db_session() as db_session:
        tester = E2ETester(db_session)
        success = await tester.run_all_tests()

    exit(0 if success else 1)

if __name__ == "__main__":
    # 导入数据模型
    from backend.src.models.database import (
        Stock, StockDailyData, BacktestModel,
        ModelDecision, FinalDecision, ModelPerformance
    )

    asyncio.run(main())
```

## 4. 部署验证清单

### 4.1 预部署检查清单

- [ ] 环境变量配置正确
- [ ] 数据库服务运行正常
- [ ] 迁移脚本执行成功
- [ ] 种子数据加载完成
- [ ] 健康检查全部通过
- [ ] 性能基准测试达标

### 4.2 部署后验证清单

- [ ] 应用服务启动正常
- [ ] API 接口响应正常
- [ ] 数据库连接稳定
- [ ] Redis 缓存工作正常
- [ ] 定时任务执行正常
- [ ] 监控指标收集正常

## 5. 故障排除指南

### 5.1 常见问题解决

1. **数据库连接失败**

   - 检查环境变量 `DATABASE_URL`
   - 验证数据库服务状态
   - 检查网络连接和防火墙

2. **迁移脚本执行失败**

   - 检查数据库版本兼容性
   - 验证迁移脚本语法
   - 检查依赖表是否存在

3. **数据完整性错误**

   - 运行数据验证脚本
   - 检查外键约束
   - 重新执行种子数据

4. **性能问题**
   - 检查索引是否创建
   - 优化查询语句
   - 调整连接池配置

### 5.2 紧急恢复步骤

1. 停止应用服务
2. 备份当前数据库
3. 回滚到上一个稳定版本
4. 执行数据恢复
5. 重新部署应用

---

**文档版本**: v1.0  
**最后更新**: 2025-10-16  
**维护者**: 质量保证团队
