"""
决策点用户旅程集成测试
测试决策详情功能的完整用户旅程
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from src.models.database import Stock, Decision, VoteResult, AIModel, StockPrice
from src.models.stock_models import DecisionType, ModelType
from src.services.stock_service import StockService
from src.decision_engine.manager import DecisionEngineManager


class TestDecisionIntegration:
    """决策详情集成测试"""

    @pytest.mark.asyncio
    async def test_decision_creation_and_retrieval(self, session: AsyncSession):
        """测试决策创建和检索的完整流程"""
        # 创建测试股票
        stock = Stock(
            symbol="TEST001",
            name="测试股票",
            market="A股",
            industry="测试行业",
            current_price=100.0,
            price_change=1.5,
            price_change_percent=1.5,
            volume=1000000,
            market_cap=1000000000.0
        )
        session.add(stock)
        await session.commit()

        # 创建测试AI模型
        ai_model = AIModel(
            name="测试技术模型",
            model_type=ModelType.TECHNICAL,
            description="用于测试的技术指标模型",
            weight=0.5,
            is_active=True,
            performance_score=0.8
        )
        session.add(ai_model)
        await session.commit()

        # 创建决策
        decision = Decision(
            stock_id=stock.id,
            decision_type=DecisionType.BUY,
            confidence=0.85,
            target_price=110.0,
            stop_loss_price=95.0,
            time_horizon=30,
            reasoning="技术指标显示买入信号",
            generated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=7)
        )
        session.add(decision)
        await session.commit()

        # 创建投票结果
        vote_result = VoteResult(
            decision_id=decision.id,
            model_id=ai_model.id,
            vote_type=DecisionType.BUY,
            confidence=0.9,
            signal_strength=0.8,
            reasoning="移动平均线金叉，RSI超卖反弹"
        )
        session.add(vote_result)
        await session.commit()

        # 验证决策检索
        retrieved_decision = await session.get(Decision, decision.id)
        assert retrieved_decision is not None
        assert retrieved_decision.stock_id == stock.id
        assert retrieved_decision.decision_type == DecisionType.BUY
        assert retrieved_decision.confidence == 0.85

        # 验证关联数据
        vote_results = await session.execute(
            select(VoteResult).where(VoteResult.decision_id == decision.id)
        )
        vote_results_list = vote_results.scalars().all()
        assert len(vote_results_list) == 1
        assert vote_results_list[0].model_id == ai_model.id

    @pytest.mark.asyncio
    async def test_decision_with_price_data(self, session: AsyncSession):
        """测试包含价格数据的决策流程"""
        # 创建测试股票
        stock = Stock(
            symbol="TEST002",
            name="测试股票2",
            market="A股",
            industry="金融",
            current_price=50.0
        )
        session.add(stock)
        await session.commit()

        # 创建历史价格数据
        for i in range(30):
            price_date = date.today() - timedelta(days=29 - i)
            stock_price = StockPrice(
                stock_id=stock.id,
                date=price_date,
                open_price=48.0 + i * 0.1,
                high_price=49.0 + i * 0.1,
                low_price=47.0 + i * 0.1,
                close_price=48.5 + i * 0.1,
                volume=1000000,
                adjusted_close=48.5 + i * 0.1
            )
            session.add(stock_price)
        await session.commit()

        # 使用决策引擎创建决策
        decision_manager = DecisionEngineManager(session)
        
        # 获取股票服务
        stock_service = StockService(session)
        test_stock = await stock_service.get_stock_by_symbol("TEST002")
        
        # 验证股票和价格数据
        assert test_stock is not None
        
        # 验证价格数据检索
        price_query = select(StockPrice).where(StockPrice.stock_id == test_stock.id)
        price_result = await session.execute(price_query)
        prices = price_result.scalars().all()
        assert len(prices) == 30

    @pytest.mark.asyncio
    async def test_decision_filtering_by_type(self, session: AsyncSession):
        """测试按决策类型过滤"""
        # 创建测试股票
        stock = Stock(
            symbol="TEST003",
            name="测试股票3",
            market="A股",
            current_price=75.0
        )
        session.add(stock)
        await session.commit()

        # 创建不同类型的决策
        decision_types = [DecisionType.BUY, DecisionType.SELL, DecisionType.HOLD]
        for i, decision_type in enumerate(decision_types):
            decision = Decision(
                stock_id=stock.id,
                decision_type=decision_type,
                confidence=0.7 + i * 0.1,
                target_price=80.0 + i * 5,
                stop_loss_price=70.0 - i * 5,
                time_horizon=20 + i * 5,
                reasoning=f"{decision_type.value}决策理由",
                generated_at=datetime.now() - timedelta(hours=i)
            )
            session.add(decision)
        await session.commit()

        # 测试按类型过滤
        buy_decisions_query = select(Decision).where(
            Decision.stock_id == stock.id,
            Decision.decision_type == DecisionType.BUY
        )
        buy_result = await session.execute(buy_decisions_query)
        buy_decisions = buy_result.scalars().all()
        assert len(buy_decisions) == 1
        assert buy_decisions[0].decision_type == DecisionType.BUY

        # 测试按时间范围过滤
        recent_decisions_query = select(Decision).where(
            Decision.stock_id == stock.id,
            Decision.generated_at >= datetime.now() - timedelta(hours=2)
        )
        recent_result = await session.execute(recent_decisions_query)
        recent_decisions = recent_result.scalars().all()
        assert len(recent_decisions) >= 2  # 最近2小时内创建的决策

    @pytest.mark.asyncio
    async def test_decision_confidence_threshold(self, session: AsyncSession):
        """测试决策置信度阈值"""
        # 创建测试股票
        stock = Stock(
            symbol="TEST004",
            name="测试股票4",
            market="A股",
            current_price=60.0
        )
        session.add(stock)
        await session.commit()

        # 创建不同置信度的决策
        confidences = [0.5, 0.7, 0.9]
        for confidence in confidences:
            decision = Decision(
                stock_id=stock.id,
                decision_type=DecisionType.BUY,
                confidence=confidence,
                target_price=65.0,
                stop_loss_price=55.0,
                time_horizon=25,
                reasoning=f"置信度{confidence}的决策",
                generated_at=datetime.now()
            )
            session.add(decision)
        await session.commit()

        # 测试高置信度决策过滤
        high_confidence_query = select(Decision).where(
            Decision.stock_id == stock.id,
            Decision.confidence >= 0.8
        )
        high_conf_result = await session.execute(high_confidence_query)
        high_conf_decisions = high_conf_result.scalars().all()
        assert len(high_conf_decisions) == 1
        assert high_conf_decisions[0].confidence == 0.9

    @pytest.mark.asyncio
    async def test_decision_expiration_logic(self, session: AsyncSession):
        """测试决策过期逻辑"""
        # 创建测试股票
        stock = Stock(
            symbol="TEST005",
            name="测试股票5",
            market="A股",
            current_price=40.0
        )
        session.add(stock)
        await session.commit()

        # 创建已过期和未过期的决策
        expired_decision = Decision(
            stock_id=stock.id,
            decision_type=DecisionType.BUY,
            confidence=0.8,
            target_price=45.0,
            stop_loss_price=35.0,
            time_horizon=15,
            reasoning="已过期决策",
            generated_at=datetime.now() - timedelta(days=10),
            expires_at=datetime.now() - timedelta(days=3)
        )
        
        active_decision = Decision(
            stock_id=stock.id,
            decision_type=DecisionType.SELL,
            confidence=0.75,
            target_price=35.0,
            stop_loss_price=45.0,
            time_horizon=20,
            reasoning="活跃决策",
            generated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=7)
        )
        
        session.add_all([expired_decision, active_decision])
        await session.commit()

        # 测试活跃决策查询
        active_query = select(Decision).where(
            Decision.stock_id == stock.id,
            Decision.expires_at > datetime.now()
        )
        active_result = await session.execute(active_query)
        active_decisions = active_result.scalars().all()
        assert len(active_decisions) == 1
        assert active_decisions[0].decision_type == DecisionType.SELL

    @pytest.mark.asyncio
    async def test_decision_voting_aggregation(self, session: AsyncSession):
        """测试决策投票聚合"""
        # 创建测试股票
        stock = Stock(
            symbol="TEST006",
            name="测试股票6",
            market="A股",
            current_price=55.0
        )
        session.add(stock)
        await session.commit()

        # 创建决策
        decision = Decision(
            stock_id=stock.id,
            decision_type=DecisionType.HOLD,
            confidence=0.6,
            target_price=60.0,
            stop_loss_price=50.0,
            time_horizon=10,
            reasoning="初始决策",
            generated_at=datetime.now()
        )
        session.add(decision)
        await session.commit()

        # 创建多个AI模型和投票结果
        model_weights = [0.4, 0.3, 0.3]
        vote_types = [DecisionType.BUY, DecisionType.SELL, DecisionType.HOLD]
        
        for i, (weight, vote_type) in enumerate(zip(model_weights, vote_types)):
            model = AIModel(
                name=f"测试模型{i+1}",
                model_type=ModelType.TECHNICAL,
                description=f"测试模型{i+1}描述",
                weight=weight,
                is_active=True
            )
            session.add(model)
            await session.commit()

            vote_result = VoteResult(
                decision_id=decision.id,
                model_id=model.id,
                vote_type=vote_type,
                confidence=0.7 + i * 0.1,
                signal_strength=0.5 + i * 0.2,
                reasoning=f"模型{i+1}投票理由"
            )
            session.add(vote_result)
        
        await session.commit()

        # 验证投票结果聚合
        votes_query = select(VoteResult).where(VoteResult.decision_id == decision.id)
        votes_result = await session.execute(votes_query)
        votes = votes_result.scalars().all()
        
        assert len(votes) == 3
        
        # 验证投票类型分布
        vote_types_count = {}
        for vote in votes:
            vote_types_count[vote.vote_type] = vote_types_count.get(vote.vote_type, 0) + 1
        
        assert vote_types_count[DecisionType.BUY] == 1
        assert vote_types_count[DecisionType.SELL] == 1
        assert vote_types_count[DecisionType.HOLD] == 1